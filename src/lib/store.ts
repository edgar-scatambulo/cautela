
import { create } from 'zustand';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  query,
  where,
  Timestamp,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { Equipment, SystemUser, PoliceOfficer, Loan } from './types';
import { LoanStatus, UserRole } from './types';

// Helper to convert Firestore Timestamps to ISO strings
const convertTimestamps = (docData: any) => {
  const data = { ...docData };
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }
  return data;
};

interface AppState {
  // State
  authInitialized: boolean;
  isLoading: boolean;
  currentUser: SystemUser | null;
  equipments: Equipment[];
  users: SystemUser[];
  officers: PoliceOfficer[];
  loans: Loan[];

  // Auth Actions
  init: () => () => void; // Returns the unsubscribe function
  login: (credentials: Pick<SystemUser, 'email' | 'password'>) => Promise<void>;
  logout: () => Promise<void>;
  signup: (signupData: Omit<SystemUser, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'isActive'>) => Promise<void>;
  
  // User Actions
  addUser: (userData: Omit<SystemUser, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUser: (userData: Partial<SystemUser> & { id: string }) => Promise<void>;
  // deleteUser is not supported on client-side for other users

  // Equipment Actions
  addEquipment: (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addMultipleEquipments: (equipmentsData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  updateEquipment: (equipment: Equipment) => Promise<void>;
  deleteEquipment: (equipmentId: string) => Promise<void>;
  deleteMultipleEquipments: (equipmentIds: string[]) => Promise<void>;

  // Officer Actions
  addOfficer: (officerData: Omit<PoliceOfficer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addMultipleOfficers: (officersData: Omit<PoliceOfficer, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  updateOfficer: (officer: PoliceOfficer) => Promise<void>;
  deleteOfficer: (officerId: string) => Promise<void>;
  
  // Loan Actions
  addLoan: (loanData: Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'loanedByUserId' >) => Promise<{ newLoan: Loan, officer: PoliceOfficer, loanedEquipments: Equipment[] }>;
  updateLoanStatus: (loanId: string, status: LoanStatus, equipmentIdsToReturn?: string[], returnDate?: string, returnTime?: string, returnObservation?: string, returnedToUserId?: string) => Promise<void>;
}

const FIREBASE_NOT_CONFIGURED_ERROR = "Firebase não está configurado. Verifique as variáveis de ambiente do seu projeto.";

export const useStore = create<AppState>((set, get) => ({
  authInitialized: false,
  isLoading: true,
  currentUser: null,
  equipments: [],
  users: [],
  officers: [],
  loans: [],

  init: () => {
    if (!auth || !db) {
      console.warn(FIREBASE_NOT_CONFIGURED_ERROR);
      set({ authInitialized: true, isLoading: false, currentUser: null });
      return () => {};
    }

    let collectionUnsubscribers: (() => void)[] = [];

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous listeners before setting up new ones
      collectionUnsubscribers.forEach(unsub => unsub());
      collectionUnsubscribers = [];

      if (firebaseUser) {
        set({ isLoading: true });
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = convertTimestamps({ id: userDocSnap.id, ...userDocSnap.data() }) as SystemUser;
          set({ currentUser: userData });

          // Setup real-time listeners for collections
          collectionUnsubscribers.push(
            onSnapshot(collection(db, 'equipments'), (snapshot) => {
              const equipments = snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as Equipment[];
              set({ equipments });
            })
          );
          collectionUnsubscribers.push(
            onSnapshot(collection(db, 'officers'), (snapshot) => {
              const officers = snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as PoliceOfficer[];
              set({ officers });
            })
          );
          collectionUnsubscribers.push(
            onSnapshot(collection(db, 'loans'), (snapshot) => {
              const loans = snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as Loan[];
              set({ loans });
            })
          );

          // Only Admins can listen to the full users collection
          if (userData.role === UserRole.ADMIN) {
            collectionUnsubscribers.push(
              onSnapshot(collection(db, 'users'), (snapshot) => {
                const users = snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as SystemUser[];
                set({ users });
              })
            );
          } else {
            // Non-admins only need their own user object
            set({ users: [userData] });
          }

          set({ isLoading: false });
        } else {
          // User exists in Auth but not in Firestore DB. Log them out.
          await signOut(auth);
          set({ currentUser: null, isLoading: false });
        }
      } else {
        // No user is signed in, clear all state
        set({ currentUser: null, isLoading: false, equipments: [], officers: [], loans: [], users: [] });
      }
      set({ authInitialized: true });
    });

    // This is returned to be called on app cleanup
    return () => {
      authUnsubscribe();
      collectionUnsubscribers.forEach(unsub => unsub());
    };
  },

  login: async ({ email, password }) => {
    if (!auth || !db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // After successful auth, check if user is in our Firestore 'users' collection and is active
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await signOut(auth);
        throw new Error("Dados de usuário não encontrados no sistema.");
      }

      const userData = userDocSnap.data() as SystemUser;
      if (!userData.isActive) {
        await signOut(auth);
        throw new Error("Esta conta de usuário está inativa.");
      }
      // Login is successful, onAuthStateChanged in init() will handle setting the full user state.
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error("Email ou senha inválidos.");
        }
        if (error.code === 'auth/configuration-not-found') {
           throw new Error("Configuração do Firebase não encontrada. Verifique se o arquivo .env.local está correto e reinicie o servidor de desenvolvimento.");
       }
        throw error; // Re-throw other errors
    }
  },

  logout: async () => {
    if (auth) {
      await signOut(auth);
    }
    // The onAuthStateChanged listener in init() will handle clearing the state.
    set({ currentUser: null, equipments: [], officers: [], loans: [], users: [] });
  },

  signup: async (signupData) => {
    if (!auth || !db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    if (!signupData.password) throw new Error("Senha é obrigatória para criar usuário.");

    const usersCollectionRef = collection(db, 'users');
    const allUsersSnap = await getDocs(usersCollectionRef);

    if (!allUsersSnap.empty) {
        throw new Error("O sistema já possui um usuário administrador. O cadastro só pode ser feito uma vez.");
    }

    const usernameQuery = query(usersCollectionRef, where('username', '==', signupData.username));
    const usernameSnap = await getDocs(usernameQuery);
    if (!usernameSnap.empty) throw new Error("Nome de usuário já existe.");

    // Check for email in auth, not just firestore
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
        const firebaseUser = userCredential.user;

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const { password, ...userDataForFirestore } = signupData;

        await setDoc(userDocRef, {
            ...userDataForFirestore,
            role: UserRole.ADMIN,
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("Este email já está em uso por outra conta.");
        }
        if (error.code === 'auth/configuration-not-found') {
           throw new Error("Configuração do Firebase não encontrada. Verifique se o arquivo .env.local está correto e reinicie o servidor de desenvolvimento.");
       }
        throw error;
    }
  },

  addUser: async (userData) => {
    if (!auth || !db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    if (!userData.password) throw new Error("Senha é obrigatória para criar usuário.");
    
    // Check for unique username and email before creating in Auth
    const usernameQuery = query(collection(db, 'users'), where('username', '==', userData.username));
    const usernameSnap = await getDocs(usernameQuery);
    if (!usernameSnap.empty) throw new Error("Nome de usuário já existe.");
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const firebaseUser = userCredential.user;

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const { password, ...userDataForFirestore } = userData;
        
        await setDoc(userDocRef, {
            ...userDataForFirestore,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("Este email já está em uso por outra conta.");
        }
        throw error;
    }
  },

  updateUser: async (userData) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    const { id, ...dataToUpdate } = userData;
    if (!id) throw new Error("ID do usuário é necessário para atualização.");
    const userDocRef = doc(db, 'users', id);
    delete dataToUpdate.password;
    await updateDoc(userDocRef, { ...dataToUpdate, updatedAt: serverTimestamp() });
  },

  addEquipment: async (equipmentData) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    const q = query(collection(db, 'equipments'), where('serialNumber', '==', equipmentData.serialNumber));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error(`Equipamento com o patrimônio '${equipmentData.serialNumber}' já existe.`);
    }

    await addDoc(collection(db, 'equipments'), {
      ...equipmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  addMultipleEquipments: async (equipmentsData) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);

    const serialNumbersInCsv = equipmentsData.map(e => e.serialNumber);
    const duplicateSerialNumbersInCsv = serialNumbersInCsv.filter((item, index) => serialNumbersInCsv.indexOf(item) !== index);
    if (duplicateSerialNumbersInCsv.length > 0) {
        throw new Error(`O arquivo CSV contém números de patrimônio duplicados: ${duplicateSerialNumbersInCsv.join(', ')}`);
    }

    const equipmentsCollectionRef = collection(db, 'equipments');
    const existingEquipmentsSnapshot = await getDocs(query(equipmentsCollectionRef, where('serialNumber', 'in', serialNumbersInCsv)));
    
    const existingSerialNumbers = existingEquipmentsSnapshot.docs.map(doc => doc.data().serialNumber);
    if (existingSerialNumbers.length > 0) {
        throw new Error(`Os seguintes números de patrimônio já existem no banco de dados: ${existingSerialNumbers.join(', ')}`);
    }

    const batch = writeBatch(db);
    
    equipmentsData.forEach(equipment => {
      const newEquipmentRef = doc(collection(db, 'equipments'));
      
      const cleanedEquipmentData: { [key: string]: any } = { ...equipment };

      Object.keys(cleanedEquipmentData).forEach(key => {
        if (cleanedEquipmentData[key] === undefined) {
          delete cleanedEquipmentData[key];
        }
      });
      
      batch.set(newEquipmentRef, {
        ...cleanedEquipmentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  },

  updateEquipment: async (equipment) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    const { id, ...dataToUpdate } = equipment;
    const equipDocRef = doc(db, 'equipments', id);
    await updateDoc(equipDocRef, { ...dataToUpdate, updatedAt: serverTimestamp() });
  },

  deleteEquipment: async (equipmentId) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    const loansQuery = query(collection(db, 'loans'), where('equipmentIds', 'array-contains', equipmentId), where('status', '==', 'Entregue'));
    const loansSnap = await getDocs(loansQuery);
    if (!loansSnap.empty) {
      throw new Error("Equipamento não pode ser excluído pois está em uma cautela ativa.");
    }
    await deleteDoc(doc(db, 'equipments', equipmentId));
  },
  
  deleteMultipleEquipments: async (equipmentIds) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    if (equipmentIds.length === 0) return;

    const loansQuery = query(
        collection(db, 'loans'),
        where('equipmentIds', 'array-contains-any', equipmentIds),
        where('status', '==', LoanStatus.ENTREGUE)
    );
    const loansSnap = await getDocs(loansQuery);

    if (!loansSnap.empty) {
        const activeLoanEquipmentIds = new Set<string>();
        loansSnap.docs.forEach(loanDoc => {
            loanDoc.data().equipmentIds.forEach((id: string) => {
                if (equipmentIds.includes(id)) {
                    activeLoanEquipmentIds.add(id);
                }
            });
        });

        if (activeLoanEquipmentIds.size > 0) {
            const problematicEquipments = get().equipments
                .filter(e => activeLoanEquipmentIds.has(e.id))
                .map(e => `${e.brand} (${e.serialNumber})`);
            
            throw new Error(`Exclusão falhou. Os seguintes equipamentos estão em cautelas ativas: ${problematicEquipments.join(', ')}`);
        }
    }
    
    const batch = writeBatch(db);
    equipmentIds.forEach(id => {
        const equipDocRef = doc(db, 'equipments', id);
        batch.delete(equipDocRef);
    });

    await batch.commit();
  },

  addOfficer: async (officerData) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    const q = query(collection(db, 'officers'), where('functionalId', '==', officerData.functionalId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error(`Policial com o contato '${officerData.functionalId}' já existe.`);
    }

    await addDoc(collection(db, 'officers'), {
      ...officerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  addMultipleOfficers: async (officersData) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    
    // Check for duplicates within the CSV file
    const functionalIdsInCsv = officersData.map(o => o.functionalId);
    const duplicateFunctionalIdsInCsv = functionalIdsInCsv.filter((item, index) => functionalIdsInCsv.indexOf(item) !== index);
    if (duplicateFunctionalIdsInCsv.length > 0) {
        throw new Error(`O arquivo CSV contém contatos duplicados: ${duplicateFunctionalIdsInCsv.join(', ')}`);
    }

    // Check if any of the contacts already exist in the database
    const officersCollectionRef = collection(db, 'officers');
    const existingFunctionalIds = new Set<string>();

    // Firestore 'in' query can take up to 30 items. Chunking the array to handle larger imports.
    const chunks: string[][] = [];
    for (let i = 0; i < functionalIdsInCsv.length; i += 30) {
        chunks.push(functionalIdsInCsv.slice(i, i + 30));
    }

    for (const chunk of chunks) {
        if (chunk.length === 0) continue;
        const existingOfficersSnapshot = await getDocs(query(officersCollectionRef, where('functionalId', 'in', chunk)));
        existingOfficersSnapshot.docs.forEach(doc => {
            existingFunctionalIds.add(doc.data().functionalId);
        });
    }

    if (existingFunctionalIds.size > 0) {
        throw new Error(`Os seguintes contatos já existem no banco de dados: ${Array.from(existingFunctionalIds).join(', ')}`);
    }

    const batch = writeBatch(db);
    
    officersData.forEach(officer => {
      const newOfficerRef = doc(collection(db, 'officers'));
      
      const cleanedOfficerData: { [key: string]: any } = { ...officer };

      Object.keys(cleanedOfficerData).forEach(key => {
        if (cleanedOfficerData[key] === undefined) {
          delete cleanedOfficerData[key];
        }
      });
      
      batch.set(newOfficerRef, {
        ...cleanedOfficerData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  },

  updateOfficer: async (officer) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    const { id, ...dataToUpdate } = officer;
    const officerDocRef = doc(db, 'officers', id);
    await updateDoc(officerDocRef, { ...dataToUpdate, updatedAt: serverTimestamp() });
  },

  deleteOfficer: async (officerId) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    const loansQuery = query(collection(db, 'loans'), where('officerId', '==', officerId), where('status', '==', 'Entregue'));
    const loansSnap = await getDocs(loansQuery);
    if (!loansSnap.empty) {
      throw new Error("Policial não pode ser excluído pois está vinculado a uma cautela ativa.");
    }
    await deleteDoc(doc(db, 'officers', officerId));
  },

  addLoan: async (loanData) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    const { currentUser, officers, equipments } = get();
    if (!currentUser) {
      throw new Error("Usuário não autenticado para registrar cautela.");
    }

    const batch = writeBatch(db);
    const newLoanRef = doc(collection(db, 'loans'));
    const timestamp = serverTimestamp();

    const finalLoanData = {
      ...loanData,
      status: LoanStatus.ENTREGUE,
      loanedByUserId: currentUser.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    batch.set(newLoanRef, finalLoanData);

    loanData.equipmentIds.forEach(eqId => {
      const equipDocRef = doc(db, 'equipments', eqId);
      batch.update(equipDocRef, { status: 'Em Cautela', updatedAt: timestamp });
    });

    await batch.commit();

    const officer = officers.find(o => o.id === loanData.officerId);
    if (!officer) throw new Error("Policial não encontrado para notificação.");
    
    const loanedEquipments = loanData.equipmentIds.map(id => equipments.find(e => e.id === id)).filter(Boolean) as Equipment[];

    return { 
      newLoan: { ...loanData, id: newLoanRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: LoanStatus.ENTREGUE, loanedByUserId: currentUser.id },
      officer,
      loanedEquipments
    };
  },

  updateLoanStatus: async (loanId, status, equipmentIdsToReturn, returnDate, returnTime, returnObservation, returnedToUserId) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    if (!returnedToUserId) throw new Error("O Rádio Operador recebedor é obrigatório.");

    const batch = writeBatch(db);
    const loanRef = doc(db, 'loans', loanId);
    
    const loanDoc = await getDoc(loanRef);
    if (!loanDoc.exists()) {
      throw new Error("Cautela não encontrada.");
    }
    const currentLoanData = loanDoc.data() as Loan;
    
    const equipmentToReturnIds = equipmentIdsToReturn ?? currentLoanData.equipmentIds;

    const remainingEquipmentIds = currentLoanData.equipmentIds.filter(id => !equipmentToReturnIds.includes(id));

    if (remainingEquipmentIds.length > 0 && equipmentToReturnIds.length > 0) {
      batch.update(loanRef, {
        equipmentIds: remainingEquipmentIds,
        updatedAt: serverTimestamp(),
        loanObservation: `${currentLoanData.loanObservation || ''}\n[Devolução parcial registrada em ${new Date().toLocaleString('pt-BR')}]`.trim()
      });

      const newReturnedLoanRef = doc(collection(db, 'loans'));
      batch.set(newReturnedLoanRef, {
        ...currentLoanData,
        id: newReturnedLoanRef.id,
        equipmentIds: equipmentToReturnIds,
        status: LoanStatus.DEVOLVIDO,
        actualReturnDate: returnDate || new Date().toISOString().split('T')[0],
        actualReturnTime: returnTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        returnObservation: returnObservation || '',
        returnedToUserId: returnedToUserId,
        updatedAt: serverTimestamp(),
        loanObservation: `[Cautela original: ${loanId}] ${currentLoanData.loanObservation || ''}`.trim()
      });

    } else {
      batch.update(loanRef, {
        status: status,
        actualReturnDate: returnDate || new Date().toISOString().split('T')[0],
        actualReturnTime: returnTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        returnObservation: returnObservation || '',
        returnedToUserId: returnedToUserId,
        updatedAt: serverTimestamp(),
      });
    }

    if (equipmentToReturnIds) {
        equipmentToReturnIds.forEach(eqId => {
            const equipDocRef = doc(db, 'equipments', eqId);
            batch.update(equipDocRef, { status: 'Disponível', updatedAt: serverTimestamp() });
        });
    }

    await batch.commit();
  },
}));

export const AppStateProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return children;
};
