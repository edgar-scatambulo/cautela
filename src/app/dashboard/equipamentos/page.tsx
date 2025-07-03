
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as ShadDialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
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
import { EquipmentForm } from './components/equipment-form';
import { useStore } from '@/lib/store';
import { Equipment, EquipmentType, Loan, PoliceOfficer, LoanStatus, UserRole } from '@/lib/types';
import { Smartphone, Printer as PrinterIconLucide, Radio, PlusCircle, Edit3, Trash2, PackageSearch, Eye, User, CalendarDays, Clock, Info, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EquipmentSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { format, parse, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Papa from 'papaparse';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';


const getOfficerNameLocal = (officerId: string, officers: PoliceOfficer[]): string => {
  const officer = officers.find(o => o.id === officerId);
  return officer ? `${officer.name} (${officer.rank})` : 'Desconhecido';
};

type ParsedEquipment = z.infer<typeof EquipmentSchema> & {
    errors?: z.ZodIssue[];
    originalRow: any;
};


export default function EquipamentosPage() {
  const { equipments, addEquipment, updateEquipment, deleteEquipment, loans, officers, currentUser, addMultipleEquipments, deleteMultipleEquipments } = useStore();
  const { toast } = useToast();
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingEquipment, setEditingEquipment] = React.useState<Equipment | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = React.useState<Equipment | null>(null);
  
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [selectedEquipmentForDetails, setSelectedEquipmentForDetails] = React.useState<Equipment | null>(null);
  const [equipmentLoanHistory, setEquipmentLoanHistory] = React.useState<Loan[]>([]);
  const [printEquipmentHistoryTitle, setPrintEquipmentHistoryTitle] = React.useState('');

  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [parsedData, setParsedData] = React.useState<ParsedEquipment[]>([]);
  
  const [selectedEquipmentIds, setSelectedEquipmentIds] = React.useState<string[]>([]);
  const [isMultiDeleteDialogOpen, setIsMultiDeleteDialogOpen] = React.useState(false);
  const [sortedEquipments, setSortedEquipments] = React.useState<Equipment[]>([]);

  React.useEffect(() => {
    const sorted = [...equipments].sort((a, b) => {
      const typeComparison = a.type.localeCompare(b.type);
      if (typeComparison !== 0) {
        return typeComparison;
      }
      return a.serialNumber.localeCompare(b.serialNumber);
    });
    setSortedEquipments(sorted);
  }, [equipments]);

  const handleFormSubmit = async (values: z.infer<typeof EquipmentSchema>) => {
    setIsSubmitting(true);
    try {
      if (editingEquipment) {
        const updatedValues = { ...editingEquipment, ...values };
        await updateEquipment({ ...updatedValues, serialNumber: values.serialNumber.toUpperCase() });
        toast({ title: "Equipamento Atualizado", description: `O equipamento ${values.brand} foi atualizado.` });
      } else {
        const newEquipmentData = {
          ...values,
          serialNumber: values.serialNumber.toUpperCase(),
          status: values.status || 'Disponível',
        } as Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>;
        await addEquipment(newEquipmentData);
        toast({ title: "Equipamento Adicionado", description: `O equipamento ${values.brand} foi adicionado.` });
      }
      setIsFormDialogOpen(false);
      setEditingEquipment(undefined);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Ocorreu um erro ao salvar o equipamento.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setIsFormDialogOpen(true);
  };
  
  const openAddDialog = () => {
    setEditingEquipment(undefined);
    setIsFormDialogOpen(true);
  };

  const openDeleteDialog = (equipment: Equipment) => {
    setEquipmentToDelete(equipment);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (equipmentToDelete) {
      setIsSubmitting(true);
      try {
        await deleteEquipment(equipmentToDelete.id);
        toast({ title: "Equipamento Excluído", description: `O equipamento ${equipmentToDelete.brand} foi excluído.` });
      } catch (error: any) {
         toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
        setIsDeleteDialogOpen(false);
        setEquipmentToDelete(null);
      }
    }
  };
  
  const handleConfirmMultiDelete = async () => {
    if (selectedEquipmentIds.length === 0) return;
    setIsSubmitting(true);
    try {
        await deleteMultipleEquipments(selectedEquipmentIds);
        toast({ title: "Equipamentos Excluídos", description: `${selectedEquipmentIds.length} equipamentos foram excluídos com sucesso.` });
        setSelectedEquipmentIds([]);
    } catch (error: any) {
        toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        setIsMultiDeleteDialogOpen(false);
    }
  };


  const openDetailsDialog = (equipment: Equipment) => {
    setSelectedEquipmentForDetails(equipment);
    const history = loans.filter(loan => loan.equipmentIds.includes(equipment.id))
                         .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by most recent
    setEquipmentLoanHistory(history);
    setIsDetailsDialogOpen(true);
  };
  
  const handlePrintEquipmentHistory = () => {
    if (!selectedEquipmentForDetails) return;
    
    setPrintEquipmentHistoryTitle(`Detalhes do Equipamento: ${selectedEquipmentForDetails.brand} (Patrimônio: ${selectedEquipmentForDetails.serialNumber})`);
    
    setTimeout(() => {
      document.body.classList.add('print-equipment-details-active');
      window.print();
      if (typeof window.onafterprint === 'function') {
        window.onafterprint = () => {
          document.body.classList.remove('print-equipment-details-active');
          setPrintEquipmentHistoryTitle(''); 
          window.onafterprint = null; 
        };
      } else {
        setTimeout(() => {
          document.body.classList.remove('print-equipment-details-active');
          setPrintEquipmentHistoryTitle('');
        }, 1000);
      }
    }, 100); 
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setParsedData([]);
      return;
    }

    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validatedData = results.data.map(row => {
          // Normalize serialNumber to uppercase before validation
          const normalizedRow = { ...row, serialNumber: row.serialNumber?.toUpperCase() };

          const result = EquipmentSchema.omit({id: true}).safeParse({
            ...normalizedRow,
            status: normalizedRow.status || 'Disponível',
            observations: normalizedRow.observations || undefined,
            model: normalizedRow.model || undefined,
          });

          if (result.success) {
            return { ...result.data, originalRow: row, errors: undefined };
          } else {
            return {
              ...result.error,
              errors: result.error.issues,
              originalRow: row,
              brand: row.brand || 'Inválido',
              serialNumber: row.serialNumber || 'Inválido',
              type: row.type || 'Inválido',
            };
          }
        });
        setParsedData(validatedData as ParsedEquipment[]);
      },
      error: (error) => {
        toast({ title: "Erro ao ler CSV", description: error.message, variant: "destructive" });
        setParsedData([]);
      }
    });
  };
  
  const handleImportConfirm = async () => {
    const validEquipments = parsedData
      .filter(p => !p.errors)
      .map(p => {
        const { errors, originalRow, ...equipmentData } = p;
        return equipmentData as Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>;
      });

    if (validEquipments.length === 0) {
      toast({ title: "Nenhum equipamento válido para importar", variant: "destructive" });
      return;
    }
    
    setIsImporting(true);
    try {
        await addMultipleEquipments(validEquipments);
        toast({ title: "Importação Concluída", description: `${validEquipments.length} equipamentos foram importados com sucesso.` });
        setIsImportDialogOpen(false);
        setParsedData([]);
    } catch (error: any) {
        toast({ title: "Erro na Importação", description: error.message, variant: "destructive" });
    } finally {
        setIsImporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const canManageEquipments = currentUser?.role === UserRole.ADMIN;
  
  const handleSelectEquipment = (equipmentId: string, checked: boolean) => {
    setSelectedEquipmentIds(prev =>
        checked ? [...prev, equipmentId] : prev.filter(id => id !== equipmentId)
    );
  };
  
  const equipmentsThatCanBeDeleted = equipments.filter(e => e.status !== 'Em Cautela');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedEquipmentIds(equipmentsThatCanBeDeleted.map(e => e.id));
    } else {
        setSelectedEquipmentIds([]);
    }
  };
  
  const allDeletableSelected = equipmentsThatCanBeDeleted.length > 0 && selectedEquipmentIds.length > 0 && equipmentsThatCanBeDeleted.every(e => selectedEquipmentIds.includes(e.id));
  
  const pageActions = (
    <div className="flex gap-2">
      <Button onClick={handlePrint} variant="outline">
        <PrinterIconLucide className="mr-2 h-4 w-4" /> Imprimir Lista
      </Button>
      {canManageEquipments && (
        <>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Importar CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl">
                  <DialogHeader>
                      <DialogTitle>Importar Equipamentos em Lote</DialogTitle>
                      <ShadDialogDescription>
                          Faça o upload de um arquivo CSV. O cabeçalho deve incluir as colunas obrigatórias: <b>type</b>, <b>brand</b>, <b>serialNumber</b>.
                          Colunas opcionais: <b>model</b>, <b>status</b> (padrão 'Disponível'), <b>observations</b>.
                          Os valores para <b>type</b> devem ser exatamente 'Celular', 'Impressora' ou 'Rádio'.
                      </ShadDialogDescription>
                  </DialogHeader>
                  <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
                      <Label htmlFor="csv-file-equip">Arquivo CSV</Label>
                      <Input id="csv-file-equip" type="file" accept=".csv" onChange={handleFileChange} />
                  </div>
                  {parsedData.length > 0 && (
                      <ScrollArea className="h-72 w-full rounded-md border">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Marca/Modelo</TableHead>
                                      <TableHead>Patrimônio</TableHead>
                                      <TableHead>Tipo</TableHead>
                                      <TableHead>Status</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {parsedData.map((equip, index) => (
                                      <TableRow key={index}>
                                          <TableCell>{equip.originalRow.brand || '---'}</TableCell>
                                          <TableCell>{equip.originalRow.serialNumber || '---'}</TableCell>
                                          <TableCell>{equip.originalRow.type || '---'}</TableCell>
                                          <TableCell>
                                              {equip.errors ? (
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger>
                                                      <Badge variant="destructive">Inválido</Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                      <ul className="list-disc list-inside text-sm">
                                                        {equip.errors.map(e => <li key={e.path.join('.')}>{e.message}</li>)}
                                                      </ul>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              ) : (
                                                  <Badge className="bg-green-500 hover:bg-green-600">Válido</Badge>
                                              )}
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </ScrollArea>
                  )}
                  <DialogFooter>
                      <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={handleImportConfirm} disabled={isImporting || parsedData.filter(p => !p.errors).length === 0}>
                          {isImporting ? "Importando..." : `Importar ${parsedData.filter(p => !p.errors).length} Válidos`}
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
          <Dialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if(!open) setEditingEquipment(undefined); }}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Equipamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingEquipment ? 'Editar Equipamento' : 'Adicionar Novo Equipamento'}</DialogTitle>
              </DialogHeader>
              <EquipmentForm 
                onSubmit={handleFormSubmit} 
                defaultValues={editingEquipment}
                isSubmitting={isSubmitting}
                isEditing={!!editingEquipment}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <h1 className="text-3xl font-bold text-center mb-6 hidden print:block">
          Lista de Equipamentos
      </h1>
      <PageHeader
        title="Gerenciamento de Equipamentos"
        description="Cadastre, visualize e edite os equipamentos."
        icon={PackageSearch}
        actions={pageActions}
        className="print:hidden"
      />
      
      {sortedEquipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-border rounded-lg print:hidden">
            <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum equipamento cadastrado</h3>
            <p className="text-muted-foreground mb-4">Comece adicionando novos equipamentos ao sistema.</p>
            {canManageEquipments && (
              <Button onClick={openAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Primeiro Equipamento
              </Button>
            )}
        </div>
      ) : (
        <>
          {canManageEquipments && selectedEquipmentIds.length > 0 && (
             <div className="mb-4 flex items-center justify-between gap-4 p-4 border rounded-lg bg-card shadow-sm print:hidden">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-foreground">{selectedEquipmentIds.length} selecionado(s)</span>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setIsMultiDeleteDialogOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir Selecionados
                </Button>
            </div>
          )}
          <Card className="print:shadow-none print:border-none">
            <Table>
              <TableHeader>
                <TableRow>
                  {canManageEquipments && (
                    <TableHead className="w-[50px] print:hidden">
                      <Checkbox
                          id="select-all-equipments"
                          checked={allDeletableSelected}
                          onCheckedChange={handleSelectAll}
                          disabled={equipmentsThatCanBeDeleted.length === 0}
                          aria-label="Selecionar todos os equipamentos deletáveis"
                      />
                    </TableHead>
                  )}
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marca / Modelo</TableHead>
                  <TableHead>Patrimônio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right print:hidden">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEquipments.map((equipment) => (
                  <TableRow 
                    key={equipment.id}
                    data-state={selectedEquipmentIds.includes(equipment.id) ? 'selected' : 'unselected'}
                  >
                    {canManageEquipments && (
                       <TableCell className="print:hidden">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span tabIndex={equipment.status === 'Em Cautela' ? 0 : undefined}>
                                  <Checkbox
                                      id={`select-${equipment.id}`}
                                      checked={selectedEquipmentIds.includes(equipment.id)}
                                      onCheckedChange={(checked) => handleSelectEquipment(equipment.id, !!checked)}
                                      disabled={equipment.status === 'Em Cautela'}
                                      aria-label={`Selecionar ${equipment.brand}`}
                                  />
                                </span>
                              </TooltipTrigger>
                              {equipment.status === 'Em Cautela' && (
                                  <TooltipContent>
                                      <p>Não pode ser excluído pois está em uma cautela ativa.</p>
                                  </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                       </TableCell>
                    )}
                    <TableCell className="font-medium">{equipment.type}</TableCell>
                    <TableCell>{equipment.brand}{equipment.model ? ` ${equipment.model}` : ''}</TableCell>
                    <TableCell>{equipment.serialNumber}</TableCell>
                    <TableCell>
                      <Badge className={`px-2 py-0.5 text-xs rounded-full badge-print ${
                        equipment.status === 'Disponível' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
                        equipment.status === 'Em Cautela' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                        equipment.status === 'Manutenção' ? 'bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100' :
                        'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
                      }`}>
                        {equipment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-xs">{equipment.observations}</TableCell>
                    <TableCell className="text-right print:hidden">
                       <div className="flex justify-end space-x-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => openDetailsDialog(equipment)} className="text-primary hover:bg-primary/10">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Ver Detalhes</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver Detalhes</p>
                            </TooltipContent>
                          </Tooltip>
                          {canManageEquipments && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" onClick={() => openEditDialog(equipment)}>
                                    <Edit3 className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(equipment)} disabled={equipment.status === 'Em Cautela'}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Excluir</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {equipment.status === 'Em Cautela' ? <p>Não pode ser excluído (em cautela)</p> : <p>Excluir</p>}
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o equipamento <span className="font-semibold">{equipmentToDelete?.brand}{equipmentToDelete?.model ? ` ${equipmentToDelete.model}`: ''} (Patrimônio: {equipmentToDelete?.serialNumber})</span>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEquipmentToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                {isSubmitting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMultiDeleteDialogOpen} onOpenChange={setIsMultiDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão Múltipla</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir os {selectedEquipmentIds.length} equipamentos selecionados? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ScrollArea className="max-h-60 rounded-md border">
              <div className="p-4">
                  <h4 className="mb-2 font-medium text-sm text-foreground">Itens a serem excluídos:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {equipments
                          .filter(e => selectedEquipmentIds.includes(e.id))
                          .map(e => <li key={e.id}>{e.brand} ({e.serialNumber})</li>)
                      }
                  </ul>
              </div>
          </ScrollArea>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsMultiDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMultiDelete} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
              {isSubmitting ? "Excluindo..." : "Confirmar Exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-3xl print:max-w-none print:w-full print:h-auto print:overflow-visible" id="equipment-details-dialog-content">
          <DialogHeader className="dialog-header-non-print">
            <DialogTitle className="flex items-center">
              <PackageSearch className="h-6 w-6 mr-2 text-primary" />
              Detalhes do Equipamento
            </DialogTitle>
            {selectedEquipmentForDetails && (
                 <ShadDialogDescription>
                    Informações detalhadas sobre {selectedEquipmentForDetails.brand}{selectedEquipmentForDetails.model ? ` ${selectedEquipmentForDetails.model}` : ''} (Patrimônio: {selectedEquipmentForDetails.serialNumber}).
                </ShadDialogDescription>
            )}
          </DialogHeader>

          <h1 className="hidden print:block print-only-equipment-title">{printEquipmentHistoryTitle}</h1>
          
          {selectedEquipmentForDetails && (
            <>
              <div className="equipment-general-info-non-print space-y-4 py-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 font-headline">Informações Gerais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div><strong className="text-muted-foreground">Tipo:</strong> {selectedEquipmentForDetails.type}</div>
                    <div><strong className="text-muted-foreground">Marca / Modelo:</strong> {selectedEquipmentForDetails.brand}{selectedEquipmentForDetails.model ? ` ${selectedEquipmentForDetails.model}` : ''}</div>
                    <div><strong className="text-muted-foreground">Patrimônio:</strong> {selectedEquipmentForDetails.serialNumber}</div>
                    <div>
                      <strong className="text-muted-foreground">Status Atual:</strong>{' '}
                      <Badge className={`${
                        selectedEquipmentForDetails.status === 'Disponível' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
                        selectedEquipmentForDetails.status === 'Em Cautela' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                        selectedEquipmentForDetails.status === 'Manutenção' ? 'bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100' :
                        'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
                      }`}>{selectedEquipmentForDetails.status}</Badge>
                    </div>
                    {selectedEquipmentForDetails.observations && <div className="md:col-span-2 mt-1"><strong className="text-muted-foreground">Observações:</strong> {selectedEquipmentForDetails.observations}</div>}
                    <div className="text-xs text-muted-foreground md:col-span-2 mt-2">Cadastrado em: {format(parseISO(selectedEquipmentForDetails.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
                  </div>
                </div>
              </div>
              
              <div className="equipment-loan-history-section-print space-y-4 py-4 print:py-2">
                <ScrollArea className="max-h-[calc(70vh-220px)] print:max-h-none print:h-auto print:overflow-visible">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 font-headline print:mb-3">Histórico de Cautelas</h3>
                    {equipmentLoanHistory.length > 0 ? (
                      <Table>
                        <TableCaption className="print:hidden">Histórico de todas as cautelas envolvendo este equipamento.</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Policial</TableHead>
                            <TableHead>Data Cautela</TableHead>
                            <TableHead>Data Devolução</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {equipmentLoanHistory.map(loan => (
                            <TableRow key={loan.id}>
                              <TableCell className="font-medium">{getOfficerNameLocal(loan.officerId, officers)}</TableCell>
                              <TableCell>{format(parse(loan.loanDate, "yyyy-MM-dd", new Date()), "dd/MM/yy", { locale: ptBR })}</TableCell>
                              <TableCell>
                                {loan.actualReturnDate 
                                  ? format(parse(loan.actualReturnDate, "yyyy-MM-dd", new Date()), "dd/MM/yy", { locale: ptBR })
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                  <Badge className={`print:border ${
                                    loan.status === LoanStatus.ENTREGUE ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100 print-badge-entregue' :
                                    'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100 print-badge-devolvido'
                                  }`}>{loan.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-8 border-2 border-dashed border-border rounded-lg print:hidden">
                          <Info className="h-10 w-10 text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">Nenhum histórico de cautela para este equipamento.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
           <DialogFooter className="pt-4 dialog-footer-non-print">
                <Button onClick={handlePrintEquipmentHistory} variant="outline">
                  <PrinterIconLucide className="mr-2 h-4 w-4" /> Imprimir Histórico
                </Button>
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
