
'use client';

import React from 'react';
import { PageHeader } from '@/components/page-header';
import { useStore } from '@/lib/store';
import { Loan, PoliceOfficer, LoanStatus, Equipment } from '@/lib/types';
import { ReportFilters } from './components/report-filters';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { FileText, User, CalendarDays, Info, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parse, isValid, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

const getOfficerName = (officerId: string, officers: PoliceOfficer[]): string => {
  const officer = officers.find(o => o.id === officerId);
  return officer ? `${officer.name} (${officer.rank})` : 'Desconhecido';
};

const getOperatorName = (officerId: string, officers: PoliceOfficer[]): string => {
    const officer = officers.find(o => o.id === officerId);
    return officer ? officer.name : 'Desconhecido';
};


export default function RelatoriosPage() {
  const { loans, officers, equipments } = useStore();
  const [filteredLoans, setFilteredLoans] = React.useState<Loan[]>([]);

  React.useEffect(() => {
    setFilteredLoans([...loans].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, [loans]);

  const handleFilterChange = (filters: { dateRange?: DateRange; officerId?: string; status?: string; patrimony?: string }) => {
    let tempLoans = [...loans]; 

    if (filters.dateRange?.from) {
      const fromDate = filters.dateRange.from;
      const toDate = filters.dateRange.to || filters.dateRange.from;

      tempLoans = tempLoans.filter(loan => {
        const loanDateObj = parse(loan.loanDate, 'yyyy-MM-dd', new Date());
        if (!isValid(loanDateObj)) return false;
        const adjustedToDate = new Date(toDate);
        adjustedToDate.setHours(23, 59, 59, 999);
        return isWithinInterval(loanDateObj, { start: fromDate, end: adjustedToDate });
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
      tempLoans = tempLoans.filter(loan => {
        const loanEquipments = loan.equipmentIds.map(id => equipments.find(e => e.id === id)).filter(Boolean) as Equipment[];
        return loanEquipments.some(eq => eq.serialNumber.toLowerCase().includes(searchTerm));
      });
    }
    
    setFilteredLoans(tempLoans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handlePrint = () => {
    window.print();
  };

  const getLoanEquipments = (loan: Loan) => {
    return loan.equipmentIds.map(id => equipments.find(e => e.id === id)).filter(Boolean) as Equipment[];
  }

  const pageHeaderActions = (
    <Button onClick={handlePrint} variant="outline" className="print:hidden">
      <Printer className="mr-2 h-4 w-4" /> Imprimir Relatório
    </Button>
  );

  return (
    <>
      <h1 className="text-3xl font-bold text-center mb-6 hidden print:block page-header-print-title font-headline">
        Relatório de Cautelas
      </h1>

      <PageHeader
        title="Relatório de Cautelas"
        description="Visualize todas as cautelas efetuadas com filtros por data, policial, status da cautela e patrimônio do equipamento."
        icon={FileText}
        actions={pageHeaderActions}
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
          {filteredLoans.map((loan) => {
            const loanEquipments = getLoanEquipments(loan);
            const radioOperator = loan.radioOperatorId ? officers.find(o => o.id === loan.radioOperatorId) : null;
            const returnedByUser = loan.returnedToUserId ? officers.find(u => u.id === loan.returnedToUserId) : null;
            return (
            <div key={loan.id}>
              <Card className="print:hidden">
                <CardHeader>
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-grow">
                        <CardDescription className="flex items-center text-sm font-semibold text-foreground">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" /> {getOfficerName(loan.officerId, officers)}
                        </CardDescription>
                        <CardDescription className="flex items-center text-sm mt-0.5">
                          <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /> 
                          Cautela: {format(parse(loan.loanDate, 'yyyy-MM-dd', new Date()), "dd/MM/yy", { locale: ptBR })} às {loan.loanTime}
                        </CardDescription>
                        {loan.status === LoanStatus.DEVOLVIDO && loan.actualReturnDate && loan.actualReturnTime && (
                            <CardDescription className="flex items-center text-sm mt-0.5">
                            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /> 
                            Devolução: {format(parse(loan.actualReturnDate, 'yyyy-MM-dd', new Date()), "dd/MM/yy", { locale: ptBR })} às {loan.actualReturnTime}
                            </CardDescription>
                        )}
                         {radioOperator && (
                            <CardDescription className="flex items-center text-sm mt-0.5">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                Entregue por: {radioOperator.name}
                            </CardDescription>
                        )}
                        {returnedByUser && (
                        <CardDescription className="flex items-center text-sm mt-0.5">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            Recebido por: {returnedByUser.name}
                        </CardDescription>
                        )}
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      loan.status === LoanStatus.ENTREGUE ? 
                        'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-medium text-sm text-foreground mb-1">Equipamentos:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {loanEquipments.map(eq => (
                      <li key={eq.id} className="print:mb-px">{eq.brand} ({eq.serialNumber})</li>
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

              <div className="hidden print:block print-cautela-item">
                <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
                    <div className="font-bold">Status:</div>
                    <div>{loan.status}</div>

                    <div className="font-bold">Data Cautela:</div>
                    <div>{format(parse(loan.loanDate, 'yyyy-MM-dd', new Date()), "dd/MM/yyyy", { locale: ptBR })} às {loan.loanTime}</div>

                    {loan.status === LoanStatus.DEVOLVIDO && loan.actualReturnDate && (
                      <>
                        <div className="font-bold">Data Devolução:</div>
                        <div>{format(parse(loan.actualReturnDate, 'yyyy-MM-dd', new Date()), "dd/MM/yyyy", { locale: ptBR })} às {loan.actualReturnTime}</div>
                      </>
                    )}

                    <div className="font-bold">Policial Responsável:</div>
                    <div>{getOfficerName(loan.officerId, officers)}</div>
                     
                     {radioOperator && (
                      <>
                        <div className="font-bold">Entregue por:</div>
                        <div>{getOperatorName(loan.radioOperatorId, officers)}</div>
                      </>
                     )}

                     {loan.returnedToUserId && (
                      <>
                        <div className="font-bold">Recebido por:</div>
                        <div>{getOperatorName(loan.returnedToUserId, officers)}</div>
                      </>
                     )}
                    
                    <div className="font-bold self-start">Equipamentos:</div>
                    <div>
                        {loanEquipments.map((eq) => (
                            <div key={eq.id}>{eq.brand} ({eq.serialNumber})</div>
                        ))}
                    </div>
                    
                    {loan.loanObservation && (
                        <>
                            <div className="font-bold mt-2 self-start">Obs. (Cautela):</div>
                            <div className="mt-2">{loan.loanObservation}</div>
                        </>
                    )}
                    
                    {loan.returnObservation && (
                        <>
                            <div className="font-bold mt-2 self-start">Obs. (Devolução):</div>
                            <div className="mt-2">{loan.returnObservation}</div>
                        </>
                    )}
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </>
  );
}
