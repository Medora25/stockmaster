import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ArrowRightLeft, CheckSquare, FileText, Landmark, Download } from 'lucide-react';

import { BankTransfer, BankTransferType, BankAccount } from "@/core/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const transferFormSchema = z.object({
  type: z.enum(["ESPECE_TO_BANQUE", "CHEQUE_TO_BANQUE", "BANQUE_TO_ESPECE", "BANQUE_TO_BANQUE"]),
  amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  dateTime: z.string().min(1, { message: "Date is required" }),
  notes: z.string().optional(),
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
}).refine((data) => {
  if (data.type === "ESPECE_TO_BANQUE" && !data.toAccountId) return false;
  if (data.type === "BANQUE_TO_ESPECE" && !data.fromAccountId) return false;
  if (data.type === "BANQUE_TO_BANQUE") {
    if (!data.fromAccountId || !data.toAccountId) return false;
    if (data.fromAccountId === data.toAccountId) return false;
  }
  return true;
}, {
  message: "Please select valid accounts",
  path: ["amount"], // Attach error to amount to be visible, or use a general error area
});

export type TransferFormValues = z.infer<typeof transferFormSchema>;

interface TransferSectionProps {
  transfers: BankTransfer[];
  bankAccounts: BankAccount[];
  onTransferSubmit: (values: TransferFormValues) => void;
}

export const TransferSection: React.FC<TransferSectionProps> = ({ transfers, bankAccounts, onTransferSubmit }) => {
  const { t } = useTranslation();
  
  const [transferTypeFilter, setTransferTypeFilter] = useState<BankTransferType | "ALL">("ALL");
  const [transferFromDate, setTransferFromDate] = useState<string>("");
  const [transferToDate, setTransferToDate] = useState<string>("");

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      type: "ESPECE_TO_BANQUE",
      amount: 0,
      dateTime: new Date().toISOString().slice(0, 16),
      notes: "",
      fromAccountId: "",
      toAccountId: "",
    },
  });

  const transferType = form.watch("type");

  const handleSubmit = (values: TransferFormValues) => {
    onTransferSubmit(values);
    form.reset({
      type: values.type,
      amount: 0,
      dateTime: new Date().toISOString().slice(0, 16),
      notes: "",
      fromAccountId: "",
      toAccountId: "",
    });
  };

  const filteredTransfers = transfers.filter((transfer) => {
    if (transferTypeFilter !== "ALL" && transfer.type !== transferTypeFilter) return false;
    if (transferFromDate) {
      const from = new Date(transferFromDate);
      if (new Date(transfer.dateTime) < from) return false;
    }
    if (transferToDate) {
      const to = new Date(transferToDate);
      if (new Date(transfer.dateTime) > to) return false;
    }
    return true;
  });

  const getTransferTypeLabel = (type: string) => {
      switch(type) {
          case "ESPECE_TO_BANQUE": return t('bankOperations.transferTypes.especeToBanque');
          case "CHEQUE_TO_BANQUE": return t('bankOperations.transferTypes.chequeToBanque');
          case "BANQUE_TO_ESPECE": return t('bankOperations.transferTypes.banqueToEspece');
          case "BANQUE_TO_BANQUE": return t('bankOperations.transferTypes.banqueToBanque', 'Virement compte à compte');
          default: return type;
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5">
        <Card>
          <CardHeader>
            <CardTitle>{t('bankOperations.transferTitle')}</CardTitle>
            <CardDescription>{t('bankOperations.transferDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bankOperations.transferType')}</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ESPECE_TO_BANQUE">
                              <div className="flex items-center gap-2">
                                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                                {t('bankOperations.transferTypes.especeToBanque')}
                              </div>
                            </SelectItem>
                            <SelectItem value="CHEQUE_TO_BANQUE">
                              <div className="flex items-center gap-2">
                                <CheckSquare className="h-4 w-4 text-green-600" />
                                {t('bankOperations.transferTypes.chequeToBanque')}
                              </div>
                            </SelectItem>
                            <SelectItem value="BANQUE_TO_ESPECE">
                              <div className="flex items-center gap-2">
                                <ArrowRightLeft className="h-4 w-4 text-orange-600" />
                                {t('bankOperations.transferTypes.banqueToEspece')}
                              </div>
                            </SelectItem>
                             <SelectItem value="BANQUE_TO_BANQUE">
                              <div className="flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-purple-600" />
                                {t('bankOperations.transferTypes.banqueToBanque', 'Virement compte à compte')}
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(transferType === "BANQUE_TO_ESPECE" || transferType === "BANQUE_TO_BANQUE") && (
                   <FormField
                    control={form.control}
                    name="fromAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('bankOperations.fromAccount', 'From Account')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('bankOperations.selectAccount', 'Select Account')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bankAccounts.filter(a => a.isActive).map(account => (
                               <SelectItem key={account.id} value={account.id}>
                                 {account.name} ({account.bankName}) - {account.balance} {account.currency}
                               </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {(transferType === "ESPECE_TO_BANQUE" || transferType === "CHEQUE_TO_BANQUE" || transferType === "BANQUE_TO_BANQUE") && (
                   <FormField
                    control={form.control}
                    name="toAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('bankOperations.toAccount', 'To Account')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('bankOperations.selectAccount', 'Select Account')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bankAccounts.filter(a => a.isActive).map(account => (
                               <SelectItem key={account.id} value={account.id}>
                                 {account.name} ({account.bankName}) - {account.balance} {account.currency}
                               </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
                <FormField
                  control={form.control}
                  name="dateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bankOperations.transferDate')}</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bankOperations.transferNotes')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" className="w-full md:w-auto">
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    {t('common.save')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-7 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('bankOperations.history')}</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{t('bankOperations.historyFrom')}</Label>
                <Input
                  type="date"
                  value={transferFromDate}
                  onChange={(e) => setTransferFromDate(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('bankOperations.historyTo')}</Label>
                <Input
                  type="date"
                  value={transferToDate}
                  onChange={(e) => setTransferToDate(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('bankOperations.transferDate')}</TableHead>
                    <TableHead>{t('bankOperations.transferType')}</TableHead>
                    <TableHead className="text-right">{t('common.amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                        {t('common.noResults')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="text-xs">
                          {format(new Date(transfer.dateTime), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal text-xs">
                            {getTransferTypeLabel(transfer.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {transfer.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
