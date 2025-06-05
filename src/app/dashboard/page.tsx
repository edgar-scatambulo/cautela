
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { DashboardStatCard } from '@/components/dashboard-stat-card';
import { useStore } from '@/lib/store';
import { ClipboardList, Shield, Smartphone, Users, PlusCircle, FileText, PackagePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoanForm } from './cautelas/components/loan-form';
import { EquipmentForm } from './equipamentos/components/equipment-form';
import { useToast } from '@/hooks/use-toast';
import { LoanSchema, EquipmentSchema } from '@/lib/schemas';
import type { z } from 'zod';
import type { Equipment } from '@/lib/types';

export default function DashboardPage() {
  const { currentUser, equipments, officers, loans, addLoan, addEquipment } = useStore();
  const { toast } = useToast();

  const [totalEquipments, setTotalEquipments] = useState(0);
  const [totalOfficers, setTotalOfficers] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);

  // State for Loan Dialog
  const [isLoanDialogOpen, setIsLoanDialogOpen] = React.useState(false);
  const [isSubmittingLoan, setIsSubmittingLoan] = React.useState(false);
  const availableEquipments = equipments.filter(eq => eq.status === 'Disponível');

  // State for Equipment Dialog
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = React.useState(false);
  const [isSubmittingEquipment, setIsSubmittingEquipment] = React.useState(false);


  useEffect(() => {
    setTotalEquipments(equipments.length);
    setTotalOfficers(officers.length);
    setActiveLoans(loans.filter(loan => loan.status === 'Entregue').length);
  }, [equipments, officers, loans]);

  if (!currentUser) {
    return null; 
  }

  const handleLoanFormSubmit = async (values: z.infer<typeof LoanSchema>) => {
    setIsSubmittingLoan(true);
    try {
      addLoan(values);
      toast({ title: "Cautela Registrada", description: `Nova cautela registrada com sucesso.` });
      setIsLoanDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao Registrar Cautela", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    } finally {
      setIsSubmittingLoan(false);
    }
  };

  const handleEquipmentFormSubmit = async (values: z.infer<typeof EquipmentSchema>) => {
    setIsSubmittingEquipment(true);
    try {
      const newEquipmentData = {
        ...values,
        serialNumber: values.serialNumber.toUpperCase(),
        status: values.status || 'Disponível',
      } as Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>;
      addEquipment(newEquipmentData);
      toast({ title: "Equipamento Adicionado", description: `O equipamento ${values.brand} foi adicionado.` });
      setIsEquipmentDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Ocorreu um erro ao salvar o equipamento.", variant: "destructive" });
    } finally {
      setIsSubmittingEquipment(false);
    }
  };


  return (
    <>
      <PageHeader
        title={`Bem-vindo(a), ${currentUser.name}!`}
        description="Visão geral do sistema Cautela Control."
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
        <DashboardStatCard
          title="Cautelas Ativas"
          value={activeLoans}
          icon={ClipboardList}
          description="Equipamentos atualmente emprestados"
        />
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold font-headline text-foreground mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nova Cautela Card */}
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
              </DialogHeader>
              <LoanForm 
                onSubmit={handleLoanFormSubmit} 
                officers={officers}
                availableEquipments={availableEquipments}
                isSubmitting={isSubmittingLoan}
              />
            </DialogContent>
          </Dialog>

          {/* Adicionar Equipamento Card */}
           <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center">
                  <PackagePlus className="mr-2 h-5 w-5 text-primary" />
                  Adicionar Equipamento
                </CardTitle>
                <CardDescription>Cadastrar um novo item no inventário.</CardDescription>
              </CardHeader>
              <CardContent>
                <DialogTrigger asChild>
                  <Button className="w-full">
                     <PackagePlus className="mr-2 h-4 w-4" /> Adicionar Equipamento
                  </Button>
                </DialogTrigger>
              </CardContent>
            </Card>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Equipamento</DialogTitle>
              </DialogHeader>
              <EquipmentForm 
                onSubmit={handleEquipmentFormSubmit}
                isSubmitting={isSubmittingEquipment} 
              />
            </DialogContent>
          </Dialog>

          {/* Ver Relatórios Card */}
          <Link href="/dashboard/relatorios" legacyBehavior>
            <a className="block">
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-headline flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-primary" />
                    Ver Relatórios
                  </CardTitle>
                  <CardDescription>Acessar histórico de cautelas.</CardDescription>
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

    </>
  );
}
