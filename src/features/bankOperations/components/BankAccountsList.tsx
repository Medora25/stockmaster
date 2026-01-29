import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, Landmark, CreditCard, Wallet, Download } from 'lucide-react';
import { format } from 'date-fns';

import { BankAccount } from "@/core/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const bankAccountSchema = z.object({
  name: z.string().min(1, { message: "Account name is required" }),
  bankName: z.string().min(1, { message: "Bank name is required" }),
  rib: z.string().min(1, { message: "RIB is required" }),
  initialBalance: z.coerce.number().default(0),
  currency: z.string().default("MAD"),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

interface BankAccountsListProps {
  accounts: BankAccount[];
  onAddAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt' | 'balance'>) => void;
  onUpdateAccount: (id: string, account: Partial<BankAccount>) => void;
  onDeleteAccount: (id: string) => void;
}

export const BankAccountsList: React.FC<BankAccountsListProps> = ({ 
  accounts, 
  onAddAccount, 
  onUpdateAccount, 
  onDeleteAccount 
}) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      name: "",
      bankName: "",
      rib: "",
      initialBalance: 0,
      currency: "MAD",
      isActive: true,
      notes: "",
    },
  });

  const onSubmit = (values: BankAccountFormValues) => {
    if (editingAccount) {
      onUpdateAccount(editingAccount.id, values);
    } else {
      onAddAccount(values);
    }
    setIsDialogOpen(false);
    setEditingAccount(null);
    form.reset({
      name: "",
      bankName: "",
      rib: "",
      initialBalance: 0,
      currency: "MAD",
      isActive: true,
      notes: "",
    });
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    form.reset({
      name: account.name,
      bankName: account.bankName,
      rib: account.rib,
      initialBalance: account.initialBalance,
      currency: account.currency,
      isActive: account.isActive,
      notes: account.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingAccount(null);
    form.reset({
      name: "",
      bankName: "",
      rib: "",
      initialBalance: 0,
      currency: "MAD",
      isActive: true,
      notes: "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('bankOperations.accountsTitle', 'Bank Accounts')}</h2>
          <p className="text-muted-foreground">
            {t('bankOperations.accountsDescription', 'Manage your bank accounts and balances.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              {t('bankOperations.addAccount', 'Add Account')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingAccount 
                  ? t('bankOperations.editAccount', 'Edit Bank Account') 
                  : t('bankOperations.newAccount', 'New Bank Account')}
              </DialogTitle>
              <DialogDescription>
                {t('bankOperations.accountFormDescription', 'Enter the details of the bank account here.')}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.name')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Compte Courant" {...field} />
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
                        <FormLabel>{t('bankOperations.bankName', 'Bank Name')}</FormLabel>
                        <FormControl>
                          <Input placeholder="CIH, Attijari..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="rib"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bankOperations.rib', 'RIB / Account Number')}</FormLabel>
                      <FormControl>
                        <Input placeholder="24 digits..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="initialBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('bankOperations.initialBalance', 'Initial Balance')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            disabled={!!editingAccount} // Disable initial balance edit for existing accounts to avoid confusion? Or allow it? Let's allow but maybe warn. Actually, better to allow edits if it was a mistake.
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.currency', 'Currency')}</FormLabel>
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.notes')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>{t('common.active')}</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">
                    {t('common.save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Card key={account.id} className={!account.isActive ? "opacity-60" : ""}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">{account.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Landmark className="h-3 w-3" />
                  {account.bankName}
                </CardDescription>
              </div>
              <div className="rounded-full bg-primary/10 p-2">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {account.balance.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{account.currency}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted p-1 rounded inline-block">
                {account.rib}
              </p>
              {account.notes && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  {account.notes}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <Badge variant={account.isActive ? "default" : "secondary"}>
                {account.isActive ? t('common.active') : t('common.inactive')}
              </Badge>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDeleteAccount(account.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
        
        {accounts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-muted-foreground">
            <CreditCard className="h-10 w-10 mb-4 opacity-50" />
            <p>{t('bankOperations.noAccounts', 'No bank accounts found.')}</p>
            <Button variant="link" onClick={handleAddNew}>
              {t('bankOperations.createFirstAccount', 'Create your first account')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
