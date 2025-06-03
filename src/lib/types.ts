
export enum EquipmentType {
  CELULAR = 'Celular',
  IMPRESSORA = 'Impressora',
  RADIO = 'Rádio',
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  brand: string; // "Marca / Modelo" on UI
  model?: string; 
  serialNumber: string; // "Patrimônio" on UI
  patrimonyNumber?: string; 
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
  username: string; 
  password?: string; 
  isActive: boolean;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export interface PoliceOfficer {
  id:string;
  name: string; // "Nome de Guerra" on UI
  functionalId: string; // "Contato" on UI (formerly ID Funcional)
  rank: string; // Graduação/Posto
  unit?: string; // Unidade/Setor - Now optional
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
  quantity: number; 
}

export interface Loan {
  id: string;
  officerId: string; // PoliceOfficer ID
  equipment: Equipment[]; 
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
