
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { DashboardStatCard } from '@/components/dashboard-stat-card';
import { useStore } from '@/lib/store';
import { ClipboardList, Shield, Smartphone, Users, PlusCircle, FileText, PackagePlus, ArrowLeftFromLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription as ShadDialogDescription } from '@/components/ui/dialog';
import { LoanForm } from './cautelas/components/loan-form';
import { useToast } from '@/hooks/use-toast';
import { LoanSchema } from '@/lib/schemas';
import type { z } from 'zod';
import type { PoliceOfficer, Loan, Equipment } from '@/lib/types';
import { LoanStatus, UserRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, parse, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DashboardPage() {
  const { currentUser, equipments, officers, loans, addLoan, updateLoanStatus } = useStore();
  const { toast } = useToast();

  const [totalEquipments, setTotalEquipments] = useState(0);
  const [totalOfficers, setTotalOfficers] = useState(0);
  const [activeLoansCount, setActiveLoansCount] = useState(0);

  const [isLoanDialogOpen, setIsLoanDialogOpen] = React.useState(false);
  const [isSubmittingLoan, setIsSubmittingLoan] = React.useState(false);
  const availableEquipments = equipments.filter(eq => eq.status === 'Disponível');

  const [isReturnDialogOpen, setIsReturnDialogOpen] = React.useState(false);
  const [selectedLoanForReturn, setSelectedLoanForReturn] = React.useState<Loan | null>(null);
  const [returnObservation, setReturnObservation] = React.useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = React.useState(false);
  const [equipmentIdsForCurrentReturn, setEquipmentIdsForCurrentReturn] = React.useState<string[]>([]);
  const [receivingOperatorId, setReceivingOperatorId] = React.useState<string>('');

  const activeLoansList = loans.filter(loan => loan.status === LoanStatus.ENTREGUE);
  
  const radioOperators = React.useMemo(() => {
    return officers.filter(o => o.isRadioOperator).sort((a, b) => a.name.localeCompare(b.name));
  }, [officers]);

  useEffect(() => {
    setTotalEquipments(equipments.length);
    setTotalOfficers(officers.length);
    setActiveLoansCount(loans.filter(loan => loan.status === LoanStatus.ENTREGUE).length);
  }, [equipments, officers, loans]);

  if (!currentUser) {
    return null; 
  }
  
  const getOfficerName = (officerId: string): string => {
    const officer = officers.find(o => o.id === officerId);
    return officer ? `${officer.name} (${officer.rank})` : 'Desconhecido';
  };

  const handleLoanFormSubmit = async (values: z.infer<typeof LoanSchema>) => {
    setIsSubmittingLoan(true);
    try {
      await addLoan(values);
      toast({ title: "Cautela Registrada", description: `Nova cautela registrada com sucesso.` });
      setIsLoanDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao Registrar Cautela", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    } finally {
      setIsSubmittingLoan(false);
    }
  };

  const handleReturnFormSubmit = async () => {
    if (!selectedLoanForReturn || !currentUser || !receivingOperatorId) {
      toast({ title: "Erro", description: "Selecione uma cautela e um rádio operador para devolver.", variant: "destructive" });
      return;
    }
    setIsSubmittingReturn(true);
    try {
      await updateLoanStatus(selectedLoanForReturn.id, LoanStatus.DEVOLVIDO, equipmentIdsForCurrentReturn, undefined, undefined, returnObservation, receivingOperatorId);
      toast({ title: "Devolução Registrada", description: "A devolução foi registrada com sucesso." });
      setIsReturnDialogOpen(false);
      setSelectedLoanForReturn(null);
      setReturnObservation('');
      setEquipmentIdsForCurrentReturn([]);
      setReceivingOperatorId('');
    } catch (error: any) {
      toast({ title: "Erro ao Registrar Devolução", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    } finally {
      setIsSubmittingReturn(false);
    }
  };
  
  const getLoanEquipments = (loan: Loan) => {
    return loan.equipmentIds.map(id => equipments.find(e => e.id === id)).filter(Boolean) as Equipment[];
  }
  
  const handleSelectAllForReturn = (checked: boolean) => {
    if (checked && selectedLoanForReturn) {
      setEquipmentIdsForCurrentReturn(getLoanEquipments(selectedLoanForReturn).map(e => e.id));
    } else {
      setEquipmentIdsForCurrentReturn([]);
    }
  };
  
  const handleLoanSelectChange = (loanId: string) => {
    const loan = activeLoansList.find(l => l.id === loanId);
    if (loan) {
      setSelectedLoanForReturn(loan);
      setEquipmentIdsForCurrentReturn(getLoanEquipments(loan).map(e => e.id));
    } else {
      setSelectedLoanForReturn(null);
      setEquipmentIdsForCurrentReturn([]);
    }
  };

  const canManageLoans = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.ADVANCED_USER || currentUser?.role === UserRole.OPERATOR;

  return (
    <>
      <PageHeader
        title={`Bem-vindo(a), ${currentUser.name}!`}
        description="Visão geral do sistema Cautela Digital."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStatCard
          title="Equipamentos Cadastrados"
          value={totalEquipments}
          icon={Smartphone}
          description="Total de itens no inventário"
        />
        <DashboardStatCard
          title="Policiais Registrados"
          value={totalOfficers}
          icon={Shield}
          description="Total de policiais no sistema"
        />
        <Link href={`/dashboard/cautelas?status=${LoanStatus.ENTREGUE}`} legacyBehavior>
          <a className="block cursor-pointer">
            <DashboardStatCard
              title="Cautelas Ativas"
              value={activeLoansCount}
              icon={ClipboardList}
              description="Equipamentos atualmente emprestados"
            />
          </a>
        </Link>
      </div>
      
      {canManageLoans && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold font-headline text-foreground mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Dialog open={isLoanDialogOpen} onOpenChange={setIsLoanDialogOpen}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg font-headline flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5 text-primary" />
                    Nova Cautela
                  </CardTitle>
                  <CardDescription>Registrar nova cautela.</CardDescription>
                </CardHeader>
                <CardContent>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" /> Registrar Cautela
                    </Button>
                  </DialogTrigger>
                </CardContent>
              </Card>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar Nova Cautela</DialogTitle>
                  <ShadDialogDescription>Preencha os dados abaixo para registrar uma nova cautela de equipamento.</ShadDialogDescription>
                </DialogHeader>
                <LoanForm 
                  onSubmit={handleLoanFormSubmit} 
                  officers={officers}
                  availableEquipments={availableEquipments}
                  isSubmitting={isSubmittingLoan}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isReturnDialogOpen} onOpenChange={(open) => {
              setIsReturnDialogOpen(open);
              if (!open) {
                setSelectedLoanForReturn(null);
                setReturnObservation('');
                setReceivingOperatorId('');
              }
            }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg font-headline flex items-center">
                    <ArrowLeftFromLine className="mr-2 h-5 w-5 text-primary" />
                    Registrar Devolução
                  </CardTitle>
                  <CardDescription>Registrar devolução de equipamentos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <ArrowLeftFromLine className="mr-2 h-4 w-4" /> Registrar Devolução
                    </Button>
                  </DialogTrigger>
                </CardContent>
              </Card>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Devolução de Equipamento</DialogTitle>
                  <ShadDialogDescription>Selecione a cautela ativa para registrar a devolução.</ShadDialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="loan-select">Selecionar Cautela Ativa</Label>
                    <Select
                      value={selectedLoanForReturn?.id}
                      onValueChange={handleLoanSelectChange}
                      disabled={activeLoansList.length === 0}
                    >
                      <SelectTrigger id="loan-select">
                        <SelectValue placeholder={activeLoansList.length === 0 ? "Nenhuma cautela ativa" : "Selecione uma cautela"} />
                      </SelectTrigger>
                      <SelectContent>
                        {activeLoansList.map(loan => (
                          <SelectItem key={loan.id} value={loan.id}>
                            ({getOfficerName(loan.officerId)}) Data: {format(parse(loan.loanDate, 'yyyy-MM-dd', new Date()), "dd/MM/yy", { locale: ptBR })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {activeLoansList.length === 0 && <p className="text-sm text-muted-foreground">Não há cautelas ativas para registrar devolução.</p>}
                  </div>
                  
                  {selectedLoanForReturn && (
                    <div className="space-y-2">
                      <Label htmlFor="dash-receiving-operator-select">Rádio Operador (Recebedor)</Label>
                      <Select onValueChange={setReceivingOperatorId} value={receivingOperatorId} disabled={radioOperators.length === 0}>
                          <SelectTrigger id="dash-receiving-operator-select">
                            <SelectValue placeholder={radioOperators.length === 0 ? "Nenhum rádio operador" : "Selecione o recebedor"} />
                          </SelectTrigger>
                        <SelectContent>
                          {radioOperators.map((operator) => (
                            <SelectItem key={operator.id} value={operator.id}>
                              {operator.name} - {operator.rank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedLoanForReturn && getLoanEquipments(selectedLoanForReturn).length > 1 && (
                    <div className="space-y-2">
                        <Label>Equipamentos a Devolver</Label>
                        <ScrollArea className="h-40 w-full rounded-md border p-2">
                            <div className="flex items-center space-x-2 pb-2 border-b mb-2">
                                <Checkbox
                                    id="select-all-return-dash"
                                    checked={equipmentIdsForCurrentReturn.length === getLoanEquipments(selectedLoanForReturn).length}
                                    onCheckedChange={handleSelectAllForReturn}
                                />
                                <Label htmlFor="select-all-return-dash" className="font-medium">Selecionar Todos</Label>
                            </div>
                            {getLoanEquipments(selectedLoanForReturn).map((equipment) => (
                                <div key={equipment.id} className="flex items-center space-x-2 py-1">
                                    <Checkbox
                                        id={`return-dash-${equipment.id}`}
                                        checked={equipmentIdsForCurrentReturn.includes(equipment.id)}
                                        onCheckedChange={(checked) => {
                                            setEquipmentIdsForCurrentReturn(currentIds => 
                                                checked ? [...currentIds, equipment.id] : currentIds.filter(id => id !== equipment.id)
                                            )
                                        }}
                                    />
                                    <Label htmlFor={`return-dash-${equipment.id}`} className="font-normal">{equipment.brand} ({equipment.serialNumber})</Label>
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="return-observation">Observações da Devolução (Opcional)</Label>
                    <Textarea
                      id="return-observation"
                      value={returnObservation}
                      onChange={(e) => setReturnObservation(e.target.value)}
                      placeholder="Estado do equipamento, avarias, etc."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleReturnFormSubmit} disabled={isSubmittingReturn || !selectedLoanForReturn || equipmentIdsForCurrentReturn.length === 0 || !receivingOperatorId}>
                    {isSubmittingReturn ? "Registrando..." : "Confirmar Devolução"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Link href="/dashboard/relatorios" legacyBehavior>
              <a className="block">
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-headline flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-primary" />
                      Ver Relatórios
                    </CardTitle>
                    <CardDescription>Histórico de cautelas.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <Button className="w-full">
                      <FileText className="mr-2 h-4 w-4" /> Acessar Relatórios
                    </Button>
                  </CardContent>
                </Card>
              </a>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
