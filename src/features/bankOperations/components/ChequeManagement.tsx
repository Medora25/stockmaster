import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, differenceInDays, isPast, isToday, addDays } from "date-fns";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MoreHorizontal, 
  Calendar,
  Search,
  AlertTriangle,
  Clock,
  Download,
  Filter
} from 'lucide-react';

import { Cheque, BankAccount } from "@/core/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const chequeFormSchema = z.object({
  reference: z.string().min(1, { message: "Reference is required" }),
  cashingDate: z.string().min(1, { message: "Date is required" }),
  fullName: z.string().min(1, { message: "Name is required" }),
  amount: z.coerce.number().min(0.01, { message: "Amount must be positive" }),
  bankName: z.string().optional(),
  status: z.enum(["pending", "cashed", "bounced", "cancelled"]),
  notes: z.string().optional(),
});

export type ChequeFormValues = z.infer<typeof chequeFormSchema>;

interface ChequeManagementProps {
  cheques: Cheque[];
  bankAccounts: BankAccount[];
  onAddCheque: (values: ChequeFormValues) => void;
  onConfirmCheque: (id: string, targetAccountId?: string) => void;
  onUpdateStatus: (id: string, status: 'bounced' | 'cancelled') => void;
  onDeleteCheque: (id: string) => void; // This will trigger the confirmation dialog in parent
}

export const ChequeManagement: React.FC<ChequeManagementProps> = ({
  cheques,
  bankAccounts,
  onAddCheque,
  onConfirmCheque,
  onUpdateStatus,
  onDeleteCheque
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedChequeId, setSelectedChequeId] = useState<string | null>(null);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("");

  const form = useForm<ChequeFormValues>({
    resolver: zodResolver(chequeFormSchema),
    defaultValues: {
      reference: "",
      cashingDate: "",
      fullName: "",
      amount: 0,
      bankName: "",
      status: "pending",
      notes: "",
    },
  });

  const handleSubmit = (values: ChequeFormValues) => {
    onAddCheque(values);
    setIsDialogOpen(false);
    form.reset();
  };

  const initiateConfirmCheque = (id: string) => {
    setSelectedChequeId(id);
    setSelectedBankAccountId(""); // Reset selection
    setConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = () => {
    if (selectedChequeId) {
      onConfirmCheque(selectedChequeId, selectedBankAccountId || undefined);
      setConfirmDialogOpen(false);
      setSelectedChequeId(null);
    }
  };

  const filteredCheques = cheques.filter(cheque => {
    const matchesSearch = 
      cheque.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cheque.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cheque.bankName && cheque.bankName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || cheque.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cashed': return <Badge variant="default" className="bg-green-600">{t('bankOperations.chequeStatus.cashed')}</Badge>;
      case 'pending': return <Badge variant="secondary">{t('bankOperations.chequeStatus.pending')}</Badge>;
      case 'bounced': return <Badge variant="destructive">{t('bankOperations.chequeStatus.bounced')}</Badge>;
      case 'cancelled': return <Badge variant="outline">{t('bankOperations.chequeStatus.cancelled')}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDueStatus = (cheque: Cheque) => {
    if (cheque.status !== 'pending') return null;
    
    const today = new Date();
    const cashingDate = new Date(cheque.cashingDate);
    
    // Reset hours for accurate day comparison
    today.setHours(0, 0, 0, 0);
    cashingDate.setHours(0, 0, 0, 0);
    
    const diffDays = differenceInDays(cashingDate, today);

    if (diffDays < 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-red-600 font-semibold">{t('bankOperations.overdue', 'Overdue')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (diffDays === 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-orange-500 font-semibold">{t('bankOperations.dueToday', 'Due Today')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (diffDays <= 3) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Clock className="h-4 w-4 text-yellow-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-yellow-500 font-semibold">{t('bankOperations.dueSoon', 'Due in {{days}} days', { days: diffDays })}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <CardTitle>{t('bankOperations.chequeManagement')}</CardTitle>
          <CardDescription>{t('bankOperations.chequeDescription', 'Track and manage your received cheques.')}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder={t('common.search', 'Search...')} 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('bankOperations.addCheque')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                <DialogTitle>{t('bankOperations.addCheque')}</DialogTitle>
                <DialogDescription>
                    {t('bankOperations.addChequeDescription')}
                </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="reference"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('bankOperations.cheque.reference')}</FormLabel>
                            <FormControl>
                            <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="cashingDate"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('bankOperations.cheque.cashingDate')}</FormLabel>
                            <FormControl>
                            <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('bankOperations.cheque.bankName')}</FormLabel>
                            <FormControl>
                            <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                    <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('bankOperations.cheque.fullName')}</FormLabel>
                            <FormControl>
                            <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('bankOperations.cheque.status')}</FormLabel>
                            <FormControl>
                            {/* Simplified status selection - usually starts as pending */}
                            <Input {...field} value="pending" disabled />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('common.amount')}</FormLabel>
                            <FormControl>
                            <Input 
                                type="number" 
                                {...field} 
                                onChange={event => field.onChange(parseFloat(event.target.value))}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                     <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('bankOperations.cheque.notes')}</FormLabel>
                            <FormControl>
                            <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <DialogFooter>
                    <Button type="submit">{t('common.add')}</Button>
                    </DialogFooter>
                </form>
                </Form>
            </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('bankOperations.confirmCheque')}</DialogTitle>
                  <DialogDescription>
                    {t('bankOperations.confirmChequeDescription', 'Select the bank account where this cheque was deposited.')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="account" className="text-right text-sm font-medium">
                      {t('bankOperations.account')}
                    </label>
                    <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={t('bankOperations.selectAccount')} />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.bankName} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>{t('common.cancel')}</Button>
                  <Button onClick={handleConfirmSubmit}>{t('common.confirm')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>{t('bankOperations.cheque.reference')}</TableHead>
                <TableHead>{t('bankOperations.cheque.cashingDate')}</TableHead>
                <TableHead>{t('bankOperations.cheque.fullName')}</TableHead>
                <TableHead>{t('common.amount')}</TableHead>
                <TableHead>{t('bankOperations.cheque.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCheques.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    {t('common.noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCheques.map((cheque) => (
                  <TableRow key={cheque.id}>
                    <TableCell>
                      {getDueStatus(cheque)}
                    </TableCell>
                    <TableCell className="font-medium">{cheque.reference}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(cheque.cashingDate), "dd/MM/yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>{cheque.fullName}</TableCell>
                    <TableCell className="font-bold">{cheque.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {getStatusBadge(cheque.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => initiateConfirmCheque(cheque.id)}
                            disabled={cheque.status === "cashed"}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                            {t('common.confirm')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onUpdateStatus(cheque.id, "bounced")}
                            disabled={cheque.status === "cashed"}
                          >
                            <AlertCircle className="mr-2 h-4 w-4 text-orange-600" />
                            {t('bankOperations.chequeStatus.bounced')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onUpdateStatus(cheque.id, "cancelled")}
                            disabled={cheque.status === "cashed"}
                          >
                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                            {t('bankOperations.chequeStatus.cancelled')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDeleteCheque(cheque.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
