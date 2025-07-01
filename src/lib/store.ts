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
} from 'firebase/firestore';
import type { Equipment, SystemUser, PoliceOfficer, Loan } from './types';
import { LoanStatus } from './types';

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
  login: (credentials: Pick<SystemUser, 'username' | 'password'>) => Promise<void>;
  logout: () => Promise<void>;
  
  // User Actions
  addUser: (userData: Omit<SystemUser, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUser: (userData: Partial<SystemUser> & { id: string }) => Promise<void>;
  // deleteUser is not supported on client-side for other users

  // Equipment Actions
  addEquipment: (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEquipment: (equipment: Equipment) => Promise<void>;
  deleteEquipment: (equipmentId: string) => Promise<void>;

  // Officer Actions
  addOfficer: (officerData: Omit<PoliceOfficer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateOfficer: (officer: PoliceOfficer) => Promise<void>;
  deleteOfficer: (officerId: string) => Promise<void>;
  
  // Loan Actions
  addLoan: (loanData: Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'loanedByUserId' >) => Promise<void>;
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
      return () => {}; // Return a no-op unsubscribe function
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = convertTimestamps({ id: userDocSnap.id, ...userDocSnap.data() }) as SystemUser;
          set({ currentUser: userData, isLoading: true });

          // Once authenticated, set up real-time listeners for all collections
          const unsubscribers = [
            onSnapshot(collection(db, 'equipments'), (snapshot) => {
              const equipments = snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as Equipment[];
              set({ equipments });
            }),
            onSnapshot(collection(db, 'officers'), (snapshot) => {
              const officers = snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as PoliceOfficer[];
              set({ officers });
            }),
            onSnapshot(collection(db, 'loans'), (snapshot) => {
              const loans = snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as Loan[];
              set({ loans });
            }),
             onSnapshot(collection(db, 'users'), (snapshot) => {
              const users = snapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as SystemUser[];
              set({ users });
            }),
          ];
          set({ isLoading: false });
          // This part of returning unsubscribers from init is complex, let's simplify.
          // The main auth unsubscribe is what we return. Sub-collection listeners live with the session.
        } else {
          // User exists in Auth but not in Firestore DB. Log them out.
          await signOut(auth);
          set({ currentUser: null, isLoading: false });
        }
      } else {
        // No user
        set({ currentUser: null, isLoading: false });
      }
      set({ authInitialized: true });
    });
    return unsubscribe;
  },

  login: async ({ username, password }) => {
    if (!auth || !db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Usuário não encontrado.");
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as SystemUser;

    if (!userData.isActive) {
        throw new Error("Usuário inativo.");
    }
    
    if (!password) {
      throw new Error("Senha é obrigatória.");
    }

    await signInWithEmailAndPassword(auth, userData.email, password);
    // onAuthStateChanged in init() will handle setting the user state
  },

  logout: async () => {
    if (auth) {
      await signOut(auth);
    }
    set({ currentUser: null, equipments: [], officers: [], loans: [], users: [] });
  },

  addUser: async (userData) => {
    if (!auth || !db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);

    if (!userData.password) throw new Error("Senha é obrigatória para criar usuário.");
    
    // Check for unique username
    const usernameQuery = query(collection(db, 'users'), where('username', '==', userData.username));
    const usernameSnap = await getDocs(usernameQuery);
    if (!usernameSnap.empty) throw new Error("Nome de usuário já existe.");

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const firebaseUser = userCredential.user;

    // Create user document in Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const { password, ...userDataForFirestore } = userData; // Don't store password in Firestore
    await addDoc(collection(db, 'users'), {
        ...userDataForFirestore,
        id: firebaseUser.uid, // ensure doc id matches auth uid
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
  },

  updateUser: async (userData) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);

    const { id, ...dataToUpdate } = userData;
    if (!id) throw new Error("ID do usuário é necessário para atualização.");
    const userDocRef = doc(db, 'users', id);
    // Do not update password here
    delete dataToUpdate.password;
    await updateDoc(userDocRef, { ...dataToUpdate, updatedAt: serverTimestamp() });
  },

  addEquipment: async (equipmentData) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    await addDoc(collection(db, 'equipments'), {
      ...equipmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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

  addOfficer: async (officerData) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    await addDoc(collection(db, 'officers'), {
      ...officerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error("Usuário não autenticado para registrar cautela.");

    const batch = writeBatch(db);

    // Add the new loan
    const newLoanRef = doc(collection(db, 'loans'));
    batch.set(newLoanRef, {
      ...loanData,
      status: LoanStatus.ENTREGUE,
      loanedByUserId: currentUser.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update equipment statuses
    loanData.equipmentIds.forEach(eqId => {
      const equipDocRef = doc(db, 'equipments', eqId);
      batch.update(equipDocRef, { status: 'Em Cautela', updatedAt: serverTimestamp() });
    });

    await batch.commit();
  },

  updateLoanStatus: async (loanId, status, equipmentIdsToReturn, returnDate, returnTime, returnObservation) => {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error("Usuário não autenticado.");

    const batch = writeBatch(db);
    const loanRef = doc(db, 'loans', loanId);
    
    // Update loan document
    batch.update(loanRef, {
      status: status,
      actualReturnDate: returnDate || new Date().toISOString().split('T')[0],
      actualReturnTime: returnTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      returnObservation: returnObservation || '',
      returnedToUserId: currentUser.id,
      updatedAt: serverTimestamp(),
    });

    // Update equipment statuses
    if (equipmentIdsToReturn) {
        equipmentIdsToReturn.forEach(eqId => {
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
