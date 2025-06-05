'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { navLinks, NavLink as NavLinkType } from '@/components/layout/nav-links';
import { UserProfileDropdown } from '@/components/layout/user-profile-dropdown';
import { useStore } from '@/lib/store';
import { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <ShieldCheck className="h-7 w-7 text-primary transition-all group-hover/sidebar-wrapper:scale-110" />
      <span className="font-bold text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden font-headline">
        Cautela Control
      </span>
    </Link>
  );
}

function SidebarNav() {
  const pathname = usePathname();
  const { currentUser } = useStore();

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  
  const renderNavLinks = (links: NavLinkType[]) => {
    return links.filter(link => {
      if (!link.roles || link.roles.length === 0) return true;
      return currentUser && link.roles.includes(currentUser.role);
    }).map((link) => (
      <SidebarMenuItem key={link.href}>
        <Link href={link.href} passHref legacyBehavior>
          <SidebarMenuButton
            isActive={isActive(link.href)}
            className={cn(
              isActive(link.href)
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              'w-full justify-start'
            )}
            tooltip={link.label}
          >
            <link.icon className="h-5 w-5" />
            <span className="group-data-[collapsible=icon]:hidden">{link.label}</span>
          </SidebarMenuButton>
        </Link>
        {/* TODO: Implement subLinks rendering if needed */}
      </SidebarMenuItem>
    ));
  };

  return (
     <SidebarMenu>
        {renderNavLinks(navLinks)}
      </SidebarMenu>
  );
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentUser } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);


  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router, mounted]);
  
  if (!mounted || !isAuthenticated) {
     return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <Sidebar className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border print:hidden" collapsible="icon">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <AppLogo />
          </SidebarHeader>
          <SidebarContent className="p-2">
            <ScrollArea className="h-full">
              <SidebarNav />
            </ScrollArea>
          </SidebarContent>
          {/* <SidebarFooter className="p-4 border-t border-sidebar-border">
             Optional: User profile / settings quick access in footer
          </SidebarFooter> */}
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col bg-background">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm print:hidden">
            <div className="flex items-center">
              <SidebarTrigger className="md:hidden mr-4" /> {/* Mobile trigger */}
              <h1 className="text-xl font-semibold font-headline text-foreground">
                {/* Dynamically set page title here or keep it general */}
                Painel Cautela Control
              </h1>
            </div>
            <UserProfileDropdown />
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
