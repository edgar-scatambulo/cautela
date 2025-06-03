'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Shield, UserPlus, Construction } from 'lucide-react';

export default function PoliciaisPage() {
  return (
    <>
      <PageHeader
        title="Gerenciamento de Policiais"
        description="Cadastre e gerencie os dados dos policiais."
        icon={Shield}
        actions={
          <Button disabled>
            <UserPlus className="mr-2 h-4 w-4" /> Adicionar Policial
          </Button>
        }
      />
      <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border rounded-lg">
        <Construction className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Página em Construção</h3>
        <p className="text-muted-foreground">A funcionalidade de gerenciamento de policiais está sendo desenvolvida.</p>
      </div>
    </>
  );
}
