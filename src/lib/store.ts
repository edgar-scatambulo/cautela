
import * as React from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Equipment, SystemUser, PoliceOfficer, Loan } from './types'; // Interfaces
import { UserRole, EquipmentType, LoanStatus } from './types'; // Enums (used as values)
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
  updateLoanStatus: (loanId: string, status: LoanStatus, returnDate?: string, returnTime?: string, returnObservation?: string, returnedToUserId?: string) => void;

  addUser: (userData: Omit<SystemUser, 'id' | 'createdAt' | 'updatedAt'>) => SystemUser;
  updateUser: (userData: Partial<SystemUser> & { id: string }) => void;
  deleteUser: (userId: string) => void;
}

const initialAdminUser: SystemUser = {
  id: uuidv4(),
  name: 'Admin User',
  email: 'admin@cautela.com',
  username: 'admin',
  password: 'tricolor', // Added password
  role: UserRole.ADMIN,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useStore = create<AppState>()(
  immer((set, get) => ({
    isAuthenticated: false,
    currentUser: null,
    equipments: [
      { id: uuidv4(), type: EquipmentType.CELULAR, brand: 'Samsung', model: 'Galaxy S21', serialNumber: 'SN12345A', status: 'Disponível', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: uuidv4(), type: EquipmentType.IMPRESSORA, brand: 'HP', model: 'LaserJet Pro', serialNumber: 'SN67890B', status: 'Disponível', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: uuidv4(), type: EquipmentType.RADIO, brand: 'Motorola', model: 'APX 6000', serialNumber: 'SN54321C', status: 'Em Cautela', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    users: [initialAdminUser],
    officers: [
      { id: uuidv4(), name: 'Oficial Silva', functionalId: 'PM123', rank: 'Soldado', unit: '1º BPM', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Oficial Costa', functionalId: 'PM456', rank: 'Cabo', unit: 'ROTAM', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
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
        if (eq.status !== 'Disponível') throw new Error(`Equipamento ${eq.brand} ${eq.model} (S/N: ${eq.serialNumber}) não está disponível.`);
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
    updateLoanStatus: (loanId, status, returnDate, returnTime, returnObservation, returnedToUserId) => {
      set(state => {
        const loanIndex = state.loans.findIndex(l => l.id === loanId);
        if (loanIndex !== -1) {
          state.loans[loanIndex].status = status;
          state.loans[loanIndex].updatedAt = new Date().toISOString();
          if (status === LoanStatus.DEVOLVIDO) {
            state.loans[loanIndex].actualReturnDate = returnDate || new Date().toISOString().split('T')[0];
            state.loans[loanIndex].actualReturnTime = returnTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'});
            state.loans[loanIndex].returnObservation = returnObservation;
            state.loans[loanIndex].returnedToUserId = returnedToUserId || get().currentUser?.id;
            state.loans[loanIndex].equipment.forEach(eq => {
              const equipmentIndex = state.equipments.findIndex(e => e.id === eq.id);
              if (equipmentIndex !== -1) {
                state.equipments[equipmentIndex].status = 'Disponível';
                state.equipments[equipmentIndex].updatedAt = new Date().toISOString();
              }
            });
          }
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
        // Do not clear password if not provided
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
        if (userToDelete.role === UserRole.ADMIN) {
          const adminCount = state.users.filter(u => u.role === UserRole.ADMIN && u.isActive).length;
          if (adminCount <= 1) {
            throw new Error("Não é possível excluir o último administrador ativo do sistema.");
          }
        }
        state.users = state.users.filter(u => u.id !== userId);
      });
    },
  }))
);

export const AppStateProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return children;
};
