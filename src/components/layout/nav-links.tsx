import { LayoutDashboard, Shield, Smartphone, Printer, Radio, Users, ClipboardList, FileText, UserCog } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
  { href: '/dashboard/policiais', label: 'Policiais', icon: Shield },
  { href: '/dashboard/cautelas', label: 'Cautelas', icon: ClipboardList },
  { href: '/dashboard/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/dashboard/usuarios', label: 'Usuários', icon: UserCog, roles: ['Administrador'] },
];
