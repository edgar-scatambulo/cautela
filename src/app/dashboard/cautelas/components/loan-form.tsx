
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoanSchema } from "@/lib/schemas";
import type { Loan, PoliceOfficer, Equipment } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

interface LoanFormProps {
  onSubmit: (values: z.infer<typeof LoanSchema>) => void;
  defaultValues?: Partial<z.infer<typeof LoanSchema>>;
  officers: PoliceOfficer[];
  availableEquipments: Equipment[]; 
  isSubmitting?: boolean;
}

export function LoanForm({ onSubmit, defaultValues, officers, availableEquipments, isSubmitting }: LoanFormProps) {
  const form = useForm<z.infer<typeof LoanSchema>>({
    resolver: zodResolver(LoanSchema),
    defaultValues: {
      officerId: defaultValues?.officerId || "",
      equipmentIds: defaultValues?.equipmentIds || [],
      loanDate: defaultValues?.loanDate || format(new Date(), "yyyy-MM-dd"),
      loanTime: defaultValues?.loanTime || format(new Date(), "HH:mm"),
      loanObservation: defaultValues?.loanObservation || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="officerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policial Responsável</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o policial" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {officers.map((officer) => (
                    <SelectItem key={officer.id} value={officer.id}>
                      {officer.name} - {officer.rank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="equipmentIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipamentos</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value?.length && "text-muted-foreground"
                      )}
                    >
                      {field.value?.length
                        ? `${field.value.length} equipamento(s) selecionado(s)`
                        : "Selecione os equipamentos"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <ScrollArea className="h-72">
                  {availableEquipments.map((equipment) => (
                    <FormField
                      key={equipment.id}
                      control={form.control}
                      name="equipmentIds"
                      render={({ field: itemField }) => {
                        return (
                          <FormItem
                            key={equipment.id}
                            className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-accent"
                          >
                            <FormControl>
                              <Checkbox
                                checked={itemField.value?.includes(equipment.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? itemField.onChange([...(itemField.value || []), equipment.id])
                                    : itemField.onChange(
                                        itemField.value?.filter(
                                          (value) => value !== equipment.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer w-full">
                              ({equipment.serialNumber}) {equipment.brand} 
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="loanDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Cautela</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP", { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="loanTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora da Cautela</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="loanObservation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações da Cautela (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes sobre a cautela, estado do equipamento, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar Cautela"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
