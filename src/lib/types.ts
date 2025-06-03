
export enum EquipmentType {
  CELULAR = 'Celular',
  IMPRESSORA = 'Impressora',
  RADIO = 'Rádio',
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  brand: string;
  model?: string; // Made model optional
  serialNumber: string;
  patrimonyNumber?: string; // Número de patrimônio
  status: 'Disponível' | 'Em Cautela' | 'Manutenção' | 'Baixado';
  observations?: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export enum UserRole {
  ADMIN = 'Administrador',
  OPERATOR = 'Operador',
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  username: string; // For login
  password?: string; // Plain text password for simplicity in this example
  isActive: boolean;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export interface PoliceOfficer {
  id:string;
  name: string;
  functionalId: string; // Identificação Funcional (Matrícula)
  rank: string; // Graduação/Posto
  unit: string; // Unidade/Setor
  contact?: string;
  observations?: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export enum LoanStatus {
  ENTREGUE = 'Entregue', // Loaned out
  DEVOLVIDO = 'Devolvido', // Returned
}

export interface LoanItem {
  equipmentId: string;
  quantity: number; // For items that might be loaned in multiples if not individually tracked by S/N
}

export interface Loan {
  id: string;
  officerId: string; // PoliceOfficer ID
  equipment: Equipment[]; // Array of Equipment objects or IDs
  loanDate: string; // ISO Date string for when it was loaned out
  loanTime: string; // HH:MM
  expectedReturnDate?: string; // ISO Date string
  actualReturnDate?: string; // ISO Date string for when it was returned
  actualReturnTime?: string; // HH:MM
  status: LoanStatus;
  loanObservation?: string; // Observations during loan
  returnObservation?: string; // Observations during return
  loanedByUserId: string; // SystemUser ID who registered the loan
  returnedToUserId?: string; // SystemUser ID who registered the return
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}
