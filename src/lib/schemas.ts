
import { z } from 'zod';
import { EquipmentType, UserRole } from './types';

export const LoginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(1, "Senha é obrigatória."),
});

export const SignupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório."),
  email: z.string().email("Email inválido."),
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres."),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres."),
});

export const EquipmentSchema = z.object({
  id: z.string().optional(),
  type: z.nativeEnum(EquipmentType, { errorMap: () => ({ message: "Tipo de equipamento é obrigatório."}) }),
  brand: z.string().min(1, "Marca / Modelo é obrigatório."), 
  model: z.string().optional(),
  serialNumber: z.string().min(1, "Patrimônio é obrigatório."), 
  patrimonyNumber: z.string().optional(),
  status: z.enum(['Disponível', 'Em Cautela', 'Manutenção', 'Baixado']),
  observations: z.string().optional(),
});

export const SystemUserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório."),
  email: z.string().email("Email inválido."),
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres."),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres.").optional(), 
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: "Cargo é obrigatório."}) }),
  isActive: z.boolean().default(true),
});

export const PoliceOfficerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome de Guerra é obrigatório."), // Changed label
  fullName: z.string().optional(), // Novo campo "Nome Completo"
  functionalId: z.string().min(1, "Contato é obrigatório."), // Changed label and purpose
  rank: z.string().min(1, "Posto/Graduação é obrigatório."),
  unit: z.string().optional(), // Now optional
  observations: z.string().optional(),
});

export const LoanSchema = z.object({
  id: z.string().optional(),
  officerId: z.string().min(1, "Policial é obrigatório."),
  equipmentIds: z.array(z.string()).min(1, "Selecione ao menos um equipamento."),
  loanDate: z.string().min(1, "Data da cautela é obrigatória."), 
  loanTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida (HH:MM)."),
  expectedReturnDate: z.string().optional(),
  loanObservation: z.string().optional(),
});
