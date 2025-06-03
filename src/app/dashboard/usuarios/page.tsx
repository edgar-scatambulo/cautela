
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserForm } from './components/user-form';
import { useStore } from '@/lib/store';
import type { SystemUser } from '@/lib/types';
import { UserRole } from '@/lib/types';
import { UserCog, UserPlus, Edit3, Trash2, ShieldAlert, UserCircle, Mail, KeyRound, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SystemUserSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { Badge } from '@/components/ui/badge';

export default function UsuariosPage() {
  const { users, addUser, updateUser, deleteUser, currentUser } = useStore();
  const { toast } = useToast();
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<SystemUser | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<SystemUser | null>(null);

  if (currentUser?.role !== UserRole.ADMIN) {
    return (
       <div className="flex flex-col items-center justify-center h-full">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const handleFormSubmit = async (values: z.infer<typeof SystemUserSchema>) => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updateValues = {...values};
        // If password is not provided for editing, it should be undefined
        // The form component already handles sending undefined if password field is empty for edit
        updateUser({ ...editingUser, ...updateValues });
        toast({ title: "Usuário Atualizado", description: `Os dados de ${values.name} foram atualizados.` });
      } else {
        if (!values.password) { // Should be caught by schema, but as a safeguard
            toast({ title: "Erro", description: "Senha é obrigatória para novos usuários.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }
        addUser(values as Omit<SystemUser, 'id' | 'createdAt' | 'updatedAt'>);
        toast({ title: "Usuário Adicionado", description: `${values.name} foi adicionado ao sistema.` });
      }
      setIsFormDialogOpen(false);
      setEditingUser(undefined);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Ocorreu um erro ao salvar o usuário.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openAddDialog = () => {
    setEditingUser(undefined);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (user: SystemUser) => {
    setEditingUser(user);
    setIsFormDialogOpen(true);
  };

  const openDeleteDialog = (user: SystemUser) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      try {
        deleteUser(userToDelete.id);
        toast({ title: "Usuário Excluído", description: `O usuário ${userToDelete.name} foi excluído.` });
      } catch (error: any) {
         toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
      } finally {
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
      }
    }
  };
  
  return (
    <>
      <PageHeader
        title="Gerenciamento de Usuários"
        description="Cadastre e gerencie os usuários do sistema."
        icon={UserCog}
        actions={
          <Dialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if(!open) setEditingUser(undefined); }}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <UserPlus className="mr-2 h-4 w-4" /> Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</DialogTitle>
              </DialogHeader>
              <UserForm 
                onSubmit={handleFormSubmit} 
                defaultValues={editingUser}
                isSubmitting={isSubmitting}
                isEditing={!!editingUser}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border rounded-lg">
            <UserCog className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum usuário cadastrado</h3>
            <p className="text-muted-foreground mb-4">Comece adicionando novos usuários ao sistema.</p>
            <Button onClick={openAddDialog}>
              <UserPlus className="mr-2 h-4 w-4" /> Adicionar Primeiro Usuário
            </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {users.map((user) => (
            <Card key={user.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <UserCircle className="h-8 w-8 text-primary" />
                  <Badge variant={user.isActive ? "default" : "destructive"} className={user.isActive ? "bg-green-500 hover:bg-green-600" : ""}>
                    {user.isActive ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-semibold font-headline">{user.name}</CardTitle>
                <CardDescription className="flex items-center text-sm">
                  <ShieldAlert className="h-4 w-4 mr-2 text-muted-foreground" /> {user.role}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-1">
                <p className="text-sm text-muted-foreground flex items-center">
                  <UserCog className="h-4 w-4 mr-2 shrink-0" /> Usuário: <span className="font-medium text-foreground ml-1">{user.username}</span>
                </p>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Mail className="h-4 w-4 mr-2 shrink-0" /> Email: <span className="font-medium text-foreground ml-1">{user.email}</span>
                </p>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex w-full justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                    <Edit3 className="mr-1 h-4 w-4" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(user)} disabled={currentUser?.id === user.id}>
                    <Trash2 className="mr-1 h-4 w-4" /> Excluir
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <span className="font-semibold">{userToDelete?.name} ({userToDelete?.username})</span>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
