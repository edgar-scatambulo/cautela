'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { UserCog, UserPlus, Construction, ShieldAlert } from 'lucide-react';

export default function UsuariosPage() {
  const { currentUser } = useStore();

  if (currentUser?.role !== 'Administrador') {
    return (
       <div className="flex flex-col items-center justify-center h-full">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }
  
  return (
    <>
      <PageHeader
        title="Gerenciamento de Usuários"
        description="Cadastre e gerencie os usuários do sistema (Acesso Restrito)."
        icon={UserCog}
        actions={
          <Button disabled>
            <UserPlus className="mr-2 h-4 w-4" /> Adicionar Usuário
          </Button>
        }
      />
      <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border rounded-lg">
        <Construction className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Página em Construção</h3>
        <p className="text-muted-foreground">A funcionalidade de gerenciamento de usuários está sendo desenvolvida.</p>
      </div>
    </>
  );
}
