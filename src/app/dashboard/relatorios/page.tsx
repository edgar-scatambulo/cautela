
'use client';

import React from 'react';
import { PageHeader } from '@/components/page-header';
import { useStore } from '@/lib/store';
import { Loan, PoliceOfficer } from '@/lib/types';
import { ReportFilters } from './components/report-filters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User, CalendarDays, PackageSearch, Info } from 'lucide-react';
import { format, parseISO, isWithinInterval, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

const getOfficerName = (officerId: string, officers: PoliceOfficer[]): string => {
  const officer = officers.find(o => o.id === officerId);
  return officer ? `${officer.name} (${officer.rank})` : 'Desconhecido';
};

export default function RelatoriosPage() {
  const { loans, officers } = useStore();
  const [filteredLoans, setFilteredLoans] = React.useState<Loan[]>(loans);

  React.useEffect(() => {
    setFilteredLoans(loans); // Initialize with all loans
  }, [loans]);

  const handleFilterChange = (filters: { dateRange?: DateRange; officerId?: string }) => {
    let tempLoans = [...loans];

    if (filters.dateRange?.from) {
      const fromDate = filters.dateRange.from;
      const toDate = filters.dateRange.to || filters.dateRange.from; // If no 'to' date, use 'from' date for single day range

      tempLoans = tempLoans.filter(loan => {
        const loanDate = parseISO(loan.loanDate);
        if (!isValid(loanDate)) return false;
        return isWithinInterval(loanDate, { start: fromDate, end: toDate });
      });
    }

    if (filters.officerId && filters.officerId !== 'all') {
      tempLoans = tempLoans.filter(loan => loan.officerId === filters.officerId);
    }
    
    setFilteredLoans(tempLoans);
  };

  return (
    <>
      <PageHeader
        title="Relatório de Cautelas"
        description="Visualize todas as cautelas efetuadas com filtros por data e policial."
        icon={FileText}
      />

      <ReportFilters officers={officers} onFilterChange={handleFilterChange} />

      {filteredLoans.length === 0 ? (
         <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Info className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma cautela encontrada</h3>
            <p className="text-muted-foreground">Não há cautelas que correspondam aos filtros aplicados ou nenhuma cautela foi registrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredLoans.map((loan) => (
            <Card key={loan.id}>
              <CardHeader>
                 <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-lg font-semibold font-headline">
                    Cautela #{loan.id.substring(0, 6)}...
                  </CardTitle>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    loan.status === 'Entregue' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                    'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100'
                  }`}>
                    {loan.status}
                  </span>
                </div>
                <CardDescription className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" /> Policial: {getOfficerName(loan.officerId, officers)}
                </CardDescription>
                 <CardDescription className="flex items-center text-sm">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /> 
                  Data Cautela: {format(parseISO(loan.loanDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </CardDescription>
                 {loan.status === 'Devolvido' && loan.actualReturnDate && (
                    <CardDescription className="flex items-center text-sm">
                      <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /> 
                      Data Devolução: {format(parseISO(loan.actualReturnDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </CardDescription>
                  )}
              </CardHeader>
              <CardContent>
                <h4 className="font-medium text-sm text-foreground mb-1">Equipamentos:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {loan.equipment.map(eq => (
                    <li key={eq.id}>{eq.brand}{eq.model ? ` ${eq.model}` : ''} (S/N: {eq.serialNumber})</li>
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
