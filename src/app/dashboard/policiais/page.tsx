
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription as ShadDialogDescription, DialogFooter } from '@/components/ui/dialog';
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
import type { PoliceOfficer, Loan, Equipment } from '@/lib/types';
import { LoanStatus, UserRole } from '@/lib/types';
import { Shield, UserPlus, Edit3, Award, Trash2, Eye, Info, UserCircle, Mail, CalendarDays, Printer as PrinterIconLucide, CaseSensitive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PoliceOfficerSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { format, parse, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const ContactDisplay = ({ contactValue }: { contactValue: string }) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneIndicatorRegex = /(\d{2,}\)?\s?\d{4,}-?\d{4,})/;

  if (emailRegex.test(contactValue)) {
    return (
      <a href={`mailto:${contactValue}`} className="font-medium text-primary hover:underline ml-1">
        {contactValue}
      </a>
    );
  }

  const cleanedPhone = contactValue.replace(/\D/g, ''); 
  const isLikelyPhone = phoneIndicatorRegex.test(contactValue) && cleanedPhone.length >= 8;

  if (isLikelyPhone) {
    let whatsappNumber = cleanedPhone;
    if ((whatsappNumber.length === 10 || whatsappNumber.length === 11) && !whatsappNumber.startsWith('55')) {
      whatsappNumber = '55' + whatsappNumber;
    }
    
    return (
      <a
        href={`https://web.whatsapp.com/send?phone=${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary hover:underline ml-1"
      >
        {contactValue}
      </a>
    );
  }

  return <span className="font-medium text-foreground ml-1">{contactValue}</span>;
};


export default function PoliciaisPage() {
  const { officers, addOfficer, updateOfficer, deleteOfficer, loans, equipments, currentUser } = useStore();
  const { toast } = useToast();
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingOfficer, setEditingOfficer] = React.useState<PoliceOfficer | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [officerToDelete, setOfficerToDelete] = React.useState<PoliceOfficer | null>(null);

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [selectedOfficerForDetails, setSelectedOfficerForDetails] = React.useState<PoliceOfficer | null>(null);
  const [officerLoanHistory, setOfficerLoanHistory] = React.useState<Loan[]>([]);
  const [printOfficerHistoryTitle, setPrintOfficerHistoryTitle] = React.useState('');


  const handleFormSubmit = async (values: z.infer<typeof PoliceOfficerSchema>) => {
    setIsSubmitting(true);
    try {
      if (editingOfficer) {
        await updateOfficer({ ...editingOfficer, ...values }); 
        toast({ title: "Policial Atualizado", description: `Os dados de ${values.name} foram atualizados.` });
      } else {
        const newOfficerData = {
          ...values, 
        } as Omit<PoliceOfficer, 'id' | 'createdAt' | 'updatedAt'>;
        await addOfficer(newOfficerData);
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

  const handleConfirmDelete = async () => {
    if (officerToDelete) {
      setIsSubmitting(true);
      try {
        await deleteOfficer(officerToDelete.id);
        toast({ title: "Policial Excluído", description: `O policial ${officerToDelete.name} foi excluído.` });
      } catch (error: any) {
         toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
        setIsDeleteDialogOpen(false);
        setOfficerToDelete(null);
      }
    }
  };

  const openDetailsDialog = (officer: PoliceOfficer) => {
    setSelectedOfficerForDetails(officer);
    const history = loans.filter(loan => loan.officerId === officer.id)
                         .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setOfficerLoanHistory(history);
    setIsDetailsDialogOpen(true);
  };

  const handlePrintOfficerHistory = () => {
    if (!selectedOfficerForDetails) return;
    
    setPrintOfficerHistoryTitle(`Detalhes do Policial: ${selectedOfficerForDetails.name} - ${selectedOfficerForDetails.rank}`);
    
    setTimeout(() => {
      document.body.classList.add('print-officer-details-active');
      window.print();
       if (typeof window.onafterprint === 'function') {
        window.onafterprint = () => {
          document.body.classList.remove('print-officer-details-active');
          setPrintOfficerHistoryTitle(''); 
          window.onafterprint = null; 
        };
      } else {
        setTimeout(() => {
          document.body.classList.remove('print-officer-details-active');
          setPrintOfficerHistoryTitle('');
        }, 1000); 
      }
    }, 100); 
  };
  
  const getLoanEquipments = (loan: Loan) => {
    return loan.equipmentIds.map(id => equipments.find(e => e.id === id)).filter(Boolean) as Equipment[];
  }

  const canManageOfficers = currentUser?.role === UserRole.ADMIN;

  return (
    <TooltipProvider>
      <PageHeader
        title="Gerenciamento de Policiais"
        description="Cadastre, visualize e edite os dados dos policiais."
        icon={Shield}
        actions={
          canManageOfficers ? (
            <Dialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if(!open) setEditingOfficer(undefined); }}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <UserPlus className="mr-2 h-4 w-4" /> Adicionar Policial
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingOfficer ? 'Editar Dados do Policial' : 'Adicionar Novo Policial'}</DialogTitle>
                  <ShadDialogDescription>
                     {editingOfficer ? 'Modifique os dados do policial abaixo.' : ''}
                  </ShadDialogDescription>
                </DialogHeader>
                <PoliceOfficerForm 
                  onSubmit={handleFormSubmit} 
                  defaultValues={editingOfficer}
                  isSubmitting={isSubmitting} 
                />
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {officers.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Shield className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum policial cadastrado</h3>
            <p className="text-muted-foreground mb-4">Comece adicionando novos policiais ao sistema.</p>
            {canManageOfficers && (
              <Button onClick={openAddDialog}>
                <UserPlus className="mr-2 h-4 w-4" /> Adicionar Primeiro Policial
              </Button>
            )}
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
                {officer.fullName && (
                  <CardDescription className="flex items-center text-sm text-muted-foreground">
                    <CaseSensitive className="h-4 w-4 mr-2 shrink-0" />{officer.fullName}
                  </CardDescription>
                )}
                <CardDescription className="flex items-center text-sm">
                  <Award className="h-4 w-4 mr-2 text-muted-foreground" /> {officer.rank}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-1">
                <p className="text-sm text-muted-foreground flex items-center">
                  <Mail className="h-4 w-4 mr-2 shrink-0" /> Contato: <ContactDisplay contactValue={officer.functionalId} />
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
                  {canManageOfficers && (
                    <>
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
                    </>
                  )}
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
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOfficerToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
              {isSubmitting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-3xl print:max-w-none print:w-full print:h-auto print:overflow-visible" id="officer-details-dialog-content">
          <DialogHeader className="dialog-header-non-print">
            <DialogTitle className="flex items-center">
              <UserCircle className="h-6 w-6 mr-2 text-primary" /> 
              Detalhes do Policial
            </DialogTitle>
            {selectedOfficerForDetails && (
                 <ShadDialogDescription>
                    Informações detalhadas sobre {selectedOfficerForDetails.name} - {selectedOfficerForDetails.rank}.
                </ShadDialogDescription>
            )}
          </DialogHeader>

          <h1 className="hidden print:block print-only-officer-title">{printOfficerHistoryTitle}</h1>

          {selectedOfficerForDetails && (
            <>
              <div className="officer-personal-info-non-print space-y-4 py-4"> 
                <div>
                  <h3 className="text-lg font-semibold mb-2 font-headline">Informações Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm"> 
                    <p><strong className="text-muted-foreground">Nome de Guerra:</strong> {selectedOfficerForDetails.name}</p>
                    {selectedOfficerForDetails.fullName && <p><strong className="text-muted-foreground">Nome Completo:</strong> {selectedOfficerForDetails.fullName}</p>}
                    <p><strong className="text-muted-foreground">Posto/Grad.:</strong> {selectedOfficerForDetails.rank}</p>
                    <p><strong className="text-muted-foreground">Contato:</strong> <ContactDisplay contactValue={selectedOfficerForDetails.functionalId} /></p>
                    {selectedOfficerForDetails.unit && <p><strong className="text-muted-foreground">Unidade:</strong> {selectedOfficerForDetails.unit}</p>}
                    {selectedOfficerForDetails.observations && <p className="md:col-span-2 mt-1"><strong className="text-muted-foreground">Observações:</strong> {selectedOfficerForDetails.observations}</p>}
                     <p className="text-xs text-muted-foreground md:col-span-2 mt-2">Cadastrado em: {format(parseISO(selectedOfficerForDetails.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                </div>
              </div>
              
              <div className="officer-loan-history-section-print space-y-4 py-4 print:py-2">
                <ScrollArea className="max-h-[calc(70vh-150px)] print:max-h-none print:h-auto print:overflow-visible">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 font-headline print:mb-3">Histórico de Cautelas</h3>
                    {officerLoanHistory.length > 0 ? (
                      <Table>
                        <TableCaption className="print:hidden">Histórico de todas as cautelas realizadas por este policial.</TableCaption>
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
                                    {getLoanEquipments(loan).map(eq => (
                                      <li key={eq.id}>{eq.brand} ({eq.serialNumber})</li>
                                    ))}
                                  </ul>
                              </TableCell>
                              <TableCell>{format(parse(loan.loanDate, 'yyyy-MM-dd', new Date()), "dd/MM/yy", { locale: ptBR })}</TableCell>
                              <TableCell>
                                {loan.actualReturnDate 
                                  ? format(parse(loan.actualReturnDate, 'yyyy-MM-dd', new Date()), "dd/MM/yy", { locale: ptBR })
                                  : (loan.expectedReturnDate ? `Prev: ${format(parseISO(loan.expectedReturnDate), "dd/MM/yy", { locale: ptBR })}` : 'N/A')}
                              </TableCell>
                              <TableCell>
                                  <Badge className={`print:border ${
                                    loan.status === LoanStatus.ENTREGUE ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100 print-badge-entregue' :
                                    'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100 print-badge-devolvido'
                                  }`}>{loan.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-8 border-2 border-dashed border-border rounded-lg print:hidden">
                          <Info className="h-10 w-10 text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">Nenhum histórico de cautela para este policial.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
           <DialogFooter className="pt-4 dialog-footer-non-print">
                <Button onClick={handlePrintOfficerHistory} variant="outline">
                  <PrinterIconLucide className="mr-2 h-4 w-4" /> Imprimir Histórico
                </Button>
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
