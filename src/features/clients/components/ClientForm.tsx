import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Client } from '@/core/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const clientSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  nameAr: z.string().optional(),
  email: z.string().email({ message: "Email invalide" }).optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  addressAr: z.string().optional(),
  city: z.string().optional(),
  ice: z.string().optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Client | null;
  onSubmit: (data: ClientFormValues) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      nameAr: '',
      email: '',
      phone: '',
      address: '',
      addressAr: '',
      city: '',
      ice: '',
      creditLimit: 0,
      notes: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          nameAr: initialData.nameAr || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: initialData.address || '',
          addressAr: initialData.addressAr || '',
          city: initialData.city || '',
          ice: initialData.ice || '',
          creditLimit: initialData.creditLimit || 0,
          notes: initialData.notes || '',
          isActive: initialData.isActive,
        });
      } else {
        form.reset({
          name: '',
          nameAr: '',
          email: '',
          phone: '',
          address: '',
          addressAr: '',
          city: '',
          ice: '',
          creditLimit: 0,
          notes: '',
          isActive: true,
        });
      }
    }
  }, [open, initialData, form]);

  const handleSubmit = (values: ClientFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('clients.editClient') : t('clients.addClient')}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Modifiez les informations du client ci-dessous." 
              : "Remplissez le formulaire pour ajouter un nouveau client."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clients.name')} *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du client / Entreprise" {...field} />
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
                    <FormLabel>{t('clients.name')} (Ar)</FormLabel>
                    <FormControl>
                      <Input placeholder="الاسم بالعربية" className="text-right" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clients.phone')}</FormLabel>
                    <FormControl>
                      <Input placeholder="06..." {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="client@exemple.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clients.city')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Casablanca..." {...field} />
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
                    <FormLabel>ICE</FormLabel>
                    <FormControl>
                      <Input placeholder="Identifiant Commun de l'Entreprise" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('clients.address')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Adresse complète" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clients.creditLimit')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="100" {...field} />
                    </FormControl>
                    <FormDescription>
                      Montant maximum de crédit autorisé (0 = illimité)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
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
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.notes')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notes internes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
