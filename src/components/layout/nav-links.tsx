
import { LayoutDashboard, Shield, Smartphone, Printer, Radio, Users, ClipboardList, FileText, UserCog, IdCard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { UserRole } from '@/lib/types';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  subLinks?: NavLink[];
  roles?: string[]; // UserRole[]
}

export const navLinks: NavLink[] = [
  { href: '/dashboard', label: 'Painel Principal', icon: LayoutDashboard },
  {
    href: '/dashboard/equipamentos',
    label: 'Equipamentos',
    icon: Smartphone, // General icon, can be more specific if needed
    // subLinks: [ // Example of sub-links
    //   { href: '/dashboard/equipamentos/celulares', label: 'Celulares', icon: Smartphone },
    //   { href: '/dashboard/equipamentos/impressoras', label: 'Impressoras', icon: Printer },
    //   { href: '/dashboard/equipamentos/radios', label: 'Rádios', icon: Radio },
    // ],
  },
  { href: '/dashboard/policiais', label: 'Policiais', icon: IdCard }, // Changed icon to IdCard for better representation
  { href: '/dashboard/cautelas', label: 'Cautelas', icon: ClipboardList, roles: [UserRole.ADMIN, UserRole.ADVANCED_USER, UserRole.OPERATOR] },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/dashboard/usuarios', label: 'Usuários', icon: UserCog, roles: [UserRole.ADMIN] },
];
