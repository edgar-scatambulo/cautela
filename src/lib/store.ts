
import * as React from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Equipment, SystemUser, PoliceOfficer, Loan, UserRole, EquipmentType, LoanStatus } from './types';
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
  addOfficer: (officer: Omit<PoliceOfficer, 'id' | 'createdAt' | 'updatedAt'>) => PoliceOfficer;
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'loanedByUserId'>) => Loan;
  updateLoanStatus: (loanId: string, status: LoanStatus, returnDate?: string, returnTime?: string, returnObservation?: string, returnedToUserId?: string) => void;
  // Add more actions as needed: addUser, updateOfficer, etc.
}

const initialAdminUser: SystemUser = {
  id: uuidv4(),
  name: 'Admin User',
  email: 'admin@cautela.com',
  username: 'admin',
  role: 'Administrador' as UserRole.ADMIN,
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
          state.equipments[index] = { ...updatedEquipment, updatedAt: new Date().toISOString() };
        }
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
    addLoan: (loanData) => {
      const currentUser = get().currentUser;
      if (!currentUser) throw new Error("Usuário não autenticado para registrar cautela.");
      
      const equipmentDetails = loanData.equipmentIds.map(id => {
        const eq = get().equipments.find(e => e.id === id);
        if (!eq) throw new Error(`Equipamento com ID ${id} não encontrado.`);
        return eq;
      });

      const newLoan: Loan = {
        ...loanData,
        id: uuidv4(),
        equipment: equipmentDetails,
        status: LoanStatus.ENTREGUE,
        loanedByUserId: currentUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => {
        state.loans.push(newLoan);
        // Update equipment status
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

            // Update equipment status back to 'Disponível'
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
  }))
);

// Helper component to provide store (though not strictly necessary with Zustand v4)
export const AppStateProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (<React.Fragment>{children}</React.Fragment>);
};
