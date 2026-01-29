import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { CompanySettings } from '@/core/types';
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

const companySchema = z.object({
  name: z.string().min(2, { message: "Le nom de l'entreprise est requis" }),
  nameAr: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Email invalide" }).optional().or(z.literal('')),
  website: z.string().url({ message: "URL invalide" }).optional().or(z.literal('')),
  ice: z.string().optional(),
  if: z.string().optional(),
  rc: z.string().optional(),
  cnss: z.string().optional(),
  logo: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export const CompanySettingsForm: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { settings, updateSettings } = useAppStore();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: settings.company?.name || '',
      nameAr: settings.company?.nameAr || '',
      address: settings.company?.address || '',
      city: settings.company?.city || '',
      phone: settings.company?.phone || '',
      email: settings.company?.email || '',
      website: settings.company?.website || '',
      ice: settings.company?.ice || '',
      if: settings.company?.if || '',
      rc: settings.company?.rc || '',
      cnss: settings.company?.cnss || '',
      logo: settings.company?.logo || '',
    },
  });

  const onSubmit = (data: CompanyFormValues) => {
    updateSettings({ company: data });
    auditService.log('UPDATE', 'SETTINGS', 'COMPANY', 'Company settings updated');
    toast({ title: t('messages.saveSuccess') });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.company')}</CardTitle>
        <CardDescription>{t('settings.companyDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.companyName')} (FR)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.companyName')} (AR)</FormLabel>
                    <FormControl>
                      <Input {...field} dir="rtl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.address')}</FormLabel>
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
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.phone')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.email')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Web</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.ice')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="if"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.if')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.rc')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNSS</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">
                <Save className="w-4 h-4 me-2" />
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
