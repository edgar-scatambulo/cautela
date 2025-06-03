
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
import { PoliceOfficerForm } from './components/police-officer-form';
import { useStore } from '@/lib/store';
import type { PoliceOfficer, Loan } from '@/lib/types';
import { LoanStatus } from '@/lib/types';
import { Shield, UserPlus, Edit3, Award, Trash2, Eye, Info, UserCircle, Mail, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PoliceOfficerSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";


export default function PoliciaisPage() {
  const { officers, addOfficer, updateOfficer, deleteOfficer, loans } = useStore();
  const { toast } = useToast();
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingOfficer, setEditingOfficer] = React.useState<PoliceOfficer | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [officerToDelete, setOfficerToDelete] = React.useState<PoliceOfficer | null>(null);

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [selectedOfficerForDetails, setSelectedOfficerForDetails] = React.useState<PoliceOfficer | null>(null);
  const [officerLoanHistory, setOfficerLoanHistory] = React.useState<Loan[]>([]);


  const handleFormSubmit = async (values: z.infer<typeof PoliceOfficerSchema>) => {
    setIsSubmitting(true);
    try {
      if (editingOfficer) {
        updateOfficer({ ...editingOfficer, ...values }); 
        toast({ title: "Policial Atualizado", description: `Os dados de ${values.name} foram atualizados.` });
      } else {
        const newOfficerData = {
          ...values, 
        } as Omit<PoliceOfficer, 'id' | 'createdAt' | 'updatedAt'>;
        addOfficer(newOfficerData);
        toast({ title: "Policial Adicionado", description: `${values.name} foi adicionado ao sistema.` });
      }
      setIsFormDialogOpen(false);
      setEditingOfficer(undefined);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Ocorreu um erro ao salvar o policial.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (officer: PoliceOfficer) => {
    setEditingOfficer(officer);
    setIsFormDialogOpen(true);
  };
  
  const openAddDialog = () => {
    setEditingOfficer(undefined);
    setIsFormDialogOpen(true);
  }

  const openDeleteDialog = (officer: PoliceOfficer) => {
    setOfficerToDelete(officer);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (officerToDelete) {
      try {
        deleteOfficer(officerToDelete.id);
        toast({ title: "Policial Excluído", description: `O policial ${officerToDelete.name} foi excluído.` });
      } catch (error: any) {
         toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
      } finally {
        setIsDeleteDialogOpen(false);
        setOfficerToDelete(null);
      }
    }
  };

  const openDetailsDialog = (officer: PoliceOfficer) => {
    setSelectedOfficerForDetails(officer);
    const history = loans.filter(loan => loan.officerId === officer.id)
                         .sort((a, b) => parseISO(b.loanDate).getTime() - parseISO(a.loanDate).getTime());
    setOfficerLoanHistory(history);
    setIsDetailsDialogOpen(true);
  };

  return (
    <TooltipProvider>
      <PageHeader
        title="Gerenciamento de Policiais"
        description="Cadastre, visualize e edite os dados dos policiais."
        icon={Shield}
        actions={
          <Dialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if(!open) setEditingOfficer(undefined); }}>
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
                  <UserCircle className="h-8 w-8 text-primary" /> 
                </div>
                <CardTitle className="text-lg font-semibold font-headline">{officer.name}</CardTitle> 
                <CardDescription className="flex items-center text-sm">
                  <Award className="h-4 w-4 mr-2 text-muted-foreground" /> {officer.rank}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-1">
                <p className="text-sm text-muted-foreground flex items-center">
                  <Mail className="h-4 w-4 mr-2 shrink-0" /> Contato: <span className="font-medium text-foreground ml-1">{officer.functionalId}</span>
                </p>
                {officer.unit && (
                  <p className="text-sm text-muted-foreground flex items-center">
                     Unidade: <span className="font-medium text-foreground ml-1">{officer.unit}</span>
                  </p>
                )}
                {officer.observations && (
                  <p className="text-sm text-muted-foreground mt-2">Obs: {officer.observations}</p>
                )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex w-full justify-end space-x-2">
                   <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => openDetailsDialog(officer)} className="text-primary hover:bg-primary/10">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver Detalhes</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ver Detalhes</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(officer)}>
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
                        <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(officer)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Excluir</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o policial <span className="font-semibold">{officerToDelete?.name}</span>?
              {officerToDelete?.functionalId && <> O contato associado é <span className="font-semibold">{officerToDelete.functionalId}</span>.</>}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOfficerToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserCircle className="h-6 w-6 mr-2 text-primary" /> 
              Detalhes do Policial
            </DialogTitle>
            {selectedOfficerForDetails && (
                 <DialogDescription>
                    {selectedOfficerForDetails.name} - {selectedOfficerForDetails.rank}
                </DialogDescription>
            )}
          </DialogHeader>
          {selectedOfficerForDetails && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 font-headline">Informações Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <p><strong className="text-muted-foreground">Nome de Guerra:</strong> {selectedOfficerForDetails.name}</p>
                    <p><strong className="text-muted-foreground">Posto/Grad.:</strong> {selectedOfficerForDetails.rank}</p>
                    <p><strong className="text-muted-foreground">Contato:</strong> {selectedOfficerForDetails.functionalId}</p>
                    {selectedOfficerForDetails.unit && <p><strong className="text-muted-foreground">Unidade:</strong> {selectedOfficerForDetails.unit}</p>}
                    {selectedOfficerForDetails.observations && <p className="md:col-span-2"><strong className="text-muted-foreground">Observações:</strong> {selectedOfficerForDetails.observations}</p>}
                     <p className="text-xs text-muted-foreground md:col-span-2">Cadastrado em: {format(parseISO(selectedOfficerForDetails.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 font-headline">Histórico de Cautelas</h3>
                  {officerLoanHistory.length > 0 ? (
                    <Table>
                       <TableCaption>Histórico de todas as cautelas realizadas por este policial.</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Equipamentos</TableHead>
                          <TableHead>Data Cautela</TableHead>
                          <TableHead>Data Devolução</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {officerLoanHistory.map(loan => (
                          <TableRow key={loan.id}>
                            <TableCell>
                                <ul className="list-disc list-inside text-xs">
                                  {loan.equipment.map(eq => (
                                    <li key={eq.id}>{eq.brand} (Patrimônio: {eq.serialNumber})</li>
                                  ))}
                                </ul>
                            </TableCell>
                            <TableCell>{format(parseISO(loan.loanDate), "dd/MM/yy HH:mm", { locale: ptBR })}</TableCell>
                            <TableCell>
                              {loan.actualReturnDate 
                                ? format(parseISO(loan.actualReturnDate), "dd/MM/yy HH:mm", { locale: ptBR })
                                : (loan.expectedReturnDate ? `Prev: ${format(parseISO(loan.expectedReturnDate), "dd/MM/yy", { locale: ptBR })}` : 'N/A')}
                            </TableCell>
                            <TableCell>
                                <Badge className={`${
                                  loan.status === LoanStatus.ENTREGUE ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                                  'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100'
                                }`}>{loan.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-8 border-2 border-dashed border-border rounded-lg">
                        <Info className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">Nenhum histórico de cautela para este policial.</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
           <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
