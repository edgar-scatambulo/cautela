
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SignupSchema } from "@/lib/schemas";
import { useStore } from "@/lib/store";
import { UserPlus } from "lucide-react";
import Link from "next/link";

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { signup } = useStore();

  const form = useForm<z.infer<typeof SignupSchema>>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SignupSchema>) {
    try {
      await signup(values);
      toast({
        title: "Administrador Criado!",
        description: "Conta de administrador criada com sucesso. Faça o login para continuar.",
      });
      router.push("/login");
    } catch (error: any) {
       let description = error.message || "Ocorreu um erro desconhecido.";
       if (error.code === 'auth/configuration-not-found') {
           description = "Configuração do Firebase não encontrada. Verifique se o arquivo .env.local está correto e reinicie o servidor de desenvolvimento.";
       }
       toast({
        title: "Erro ao Criar Conta",
        description: description,
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline">Criar Administrador</CardTitle>
        <CardDescription>Crie o primeiro usuário administrador do sistema. Esta opção será desabilitada após o primeiro uso.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Maria Oliveira" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="seu.email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: maria.oliveira" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Criando..." : <><UserPlus className="mr-2 h-4 w-4" /> Criar Administrador</>}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Já tem uma conta?{" "}
          <Link href="/login" className="underline text-primary hover:text-primary/80">
            Fazer login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
