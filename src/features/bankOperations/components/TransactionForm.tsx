import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowDownCircle, ArrowUpCircle, Plus } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { BankAccount } from "@/core/types";

const transactionFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  name: z.string().min(1, { message: "Name is required" }),
  method: z.enum(["especes", "cheque", "banque"]),
  bankAccountId: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.method === "banque" && !data.bankAccountId) {
    return false;
  }
  return true;
}, {
  message: "Bank account is required for bank transactions",
  path: ["bankAccountId"],
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  type: 'deposit' | 'withdrawal';
  bankAccounts: BankAccount[];
  onSubmit: (values: TransactionFormValues) => void;
}

function DollarSign({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ type, bankAccounts, onSubmit }) => {
  const { t } = useTranslation();
  const isDeposit = type === 'deposit';

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      amount: 0,
      name: "",
      method: "especes",
      bankAccountId: "",
      notes: "",
    },
  });

  const method = form.watch("method");

  const handleSubmit = (values: TransactionFormValues) => {
    onSubmit(values);
    form.reset({
      amount: 0,
      name: "",
      method: "especes",
      bankAccountId: "",
      notes: "",
    });
  };

  return (
    <Card className={isDeposit ? "border-t-4 border-t-green-500" : "border-t-4 border-t-red-500"}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isDeposit ? "text-green-700" : "text-red-700"}`}>
          {isDeposit ? <ArrowDownCircle className="h-6 w-6" /> : <ArrowUpCircle className="h-6 w-6" />}
          {isDeposit ? t('bankOperations.verser') : t('bankOperations.retirer')}
        </CardTitle>
        <CardDescription>
          {isDeposit 
            ? t('bankOperations.verserDescription', 'Add money to the cash register (Income).')
            : t('bankOperations.retirerDescription', 'Withdraw money from the cash register (Expense).')
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.amount')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          className="pl-8 text-lg font-semibold" 
                          placeholder="0.00" 
                          {...field} 
                          onChange={event => field.onChange(parseFloat(event.target.value))} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('bankOperations.namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bankOperations.paymentMethod')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('bankOperations.selectPaymentMethod')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="especes">{t('bankOperations.paymentMethods.especes')}</SelectItem>
                        <SelectItem value="cheque">{t('bankOperations.paymentMethods.cheque')}</SelectItem>
                        <SelectItem value="banque">{t('bankOperations.paymentMethods.banque')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {method === "banque" && (
                <FormField
                  control={form.control}
                  name="bankAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bankOperations.selectAccount', 'Select Bank Account')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('bankOperations.selectAccount', 'Select Account')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bankAccounts.filter(a => a.isActive).map(account => (
                             <SelectItem key={account.id} value={account.id}>
                               {account.name} ({account.bankName})
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
            </div>
            <div className="flex justify-end">
                <Button 
                    type="submit" 
                    variant={isDeposit ? "default" : "destructive"}
                    className={isDeposit ? "w-full md:w-auto bg-green-600 hover:bg-green-700 text-white" : "w-full md:w-auto"}
                >
                    {isDeposit ? <Plus className="mr-2 h-4 w-4" /> : <ArrowUpCircle className="mr-2 h-4 w-4" />}
                    {isDeposit ? t('bankOperations.verser') : t('bankOperations.retirer')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
