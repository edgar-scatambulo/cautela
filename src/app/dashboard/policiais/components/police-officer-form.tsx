
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
import { PoliceOfficerSchema } from "@/lib/schemas";
import type { PoliceOfficer } from "@/lib/types";

interface PoliceOfficerFormProps {
  onSubmit: (values: z.infer<typeof PoliceOfficerSchema>) => void;
  defaultValues?: Partial<PoliceOfficer>;
  isSubmitting?: boolean;
}

export function PoliceOfficerForm({ onSubmit, defaultValues, isSubmitting }: PoliceOfficerFormProps) {
  const form = useForm<z.infer<typeof PoliceOfficerSchema>>({
    resolver: zodResolver(PoliceOfficerSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      functionalId: defaultValues?.functionalId || "",
      rank: defaultValues?.rank || "",
      unit: defaultValues?.unit || "",
      contact: defaultValues?.contact || "",
      observations: defaultValues?.observations || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="functionalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Identificação Funcional (Matrícula)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: PM123456" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rank"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Posto/Graduação</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Soldado, Cabo, Sargento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidade/Setor</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 1º BPM, ROTAM, Inteligência" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contato (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Telefone ou Email" {...field} />
              </FormControl>
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
                <Textarea placeholder="Informações adicionais sobre o policial" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (defaultValues?.id ? "Salvando..." : "Adicionando...") : (defaultValues?.id ? "Salvar Alterações" : "Adicionar Policial")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
