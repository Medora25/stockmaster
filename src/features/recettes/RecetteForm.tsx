import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { storageService } from '@/services/storage/storageService';
import { auditService } from '@/services/audit/auditService';
import { CashEntry, CashEntryType, CashEntryCategory, PaymentMethod } from '@/core/types/index';

const recetteSchema = z.object({
  branch: z.string().min(1, "Branche requise"),
  type: z.enum(['ENTREE', 'SORTIE']),
  dateTime: z.string().min(1, "Date requise"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  category: z.enum(['VENTE', 'PAIEMENT_CLIENT', 'DEPENSE', 'ACHAT', 'AUTRE', 'CHEQUE_DEPOSIT', 'CHEQUE_WITHDRAWAL']),
  method: z.enum(['cash', 'cheque', 'virement', 'carte']),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type RecetteFormValues = z.infer<typeof recetteSchema>;

const RecetteForm: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isExpensePreset = params.get('preset') === 'expense';
  const settings = storageService.loadCollection('settings');
  const branches = settings.branches || [];
  const defaultBranch = settings.defaultBranch || branches[0] || '';

  const form = useForm<RecetteFormValues>({
    resolver: zodResolver(recetteSchema),
    defaultValues: {
      branch: defaultBranch,
      type: isExpensePreset ? 'SORTIE' : 'ENTREE',
      dateTime: new Date().toISOString().slice(0, 16),
      amount: 0,
      category: isExpensePreset ? 'DEPENSE' : 'AUTRE',
      method: 'cash',
      description: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (isEdit && id) {
      const entry = storageService.loadCollection('recettes').find(r => r.id === id);
      if (entry) {
        form.reset({
          branch: entry.branch || defaultBranch,
          type: entry.type,
          dateTime: new Date(entry.dateTime).toISOString().slice(0, 16),
          amount: entry.amount,
          category: entry.category,
          method: entry.method,
          description: entry.description || '',
          notes: entry.notes || '',
        });
      }
    }
  }, [id, isEdit, form, defaultBranch]);

  const onSubmit = (values: RecetteFormValues) => {
    const recettes = storageService.loadCollection('recettes');
    
    const entryData: CashEntry = {
      id: isEdit ? id! : crypto.randomUUID(),
      createdAt: isEdit ? recettes.find(r => r.id === id)!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...values,
      dateTime: new Date(values.dateTime).toISOString(),
    };

    if (isEdit) {
      const index = recettes.findIndex(r => r.id === id);
      recettes[index] = entryData;
    } else {
      recettes.push(entryData);
    }

    storageService.saveCollection('recettes', recettes);

    // Audit Log
    auditService.log(
      isEdit ? 'UPDATE' : 'CREATE',
      'CASH_ENTRY',
      entryData.id,
      `${entryData.type} of ${entryData.amount} MAD in category ${entryData.category}`
    );

    navigate('/cashbook');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to="/cashbook">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('common.back')}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{isEdit ? t('cashbook.editEntry') : t('cashbook.addEntry')}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('cashbook.entryDetails')}</CardTitle>
              <CardDescription>{t('cashbook.entryDetailsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.branch')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.selectBranch')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cashbook.type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('cashbook.selectType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ENTREE">{t('cashbook.entree')}</SelectItem>
                        <SelectItem value="SORTIE">{t('cashbook.sortie')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cashbook.entryDate')}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
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
                    <FormLabel>{t('cashbook.entryAmount')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cashbook.category')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('cashbook.selectCategory')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VENTE">{t('cashbook.vente')}</SelectItem>
                        <SelectItem value="PAIEMENT_CLIENT">{t('cashbook.paiement_client')}</SelectItem>
                        <SelectItem value="PAIEMENT_FOURNISSEUR">{t('cashbook.paiement_fournisseur')}</SelectItem>
                        <SelectItem value="DEPENSE">{t('cashbook.depense')}</SelectItem>
                        <SelectItem value="ACHAT">{t('cashbook.achat')}</SelectItem>
                        <SelectItem value="AUTRE">{t('cashbook.autre')}</SelectItem>
                        <SelectItem value="CHEQUE_DEPOSIT">{t('cashbook.cheque_deposit')}</SelectItem>
                        <SelectItem value="CHEQUE_WITHDRAWAL">{t('cashbook.cheque_withdrawal')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sales.paymentMethod')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('sales.selectPaymentMethod')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">{t('sales.cash')}</SelectItem>
                        <SelectItem value="cheque">{t('sales.cheque')}</SelectItem>
                        <SelectItem value="virement">{t('sales.transfer')}</SelectItem>
                        <SelectItem value="carte">{t('sales.card') || 'Carte'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cashbook.description')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t('common.notes')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" asChild>
              <Link to="/cashbook">{t('common.cancel')}</Link>
            </Button>
            <Button type="submit">
              <Save className="me-2 h-4 w-4" />
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default RecetteForm;
