
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EquipmentForm } from './components/equipment-form';
import { useStore } from '@/lib/store';
import { Equipment, EquipmentType, LoanStatus } from '@/lib/types';
import { Smartphone, Printer, Radio, PlusCircle, Edit3, Trash2, PackageSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EquipmentSchema } from '@/lib/schemas';
import type { z } from 'zod';

const EquipmentIcon = ({ type }: { type: EquipmentType }) => {
  switch (type) {
    case EquipmentType.CELULAR:
      return <Smartphone className="h-6 w-6 text-primary" />;
    case EquipmentType.IMPRESSORA:
      return <Printer className="h-6 w-6 text-primary" />;
    case EquipmentType.RADIO:
      return <Radio className="h-6 w-6 text-primary" />;
    default:
      return <PackageSearch className="h-6 w-6 text-primary" />;
  }
};

export default function EquipamentosPage() {
  const { equipments, addEquipment, updateEquipment, deleteEquipment, loans } = useStore();
  const { toast } = useToast();
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingEquipment, setEditingEquipment] = React.useState<Equipment | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = React.useState<Equipment | null>(null);

  const handleFormSubmit = async (values: z.infer<typeof EquipmentSchema>) => {
    setIsSubmitting(true);
    try {
      if (editingEquipment) {
        updateEquipment({ ...editingEquipment, ...values, serialNumber: values.serialNumber.toUpperCase() });
        toast({ title: "Equipamento Atualizado", description: `O equipamento ${values.model} foi atualizado.` });
      } else {
        const newEquipmentData = {
          ...values,
          serialNumber: values.serialNumber.toUpperCase(),
          status: values.status || 'Disponível',
        } as Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>;
        addEquipment(newEquipmentData);
        toast({ title: "Equipamento Adicionado", description: `O equipamento ${values.model} foi adicionado.` });
      }
      setIsFormDialogOpen(false);
      setEditingEquipment(undefined);
    } catch (error) {
      toast({ title: "Erro", description: "Ocorreu um erro ao salvar o equipamento.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setIsFormDialogOpen(true);
  };
  
  const openAddDialog = () => {
    setEditingEquipment(undefined);
    setIsFormDialogOpen(true);
  };

  const openDeleteDialog = (equipment: Equipment) => {
    setEquipmentToDelete(equipment);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (equipmentToDelete) {
      try {
        deleteEquipment(equipmentToDelete.id);
        toast({ title: "Equipamento Excluído", description: `O equipamento ${equipmentToDelete.model} foi excluído.` });
      } catch (error: any) {
         toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
      } finally {
        setIsDeleteDialogOpen(false);
        setEquipmentToDelete(null);
      }
    }
  };

  return (
    <>
      <React.Fragment>
        <PageHeader
          title="Gerenciamento de Equipamentos"
          description="Cadastre, visualize e edite os equipamentos."
          icon={PackageSearch}
          actions={
            <Dialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if(!open) setEditingEquipment(undefined); }}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Equipamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingEquipment ? 'Editar Equipamento' : 'Adicionar Novo Equipamento'}</DialogTitle>
                </DialogHeader>
                <EquipmentForm 
                  onSubmit={handleFormSubmit} 
                  defaultValues={editingEquipment}
                  isSubmitting={isSubmitting} 
                />
              </DialogContent>
            </Dialog>
          }
        />
      </React.Fragment>
      <React.Fragment>
        {equipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border rounded-lg">
              <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum equipamento cadastrado</h3>
              <p className="text-muted-foreground mb-4">Comece adicionando novos equipamentos ao sistema.</p>
              <Button onClick={openAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Primeiro Equipamento
              </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {equipments.map((equipment) => (
              <Card key={equipment.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <EquipmentIcon type={equipment.type} />
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      equipment.status === 'Disponível' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
                      equipment.status === 'Em Cautela' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                      equipment.status === 'Manutenção' ? 'bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100' :
                      'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100' // Baixado
                    }`}>
                      {equipment.status}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-semibold font-headline">{equipment.brand} {equipment.model}</CardTitle>
                  <CardDescription>Tipo: {equipment.type}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">S/N: <span className="font-medium text-foreground">{equipment.serialNumber}</span></p>
                  {equipment.patrimonyNumber && <p className="text-sm text-muted-foreground">Patrimônio: <span className="font-medium text-foreground">{equipment.patrimonyNumber}</span></p>}
                  {equipment.observations && <p className="text-sm text-muted-foreground mt-2">Obs: {equipment.observations}</p>}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <div className="flex w-full justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(equipment)}>
                      <Edit3 className="mr-1 h-4 w-4" /> Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(equipment)}>
                      <Trash2 className="mr-1 h-4 w-4" /> Excluir
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </React.Fragment>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o equipamento <span className="font-semibold">{equipmentToDelete?.brand} {equipmentToDelete?.model} (S/N: {equipmentToDelete?.serialNumber})</span>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEquipmentToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
    
