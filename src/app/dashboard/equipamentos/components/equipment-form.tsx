
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
import { EquipmentSchema } from "@/lib/schemas";
import { Equipment, EquipmentType } from "@/lib/types";

interface EquipmentFormProps {
  onSubmit: (values: z.infer<typeof EquipmentSchema>) => void;
  defaultValues?: Partial<Equipment>;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

export function EquipmentForm({ onSubmit, defaultValues, isSubmitting, isEditing }: EquipmentFormProps) {
  const form = useForm<z.infer<typeof EquipmentSchema>>({
    resolver: zodResolver(EquipmentSchema),
    defaultValues: {
      type: defaultValues?.type || undefined,
      brand: defaultValues?.brand || "",
      serialNumber: defaultValues?.serialNumber || "",
      status: defaultValues?.status || "Disponível",
      observations: defaultValues?.observations || "",
    },
  });

  const statusOptions = isEditing 
    ? ['Disponível', 'Em Cautela', 'Manutenção', 'Baixado']
    : ['Disponível', 'Manutenção'];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Equipamento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(EquipmentType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca / Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Samsung Galaxy S21, Motorola APX6000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="serialNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patrimônio</FormLabel>
              <FormControl>
                <Input placeholder="Nº de Patrimônio ou Identificador Único" {...field} 
                 onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
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
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes adicionais sobre o equipamento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEditing ? "Salvando..." : "Adicionando...") : (isEditing ? "Salvar Alterações" : "Adicionar Equipamento")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    