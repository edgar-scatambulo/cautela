
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
      name: defaultValues?.name || "", // Will be "Nome de Guerra"
      fullName: defaultValues?.fullName || "", // Novo campo "Nome Completo"
      functionalId: defaultValues?.functionalId || "", // Will be "Contato"
      rank: defaultValues?.rank || "",
      unit: defaultValues?.unit || "", 
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
              <FormLabel>Nome de Guerra</FormLabel>
              <FormControl>
                <Input placeholder="Ex: SGT Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva Sauro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="functionalId" // This field now represents "Contato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contato</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Telefone ou Email" 
                    {...field} 
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
       
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (defaultValues?.id ? "Salvando..." : "Adicionando...") : (defaultValues?.id ? "Salvar Alterações" : "Adicionar Policial")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
