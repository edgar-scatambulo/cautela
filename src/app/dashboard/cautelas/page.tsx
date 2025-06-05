
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoanForm } from './components/loan-form';
import { useStore } from '@/lib/store';
import { Loan, LoanStatus, PoliceOfficer, Equipment } from '@/lib/types';
import { ClipboardList, PlusCircle, ArrowLeftFromLine, PackageSearch, User, CalendarDays, Clock, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoanSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const ContactDisplay = ({ contactValue }: { contactValue: string }) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Heuristic regex to identify strings that might be phone numbers
  const phoneIndicatorRegex = /(\d{2,}\)?\s?\d{4,}-?\d{4,})/;

  if (emailRegex.test(contactValue)) {
    return (
      <a href={`mailto:${contactValue}`} className="font-medium text-primary hover:underline ml-1">
        {contactValue}
      </a>
    );
  }

  const cleanedPhone = contactValue.replace(/\D/g, ''); // Remove all non-digits
  const isLikelyPhone = phoneIndicatorRegex.test(contactValue) && cleanedPhone.length >= 8;

  if (isLikelyPhone) {
    let whatsappNumber = cleanedPhone;
    // Add '55' for Brazilian numbers if it's a common length (10 or 11 digits) and doesn't start with '55'
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


export default function CautelasPage() {
  const { loans, officers, equipments, addLoan, updateLoanStatus, currentUser } = useStore();
  const { toast } = useToast();
  const [isLoanDialogOpen, setIsLoanDialogOpen] = React.useState(false);
  // For return dialog
  const [isReturnDialogOpen, setIsReturnDialogOpen] = React.useState(false);
  const [selectedLoanForReturn, setSelectedLoanForReturn] = React.useState<Loan | null>(null);
  const [returnObservation, setReturnObservation] = React.useState('');

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const availableEquipments = equipments.filter(eq => eq.status === 'Disponível');

  const handleLoanFormSubmit = async (values: z.infer<typeof LoanSchema>) => {
    setIsSubmitting(true);
    try {
      addLoan(values);
      toast({ title: "Cautela Registrada", description: `Nova cautela registrada com sucesso.` });
      setIsLoanDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao Registrar Cautela", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReturnDialog = (loan: Loan) => {
    setSelectedLoanForReturn(loan);
    setReturnObservation('');
    setIsReturnDialogOpen(true);
  };

  const handleConfirmReturn = () => {
    if (selectedLoanForReturn && currentUser) {
      updateLoanStatus(selectedLoanForReturn.id, LoanStatus.DEVOLVIDO, undefined, undefined, returnObservation, currentUser.id);
      toast({ title: "Equipamento Devolvido", description: "Status da cautela atualizado para Devolvido." });
      setIsReturnDialogOpen(false);
      setSelectedLoanForReturn(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Gerenciamento de Cautelas"
        description="Registre e acompanhe as cautelas de equipamentos."
        icon={ClipboardList}
        actions={
          <Dialog open={isLoanDialogOpen} onOpenChange={setIsLoanDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Cautela
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Nova Cautela</DialogTitle>
              </DialogHeader>
              <LoanForm 
                onSubmit={handleLoanFormSubmit} 
                officers={officers}
                availableEquipments={availableEquipments}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {loans.length === 0 ? (
         <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border rounded-lg">
            <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma cautela registrada</h3>
            <p className="text-muted-foreground mb-4">Comece registrando novas cautelas de equipamentos.</p>
             <Button onClick={() => setIsLoanDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Registrar Primeira Cautela
            </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {loans.map((loan) => {
            const officer = officers.find(o => o.id === loan.officerId);
            return (
            <Card key={loan.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-lg font-semibold font-headline">
                    Cautela #{loan.id.substring(0, 6)}...
                  </CardTitle>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    loan.status === LoanStatus.ENTREGUE ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                    'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100'
                  }`}>
                    {loan.status}
                  </span>
                </div>
                {officer ? (
                  <>
                    <CardDescription className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" /> {officer.name} ({officer.rank})
                    </CardDescription>
                    {officer.functionalId && (
                      <CardDescription className="flex items-center text-sm mt-1">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <ContactDisplay contactValue={officer.functionalId} />
                      </CardDescription>
                    )}
                  </>
                ) : (
                  <CardDescription className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" /> Policial Desconhecido
                  </CardDescription>
                )}
                 <CardDescription className="flex items-center text-sm mt-1">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /> 
                  {format(parseISO(loan.loanDate), "dd/MM/yyyy", { locale: ptBR })} às {loan.loanTime}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <h4 className="font-medium text-sm text-foreground">Equipamentos:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {loan.equipment.map(eq => (
                    <li key={eq.id}>{eq.brand} ({eq.serialNumber})</li>
                  ))}
                </ul>
                {loan.loanObservation && (
                  <div>
                    <h4 className="font-medium text-sm text-foreground mt-2">Observação (Cautela):</h4>
                    <p className="text-sm text-muted-foreground">{loan.loanObservation}</p>
                  </div>
                )}
                 {loan.status === LoanStatus.DEVOLVIDO && loan.actualReturnDate && (
                   <>
                    <CardDescription className="flex items-center text-sm pt-2">
                      <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /> 
                      Devolvido em: {format(parseISO(loan.actualReturnDate), "dd/MM/yyyy", { locale: ptBR })} às {loan.actualReturnTime}
                    </CardDescription>
                    {loan.returnObservation && (
                       <div>
                        <h4 className="font-medium text-sm text-foreground mt-1">Observação (Devolução):</h4>
                        <p className="text-sm text-muted-foreground">{loan.returnObservation}</p>
                      </div>
                    )}
                   </>
                 )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                {loan.status === LoanStatus.ENTREGUE && (
                  <Button variant="default" size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleOpenReturnDialog(loan)}>
                    <ArrowLeftFromLine className="mr-2 h-4 w-4" /> Registrar Devolução
                  </Button>
                )}
                 {loan.status === LoanStatus.DEVOLVIDO && (
                  <p className="text-sm text-green-600 w-full text-center">Equipamento(s) devolvido(s).</p>
                )}
              </CardFooter>
            </Card>
          )})}
        </div>
      )}
      {/* Return Confirmation Dialog */}
      <AlertDialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Devolução</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a registrar a devolução dos equipamentos para a cautela #{selectedLoanForReturn?.id.substring(0,6)}.
              <div className="mt-4">
                <Label htmlFor="returnObservation">Observações da Devolução (Opcional)</Label>
                <Textarea
                  id="returnObservation"
                  value={returnObservation}
                  onChange={(e) => setReturnObservation(e.target.value)}
                  placeholder="Estado do equipamento, avarias, etc."
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedLoanForReturn(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReturn} className="bg-green-600 hover:bg-green-700">Confirmar Devolução</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

