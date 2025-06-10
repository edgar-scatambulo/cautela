
import * as React from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Equipment, SystemUser, PoliceOfficer, Loan } from './types';
import { UserRole, EquipmentType, LoanStatus } from './types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  isAuthenticated: boolean;
  currentUser: SystemUser | null;
  equipments: Equipment[];
  users: SystemUser[];
  officers: PoliceOfficer[];
  loans: Loan[];

  login: (user: SystemUser) => void;
  logout: () => void;

  addEquipment: (equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => Equipment;
  updateEquipment: (equipment: Equipment) => void;
  deleteEquipment: (equipmentId: string) => void;

  addOfficer: (officer: Omit<PoliceOfficer, 'id' | 'createdAt' | 'updatedAt'>) => PoliceOfficer;
  updateOfficer: (officer: PoliceOfficer) => void;
  deleteOfficer: (officerId: string) => void;

  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'loanedByUserId' | 'equipment'> & { equipmentIds: string[] }) => Loan;
  updateLoanStatus: (loanId: string, status: LoanStatus, equipmentIdsToReturn?: string[], returnDate?: string, returnTime?: string, returnObservation?: string, returnedToUserId?: string) => void;


  addUser: (userData: Omit<SystemUser, 'id' | 'createdAt' | 'updatedAt'>) => SystemUser;
  updateUser: (userData: Partial<SystemUser> & { id: string }) => void;
  deleteUser: (userId: string) => void;
}

// Usar IDs fixos para dados iniciais para consistência se eles forem usados em testes ou como referência
const initialAdminUserId = '00000000-0000-0000-0000-000000000001';
const initialEquipmentId1 = 'eq-00000000-0000-0000-0000-000000000001';
const initialEquipmentId2 = 'eq-00000000-0000-0000-0000-000000000002';
const initialEquipmentId3 = 'eq-00000000-0000-0000-0000-000000000003';
const initialOfficerId1 = 'off-00000000-0000-0000-0000-000000000001';
const initialOfficerId2 = 'off-00000000-0000-0000-0000-000000000002';

const initialAdminUser: SystemUser = {
  id: initialAdminUserId,
  name: 'Admin User',
  email: 'admin@cautela.com',
  username: 'admin',
  password: 'tricolor',
  role: UserRole.ADMIN,
  isActive: true,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};


export const useStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      isAuthenticated: false,
      currentUser: null,
      equipments: [
        { id: initialEquipmentId1, type: EquipmentType.CELULAR, brand: 'Samsung Galaxy S21', serialNumber: 'SN12345A', status: 'Disponível', createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
        { id: initialEquipmentId2, type: EquipmentType.IMPRESSORA, brand: 'HP LaserJet Pro', serialNumber: 'SN67890B', status: 'Disponível', createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
        { id: initialEquipmentId3, type: EquipmentType.RADIO, brand: 'Motorola APX 6000', serialNumber: 'SN54321C', status: 'Em Cautela', createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
      ],
      users: [initialAdminUser],
      officers: [
        { id: initialOfficerId1, name: 'SGT Silva', fullName: 'Fulano Silva de Tal', functionalId: 'silva@email.com', rank: 'Sargento', unit: '1º BPM', createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
        { id: initialOfficerId2, name: 'CB Costa', fullName: 'Beltrano Costa Oliveira', functionalId: '(11) 98765-4321', rank: 'Cabo', unit: 'ROTAM', createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
      ],
      loans: [],

      login: (user) => set((state) => {
        state.isAuthenticated = true;
        state.currentUser = user;
      }),
      logout: () => set((state) => {
        state.isAuthenticated = false;
        state.currentUser = null;
      }),

      addEquipment: (equipmentData) => {
        const newEquipment: Equipment = {
          ...equipmentData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => {
          state.equipments.push(newEquipment);
        });
        return newEquipment;
      },
      updateEquipment: (updatedEquipment) => {
        set((state) => {
          const index = state.equipments.findIndex(e => e.id === updatedEquipment.id);
          if (index !== -1) {
            state.equipments[index] = { ...state.equipments[index], ...updatedEquipment, updatedAt: new Date().toISOString() };
          }
        });
      },
      deleteEquipment: (equipmentId) => {
        set((state) => {
          const isActiveLoan = state.loans.some(loan =>
            loan.equipment.some(eq => eq.id === equipmentId) && loan.status === LoanStatus.ENTREGUE
          );
          if (isActiveLoan) {
            throw new Error("Equipamento não pode ser excluído pois está em uma cautela ativa.");
          }
          state.equipments = state.equipments.filter(e => e.id !== equipmentId);
        });
      },
      addOfficer: (officerData) => {
         const newOfficer: PoliceOfficer = {
          ...officerData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => {
          state.officers.push(newOfficer);
        });
        return newOfficer;
      },
      updateOfficer: (updatedOfficer) => {
        set((state) => {
          const index = state.officers.findIndex(o => o.id === updatedOfficer.id);
          if (index !== -1) {
            state.officers[index] = { ...state.officers[index], ...updatedOfficer, updatedAt: new Date().toISOString() };
          }
        });
      },
      deleteOfficer: (officerId) => {
        set((state) => {
          const isActiveLoan = state.loans.some(loan =>
            loan.officerId === officerId && loan.status === LoanStatus.ENTREGUE
          );
          if (isActiveLoan) {
            throw new Error("Policial não pode ser excluído pois está vinculado a uma cautela ativa.");
          }
          state.officers = state.officers.filter(o => o.id !== officerId);
        });
      },
      addLoan: (loanData) => {
        const currentUser = get().currentUser;
        if (!currentUser) throw new Error("Usuário não autenticado para registrar cautela.");

        const equipmentDetails = loanData.equipmentIds.map(id => {
          const eq = get().equipments.find(e => e.id === id);
          if (!eq) throw new Error(`Equipamento com ID ${id} não encontrado.`);
          if (eq.status !== 'Disponível') throw new Error(`Equipamento ${eq.brand} (Patrimônio: ${eq.serialNumber}) não está disponível.`);
          return eq;
        });

        const newLoan: Loan = {
          id: uuidv4(),
          officerId: loanData.officerId,
          equipment: equipmentDetails,
          loanDate: loanData.loanDate,
          loanTime: loanData.loanTime,
          expectedReturnDate: loanData.expectedReturnDate,
          loanObservation: loanData.loanObservation,
          status: LoanStatus.ENTREGUE,
          loanedByUserId: currentUser.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => {
          state.loans.push(newLoan);
          loanData.equipmentIds.forEach(eqId => {
            const equipmentIndex = state.equipments.findIndex(e => e.id === eqId);
            if (equipmentIndex !== -1) {
              state.equipments[equipmentIndex].status = 'Em Cautela';
              state.equipments[equipmentIndex].updatedAt = new Date().toISOString();
            }
          });
        });
        return newLoan;
      },
      updateLoanStatus: (loanId, status, equipmentIdsToReturn, returnDate, returnTime, returnObservation, returnedToUserId) => {
        set(state => {
          const loanIndex = state.loans.findIndex(l => l.id === loanId);
          if (loanIndex !== -1) {
            const currentLoan = state.loans[loanIndex];
            currentLoan.status = status; // Update status to Devolvido
            currentLoan.updatedAt = new Date().toISOString();
            currentLoan.actualReturnDate = returnDate || new Date().toISOString().split('T')[0];
            currentLoan.actualReturnTime = returnTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'});
            currentLoan.returnObservation = returnObservation;
            currentLoan.returnedToUserId = returnedToUserId || get().currentUser?.id;

            const idsToUpdate = equipmentIdsToReturn && equipmentIdsToReturn.length > 0 
              ? equipmentIdsToReturn 
              : currentLoan.equipment.map(eq => eq.id); // If no specific IDs, assume all are returned

            idsToUpdate.forEach(eqId => {
              const equipmentIndex = state.equipments.findIndex(e => e.id === eqId);
              if (equipmentIndex !== -1) {
                // Only change status if it was part of this loan
                if (currentLoan.equipment.some(loanEq => loanEq.id === eqId)) {
                     state.equipments[equipmentIndex].status = 'Disponível';
                     state.equipments[equipmentIndex].updatedAt = new Date().toISOString();
                }
              }
            });

            // Check if all equipment in the loan have been marked as 'Disponível'
            // This logic assumes that if any equipment from the loan is returned, the loan status becomes Devolvido.
            // If partial returns should keep the loan 'Entregue', this logic needs adjustment.
            // For now, any return action makes the whole loan 'Devolvido'.
          }
        });
      },
      addUser: (userData) => {
        if (!userData.password) {
          throw new Error("Senha é obrigatória para novos usuários.");
        }
        const existingUserByUsername = get().users.find(u => u.username === userData.username);
        if (existingUserByUsername) {
          throw new Error(`Nome de usuário "${userData.username}" já existe.`);
        }
        const existingUserByEmail = get().users.find(u => u.email === userData.email);
        if (existingUserByEmail) {
          throw new Error(`Email "${userData.email}" já está em uso.`);
        }

        const newUser: SystemUser = {
          ...userData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => {
          state.users.push(newUser);
        });
        return newUser;
      },
      updateUser: (userData) => {
        set(state => {
          const userIndex = state.users.findIndex(u => u.id === userData.id);
          if (userIndex === -1) {
            throw new Error("Usuário não encontrado para atualização.");
          }

          if (userData.username && userData.username !== state.users[userIndex].username) {
            const existingUserByUsername = state.users.find(u => u.username === userData.username && u.id !== userData.id);
            if (existingUserByUsername) {
              throw new Error(`Nome de usuário "${userData.username}" já existe.`);
            }
          }
          if (userData.email && userData.email !== state.users[userIndex].email) {
            const existingUserByEmail = state.users.find(u => u.email === userData.email && u.id !== userData.id);
            if (existingUserByEmail) {
              throw new Error(`Email "${userData.email}" já está em uso.`);
            }
          }

          const updatedUser = { ...state.users[userIndex], ...userData, updatedAt: new Date().toISOString() };

          if (userData.password === "" || userData.password === undefined) {
            updatedUser.password = state.users[userIndex].password;
          }

          state.users[userIndex] = updatedUser;
        });
      },
      deleteUser: (userId) => {
        set(state => {
          if (state.currentUser?.id === userId) {
            throw new Error("Você não pode excluir sua própria conta.");
          }
          const userToDelete = state.users.find(u => u.id === userId);
          if (!userToDelete) {
            throw new Error("Usuário não encontrado para exclusão.");
          }
          // Proteção para não excluir o admin inicial se ele for o único administrador
          if (userToDelete.id === initialAdminUserId) {
            const adminCount = state.users.filter(u => u.role === UserRole.ADMIN && u.isActive).length;
            if (adminCount <= 1) {
              throw new Error("Não é possível excluir o administrador padrão inicial se ele for o único administrador ativo.");
            }
          }
          state.users = state.users.filter(u => u.id !== userId);
        });
      },
    })),
    {
      name: 'cautela-control-storage', // Nome da chave no localStorage
      storage: createJSONStorage(() => localStorage), // Define o localStorage como meio de persistência
      partialize: (state) => ({
        equipments: state.equipments,
        users: state.users,
        officers: state.officers,
        loans: state.loans,
      }),
    }
  )
);

export const AppStateProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return children;
};
