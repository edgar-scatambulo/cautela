
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import type { PoliceOfficer } from '@/lib/types';
import { LoanStatus } from '@/lib/types';

interface ReportFiltersProps {
  officers: PoliceOfficer[];
  onFilterChange: (filters: { dateRange?: DateRange; officerId?: string; status?: string }) => void;
}

export function ReportFilters({ officers, onFilterChange }: ReportFiltersProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [officerId, setOfficerId] = React.useState<string | undefined>(undefined);
  const [status, setStatus] = React.useState<string | undefined>(undefined);

  const handleApplyFilters = () => {
    onFilterChange({ dateRange, officerId, status });
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-card shadow">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <Label htmlFor="date-range" className="mb-1 block">Período da Cautela</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date-range"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "LLL dd, y", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y", { locale: ptBR })
                  )
                ) : (
                  <span>Escolha um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="officer-select" className="mb-1 block">Policial</Label>
          <Select value={officerId} onValueChange={setOfficerId}>
            <SelectTrigger id="officer-select">
              <SelectValue placeholder="Todos os policiais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os policiais</SelectItem>
              {officers.map((officer) => (
                <SelectItem key={officer.id} value={officer.id}>
                  {officer.name} ({officer.rank}) {/* Display rank instead of functionalId here for brevity */}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status-select" className="mb-1 block">Status da Cautela</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status-select">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value={LoanStatus.ENTREGUE}>{LoanStatus.ENTREGUE}</SelectItem>
              <SelectItem value={LoanStatus.DEVOLVIDO}>{LoanStatus.DEVOLVIDO}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleApplyFilters} className="w-full md:w-auto">
          <Search className="mr-2 h-4 w-4" /> Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
