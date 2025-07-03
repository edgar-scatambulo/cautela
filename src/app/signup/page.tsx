import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-destructive text-destructive-foreground rounded-full p-3 w-fit mb-4">
                    <ShieldAlert className="h-8 w-8" />
                </div>
                <CardTitle>Cadastro Desabilitado</CardTitle>
                <CardDescription>
                    A página de cadastro inicial foi desabilitada por segurança.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Novos usuários devem ser criados por um administrador através do painel de gerenciamento.
                </p>
                 <Link href="/login" className="text-sm text-primary hover:underline mt-6 inline-block">
                    Voltar para Login
                </Link>
            </CardContent>
        </Card>
    </div>
  );
}
