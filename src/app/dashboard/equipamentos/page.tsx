
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as ShadDialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EquipmentForm } from './components/equipment-form';
import { useStore } from '@/lib/store';
import { Equipment, EquipmentType, Loan, PoliceOfficer, LoanStatus, UserRole } from '@/lib/types';
import { Smartphone, Printer as PrinterIconLucide, Radio, PlusCircle, Edit3, Trash2, PackageSearch, Eye, User, CalendarDays, Clock, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EquipmentSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const EquipmentIcon = ({ type }: { type: EquipmentType }) => {
  switch (type) {
    case EquipmentType.CELULAR:
      return <Smartphone className="h-6 w-6 text-primary" />;
    case EquipmentType.IMPRESSORA:
      return <PrinterIconLucide className="h-6 w-6 text-primary" />;
    case EquipmentType.RADIO:
      return <Radio className="h-6 w-6 text-primary" />;
    default:
      return <PackageSearch className="h-6 w-6 text-primary" />;
  }
};

const getOfficerNameLocal = (officerId: string, officers: PoliceOfficer[]): string => {
  const officer = officers.find(o => o.id === officerId);
  return officer ? `${officer.name} (${officer.rank})` : 'Desconhecido';
};


export default function EquipamentosPage() {
  const { equipments, addEquipment, updateEquipment, deleteEquipment, loans, officers, currentUser } = useStore();
  const { toast } = useToast();
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingEquipment, setEditingEquipment] = React.useState<Equipment | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = React.useState<Equipment | null>(null);
  
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [selectedEquipmentForDetails, setSelectedEquipmentForDetails] = React.useState<Equipment | null>(null);
  const [equipmentLoanHistory, setEquipmentLoanHistory] = React.useState<Loan[]>([]);
  const [printEquipmentHistoryTitle, setPrintEquipmentHistoryTitle] = React.useState('');


  const handleFormSubmit = async (values: z.infer<typeof EquipmentSchema>) => {
    setIsSubmitting(true);
    try {
      if (editingEquipment) {
        const updatedValues = { ...editingEquipment, ...values };
        updateEquipment({ ...updatedValues, serialNumber: values.serialNumber.toUpperCase() });
        toast({ title: "Equipamento Atualizado", description: `O equipamento ${values.brand} foi atualizado.` });
      } else {
        const newEquipmentData = {
          ...values,
          serialNumber: values.serialNumber.toUpperCase(),
          status: values.status || 'Disponível',
        } as Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>;
        addEquipment(newEquipmentData);
        toast({ title: "Equipamento Adicionado", description: `O equipamento ${values.brand} foi adicionado.` });
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
        toast({ title: "Equipamento Excluído", description: `O equipamento ${equipmentToDelete.brand} foi excluído.` });
      } catch (error: any) {
         toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
      } finally {
        setIsDeleteDialogOpen(false);
        setEquipmentToDelete(null);
      }
    }
  };

  const openDetailsDialog = (equipment: Equipment) => {
    setSelectedEquipmentForDetails(equipment);
    const history = loans.filter(loan => loan.equipment.some(eq => eq.id === equipment.id))
                         .sort((a, b) => parseISO(b.loanDate).getTime() - parseISO(a.loanDate).getTime()); // Sort by most recent
    setEquipmentLoanHistory(history);
    setIsDetailsDialogOpen(true);
  };
  
  const handlePrintEquipmentHistory = () => {
    if (!selectedEquipmentForDetails) return;
    
    setPrintEquipmentHistoryTitle(`Histórico de Cautelas: ${selectedEquipmentForDetails.brand} (Patrimônio: ${selectedEquipmentForDetails.serialNumber})`);
    
    setTimeout(() => {
      document.body.classList.add('print-equipment-details-active');
      window.onafterprint = () => {
        document.body.classList.remove('print-equipment-details-active');
        setPrintEquipmentHistoryTitle(''); 
        window.onafterprint = null; 
      };
      window.print();
    }, 100); 
  };

  const canManageEquipments = currentUser?.role === UserRole.ADMIN;

  return (
    <TooltipProvider>
      <PageHeader
        title="Gerenciamento de Equipamentos"
        description="Cadastre, visualize e edite os equipamentos."
        icon={PackageSearch}
        actions={
          canManageEquipments ? (
            <Dialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if(!open) setEditingEquipment(undefined); }}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Equipamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingEquipment ? 'Editar Equipamento' : 'Adicionar Novo Equipamento'}</DialogTitle>
                  <ShadDialogDescription>
                    {editingEquipment ? 'Modifique os detalhes do equipamento abaixo.' : 'Preencha os detalhes do novo equipamento abaixo.'}
                  </ShadDialogDescription>
                </DialogHeader>
                <EquipmentForm 
                  onSubmit={handleFormSubmit} 
                  defaultValues={editingEquipment}
                  isSubmitting={isSubmitting}
                  isEditing={!!editingEquipment}
                />
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      
      {equipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border rounded-lg">
            <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum equipamento cadastrado</h3>
            <p className="text-muted-foreground mb-4">Comece adicionando novos equipamentos ao sistema.</p>
            {canManageEquipments && (
              <Button onClick={openAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Primeiro Equipamento
              </Button>
            )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {equipments.map((equipment) => (
            <Card key={equipment.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <EquipmentIcon type={equipment.type} />
                  <Badge className={`px-2 py-0.5 text-xs rounded-full ${
                    equipment.status === 'Disponível' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
                    equipment.status === 'Em Cautela' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                    equipment.status === 'Manutenção' ? 'bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100' :
                    'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
                  }`}>
                    {equipment.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-semibold font-headline">{equipment.brand}{equipment.model ? ` ${equipment.model}` : ''}</CardTitle>
                <CardDescription>Tipo: {equipment.type}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">Patrimônio: <span className="font-medium text-foreground">{equipment.serialNumber}</span></p>
                {equipment.observations && <p className="text-sm text-muted-foreground mt-2">Obs: {equipment.observations}</p>}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex w-full justify-end space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => openDetailsDialog(equipment)} className="text-primary hover:bg-primary/10">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver Detalhes</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ver Detalhes</p>
                    </TooltipContent>
                  </Tooltip>
                  {canManageEquipments && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => openEditDialog(equipment)}>
                            <Edit3 className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(equipment)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Excluir</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o equipamento <span className="font-semibold">{equipmentToDelete?.brand}{equipmentToDelete?.model ? ` ${equipmentToDelete.model}`: ''} (Patrimônio: {equipmentToDelete?.serialNumber})</span>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEquipmentToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Equipment Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-3xl" id="equipment-details-dialog-content">
          <DialogHeader className="dialog-header-non-print">
            <DialogTitle className="flex items-center">
              <PackageSearch className="h-6 w-6 mr-2 text-primary" />
              Detalhes do Equipamento
            </DialogTitle>
            {selectedEquipmentForDetails && (
                 <ShadDialogDescription>
                    Informações detalhadas sobre {selectedEquipmentForDetails.brand}{selectedEquipmentForDetails.model ? ` ${selectedEquipmentForDetails.model}` : ''} (Patrimônio: {selectedEquipmentForDetails.serialNumber}).
                </ShadDialogDescription>
            )}
          </DialogHeader>

          <h1 className="hidden print:block print-only-equipment-title">{printEquipmentHistoryTitle}</h1>
          
          {selectedEquipmentForDetails && (
            <>
              <div className="equipment-general-info-non-print space-y-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 font-headline">Informações Gerais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><strong className="text-muted-foreground">Tipo:</strong> {selectedEquipmentForDetails.type}</div>
                    <div><strong className="text-muted-foreground">Marca / Modelo:</strong> {selectedEquipmentForDetails.brand}{selectedEquipmentForDetails.model ? ` ${selectedEquipmentForDetails.model}` : ''}</div>
                    <div><strong className="text-muted-foreground">Patrimônio:</strong> {selectedEquipmentForDetails.serialNumber}</div>
                    <div> {/* Changed p to div here */}
                      <strong className="text-muted-foreground">Status Atual:</strong>{' '}
                      <Badge className={`${
                        selectedEquipmentForDetails.status === 'Disponível' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
                        selectedEquipmentForDetails.status === 'Em Cautela' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                        selectedEquipmentForDetails.status === 'Manutenção' ? 'bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100' :
                        'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
                      }`}>{selectedEquipmentForDetails.status}</Badge>
                    </div>
                    {selectedEquipmentForDetails.observations && <div className="md:col-span-2"><strong className="text-muted-foreground">Observações:</strong> {selectedEquipmentForDetails.observations}</div>}
                    <div className="text-xs text-muted-foreground md:col-span-2">Cadastrado em: {format(parseISO(selectedEquipmentForDetails.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
                  </div>
                </div>
              </div>
              
              <div className="equipment-loan-history-section-print space-y-6 py-4 print:py-0">
                <ScrollArea className="max-h-[calc(70vh-220px)] print:max-h-none print:h-auto print:overflow-visible pr-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 font-headline print:text-center print:mb-4">Histórico de Cautelas</h3>
                    {equipmentLoanHistory.length > 0 ? (
                      <Table>
                        <TableCaption className="print:hidden">Histórico de todas as cautelas envolvendo este equipamento.</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Policial</TableHead>
                            <TableHead>Data Cautela</TableHead>
                            <TableHead>Data Devolução</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {equipmentLoanHistory.map(loan => (
                            <TableRow key={loan.id}>
                              <TableCell className="font-medium">{getOfficerNameLocal(loan.officerId, officers)}</TableCell>
                              <TableCell>{format(parseISO(loan.loanDate), "dd/MM/yy", { locale: ptBR })}</TableCell>
                              <TableCell>
                                {loan.actualReturnDate 
                                  ? format(parseISO(loan.actualReturnDate), "dd/MM/yy", { locale: ptBR })
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                  <Badge className={`print:border print:border-gray-400 ${
                                    loan.status === LoanStatus.ENTREGUE ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100 print-badge-entregue' :
                                    'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100 print-badge-devolvido'
                                  }`}>{loan.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-8 border-2 border-dashed border-border rounded-lg print:hidden">
                          <Info className="h-10 w-10 text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">Nenhum histórico de cautela para este equipamento.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
           <DialogFooter className="pt-4 dialog-footer-non-print">
                <Button onClick={handlePrintEquipmentHistory} variant="outline">
                  <PrinterIconLucide className="mr-2 h-4 w-4" /> Imprimir Histórico
                </Button>
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
    

    

    

