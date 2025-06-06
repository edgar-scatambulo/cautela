
'use client';

import React from 'react';
import { PageHeader } from '@/components/page-header';
import { useStore } from '@/lib/store';
import { Loan, PoliceOfficer, LoanStatus } from '@/lib/types';
import { ReportFilters } from './components/report-filters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User, CalendarDays, PackageSearch, Info, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, isWithinInterval, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

const getOfficerName = (officerId: string, officers: PoliceOfficer[]): string => {
  const officer = officers.find(o => o.id === officerId);
  return officer ? `${officer.name} (${officer.rank})` : 'Desconhecido';
};

export default function RelatoriosPage() {
  const { loans, officers } = useStore();
  const [filteredLoans, setFilteredLoans] = React.useState<Loan[]>([]);

  React.useEffect(() => {
    setFilteredLoans([...loans].sort((a, b) => new Date(b.loanDate + "T" + b.loanTime).getTime() - new Date(a.loanDate + "T" + a.loanTime).getTime()));
  }, [loans]);

  const handleFilterChange = (filters: { dateRange?: DateRange; officerId?: string; status?: string; patrimony?: string }) => {
    let tempLoans = [...loans]; 

    if (filters.dateRange?.from) {
      const fromDate = filters.dateRange.from;
      const toDate = filters.dateRange.to || filters.dateRange.from;

      tempLoans = tempLoans.filter(loan => {
        const loanDate = parseISO(loan.loanDate);
        if (!isValid(loanDate)) return false;
        const adjustedToDate = new Date(toDate);
        adjustedToDate.setHours(23, 59, 59, 999);
        return isWithinInterval(loanDate, { start: fromDate, end: adjustedToDate });
      });
    }

    if (filters.officerId && filters.officerId !== 'all') {
      tempLoans = tempLoans.filter(loan => loan.officerId === filters.officerId);
    }

    if (filters.status && filters.status !== 'all') {
      tempLoans = tempLoans.filter(loan => loan.status === filters.status);
    }

    if (filters.patrimony) {
      const searchTerm = filters.patrimony.toLowerCase();
      tempLoans = tempLoans.filter(loan =>
        loan.equipment.some(eq =>
          eq.serialNumber.toLowerCase().includes(searchTerm)
        )
      );
    }
    
    setFilteredLoans(tempLoans.sort((a, b) => new Date(b.loanDate + "T" + b.loanTime).getTime() - new Date(a.loanDate + "T" + a.loanTime).getTime()));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-center mb-6 hidden print:block page-header-print-title font-headline">
        Relatório de Cautelas
      </h1>

      <PageHeader
        title="Relatório de Cautelas"
        description="Visualize todas as cautelas efetuadas com filtros por data, policial, status da cautela e patrimônio do equipamento."
        icon={FileText}
        actions={
          <Button onClick={handlePrint} variant="outline" className="print:hidden">
            <Printer className="mr-2 h-4 w-4" /> Imprimir Relatório
          </Button>
        }
        className="print:hidden"
      />

      <div className="print:hidden">
        <ReportFilters officers={officers} onFilterChange={handleFilterChange} />
      </div>

      {filteredLoans.length === 0 ? (
         <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border rounded-lg print:hidden">
            <Info className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma cautela encontrada</h3>
            <p className="text-muted-foreground">Não há cautelas que correspondam aos filtros aplicados ou nenhuma cautela foi registrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredLoans.map((loan) => (
            <Card key={loan.id} className="card-print">
              <CardHeader>
                 <div className="flex items-center justify-end mb-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    loan.status === LoanStatus.ENTREGUE ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                    'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100'
                  }`}>
                    {loan.status}
                  </span>
                </div>
                <CardDescription className="flex items-center text-sm font-semibold text-foreground">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" /> {getOfficerName(loan.officerId, officers)}
                </CardDescription>
                 <CardDescription className="flex items-center text-sm">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /> 
                  Data Cautela: {format(parseISO(loan.loanDate), "dd/MM/yyyy", { locale: ptBR })} às {loan.loanTime}
                </CardDescription>
                 {loan.status === LoanStatus.DEVOLVIDO && loan.actualReturnDate && loan.actualReturnTime && (
                    <CardDescription className="flex items-center text-sm">
                      <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /> 
                      Data Devolução: {format(parseISO(loan.actualReturnDate), "dd/MM/yyyy", { locale: ptBR })} às {loan.actualReturnTime}
                    </CardDescription>
                  )}
              </CardHeader>
              <CardContent>
                <h4 className="font-medium text-sm text-foreground mb-1">Equipamentos:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {loan.equipment.map(eq => (
                    <li key={eq.id}>{eq.brand} ({eq.serialNumber})</li>
                  ))}
                </ul>
                {loan.loanObservation && (
                  <div className="mt-2">
                    <h4 className="font-medium text-sm text-foreground">Obs. (Cautela):</h4>
                    <p className="text-sm text-muted-foreground">{loan.loanObservation}</p>
                  </div>
                )}
                 {loan.returnObservation && (
                  <div className="mt-2">
                    <h4 className="font-medium text-sm text-foreground">Obs. (Devolução):</h4>
                    <p className="text-sm text-muted-foreground">{loan.returnObservation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
