import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Save } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { auditService } from '@/services/audit/auditService';

const numberingSchema = z.object({
  invoicePrefix: z.string().min(1, "Requis"),
  invoiceCounter: z.coerce.number().min(1),
  deliveryPrefix: z.string().min(1, "Requis"),
  deliveryCounter: z.coerce.number().min(1),
  purchasePrefix: z.string().min(1, "Requis"),
  purchaseCounter: z.coerce.number().min(1),
  salePrefix: z.string().min(1, "Requis"),
  saleCounter: z.coerce.number().min(1),
  quotationPrefix: z.string().optional(),
  quotationCounter: z.coerce.number().min(1).optional(),
});

type NumberingFormValues = z.infer<typeof numberingSchema>;

export const NumberingSettingsForm: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { settings, updateSettings } = useAppStore();

  const form = useForm<NumberingFormValues>({
    resolver: zodResolver(numberingSchema),
    defaultValues: {
      invoicePrefix: settings.numbering?.invoicePrefix || 'FAC',
      invoiceCounter: settings.numbering?.invoiceCounter || 1,
      deliveryPrefix: settings.numbering?.deliveryPrefix || 'BL',
      deliveryCounter: settings.numbering?.deliveryCounter || 1,
      purchasePrefix: settings.numbering?.purchasePrefix || 'BA',
      purchaseCounter: settings.numbering?.purchaseCounter || 1,
      salePrefix: settings.numbering?.salePrefix || 'VT',
      saleCounter: settings.numbering?.saleCounter || 1,
      quotationPrefix: settings.numbering?.quotationPrefix || 'DV',
      quotationCounter: settings.numbering?.quotationCounter || 1,
    },
  });

  const onSubmit = (data: NumberingFormValues) => {
    updateSettings({ numbering: data });
    auditService.log('UPDATE', 'SETTINGS', 'NUMBERING', 'Numbering settings updated');
    toast({ title: t('messages.saveSuccess') });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.numbering')}</CardTitle>
        <CardDescription>{t('settings.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoicePrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.numberingLabels.invoicePrefix')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invoiceCounter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.numberingLabels.invoiceCounter')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryPrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.numberingLabels.deliveryPrefix')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryCounter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.numberingLabels.deliveryCounter')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchasePrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.numberingLabels.purchasePrefix')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchaseCounter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.numberingLabels.purchaseCounter')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salePrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.numberingLabels.salePrefix')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="saleCounter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.numberingLabels.saleCounter')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quotationPrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.numberingLabels.quotationPrefix')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quotationCounter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.numberingLabels.quotationCounter')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
