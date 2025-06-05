import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <CardTitle className="text-3xl font-headline">Cautela Digital</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sistema de Gerenciamento de Cautelas de Equipamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <p className="text-center text-foreground">
            Bem-vindo ao Cautela Digital. Acesse sua conta para gerenciar equipamentos, policiais e cautelas de forma eficiente e segura.
          </p>
          <Link href="/login" legacyBehavior>
            <Button size="lg" className="w-full">
              <LogIn className="mr-2 h-5 w-5" />
              Acessar Sistema
            </Button>
          </Link>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Cautela Digital. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
