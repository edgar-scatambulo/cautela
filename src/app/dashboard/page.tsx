'use client';

import { PageHeader } from '@/components/page-header';
import { DashboardStatCard } from '@/components/dashboard-stat-card';
import { useStore } from '@/lib/store';
import { ClipboardList, Shield, Smartphone, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { currentUser, equipments, officers, loans } = useStore();
  const [totalEquipments, setTotalEquipments] = useState(0);
  const [totalOfficers, setTotalOfficers] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);

  useEffect(() => {
    setTotalEquipments(equipments.length);
    setTotalOfficers(officers.length);
    setActiveLoans(loans.filter(loan => loan.status === 'Entregue').length);
  }, [equipments, officers, loans]);

  if (!currentUser) {
    return null; // Or a loading state, layout handles redirect
  }

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
      {/* Additional sections or quick actions can be added here */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold font-headline text-foreground mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Example Quick Action Card - Replace with actual links/buttons */}
          <div className="p-4 bg-card rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-foreground mb-1">Nova Cautela</h3>
            <p className="text-sm text-muted-foreground">Registrar um novo empréstimo de equipamento.</p>
          </div>
          <div className="p-4 bg-card rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-foreground mb-1">Adicionar Equipamento</h3>
            <p className="text-sm text-muted-foreground">Cadastrar um novo item no inventário.</p>
          </div>
          <div className="p-4 bg-card rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-foreground mb-1">Ver Relatórios</h3>
            <p className="text-sm text-muted-foreground">Acessar histórico de cautelas.</p>
          </div>
        </div>
      </div>
    </>
  );
}
