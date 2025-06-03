
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PoliceOfficerForm } from './components/police-officer-form';
import { useStore } from '@/lib/store';
import type { PoliceOfficer } from '@/lib/types';
import { Shield, UserPlus, Edit3, IdCard, Award, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PoliceOfficerSchema } from '@/lib/schemas';
import type { z } from 'zod';

export default function PoliciaisPage() {
  const { officers, addOfficer, updateOfficer } = useStore(); // Assuming updateOfficer will be added to store
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingOfficer, setEditingOfficer] = React.useState<PoliceOfficer | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFormSubmit = async (values: z.infer<typeof PoliceOfficerSchema>) => {
    setIsSubmitting(true);
    try {
      if (editingOfficer) {
        // updateOfficer({ ...editingOfficer, ...values });
        // toast({ title: "Policial Atualizado", description: `Os dados de ${values.name} foram atualizados.` });
        // For now, just log, as updateOfficer is not implemented in store
        console.log("Update officer:", { ...editingOfficer, ...values });
        toast({ title: "Funcionalidade Pendente", description: "A atualização de policiais ainda será implementada." });

      } else {
        const newOfficerData = {
          ...values,
          functionalId: values.functionalId.toUpperCase(),
        } as Omit<PoliceOfficer, 'id' | 'createdAt' | 'updatedAt'>;
        addOfficer(newOfficerData);
        toast({ title: "Policial Adicionado", description: `${values.name} foi adicionado ao sistema.` });
      }
      setIsDialogOpen(false);
      setEditingOfficer(undefined);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Ocorreu um erro ao salvar o policial.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (officer: PoliceOfficer) => {
    setEditingOfficer(officer);
    setIsDialogOpen(true);
  };
  
  const openAddDialog = () => {
    setEditingOfficer(undefined);
    setIsDialogOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Gerenciamento de Policiais"
        description="Cadastre, visualize e edite os dados dos policiais."
        icon={Shield}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingOfficer(undefined); }}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <UserPlus className="mr-2 h-4 w-4" /> Adicionar Policial
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingOfficer ? 'Editar Dados do Policial' : 'Adicionar Novo Policial'}</DialogTitle>
              </DialogHeader>
              <PoliceOfficerForm 
                onSubmit={handleFormSubmit} 
                defaultValues={editingOfficer}
                isSubmitting={isSubmitting} 
              />
            </DialogContent>
          </Dialog>
        }
      />

      {officers.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Shield className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum policial cadastrado</h3>
            <p className="text-muted-foreground mb-4">Comece adicionando novos policiais ao sistema.</p>
            <Button onClick={openAddDialog}>
              <UserPlus className="mr-2 h-4 w-4" /> Adicionar Primeiro Policial
            </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {officers.map((officer) => (
            <Card key={officer.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Shield className="h-8 w-8 text-primary" />
                  {/* Status can be added later if needed, e.g., Ativo/Inativo */}
                </div>
                <CardTitle className="text-lg font-semibold font-headline">{officer.name}</CardTitle>
                <CardDescription className="flex items-center text-sm">
                  <Award className="h-4 w-4 mr-2 text-muted-foreground" /> {officer.rank}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-1">
                <p className="text-sm text-muted-foreground flex items-center">
                  <IdCard className="h-4 w-4 mr-2 shrink-0" /> ID Funcional: <span className="font-medium text-foreground ml-1">{officer.functionalId}</span>
                </p>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Building className="h-4 w-4 mr-2 shrink-0" /> Unidade: <span className="font-medium text-foreground ml-1">{officer.unit}</span>
                </p>
                {officer.contact && (
                  <p className="text-sm text-muted-foreground">Contato: <span className="font-medium text-foreground">{officer.contact}</span></p>
                )}
                {officer.observations && (
                  <p className="text-sm text-muted-foreground mt-2">Obs: {officer.observations}</p>
                )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex w-full justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(officer)} disabled> {/* Editing disabled for now */}
                    <Edit3 className="mr-1 h-4 w-4" /> Editar
                  </Button>
                  {/* Delete functionality can be added here later */}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
