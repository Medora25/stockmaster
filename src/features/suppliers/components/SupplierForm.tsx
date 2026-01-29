import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Supplier } from '@/core/types';

const supplierSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  email: z.string().email({ message: "Email invalide" }).optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  ice: z.string().optional(),
  if: z.string().optional(),
  rc: z.string().optional(),
  cnss: z.string().optional(),
  balance: z.coerce.number().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Supplier | null;
  onSubmit: (data: SupplierFormValues) => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}) => {
  const { t } = useTranslation();
  
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      ice: '',
      if: '',
      rc: '',
      cnss: '',
      balance: 0,
      notes: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: initialData.address || '',
          city: initialData.city || '',
          ice: initialData.ice || '',
          if: initialData.if || '',
          rc: initialData.rc || '',
          cnss: initialData.cnss || '',
          balance: initialData.balance || 0,
          notes: initialData.notes || '',
          isActive: initialData.isActive,
        });
      } else {
        form.reset({
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          ice: '',
          if: '',
          rc: '',
          cnss: '',
          balance: 0,
          notes: '',
          isActive: true,
        });
      }
    }
  }, [open, initialData, form]);

  const handleSubmit = (data: SupplierFormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('common.edit') : t('common.add')} {t('suppliers.single', 'Fournisseur')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* General Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Informations Générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('suppliers.name')} *</Label>
                <Input id="name" {...form.register('name')} placeholder="Nom de l'entreprise" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('clients.email')}</Label>
                <Input id="email" type="email" {...form.register('email')} placeholder="contact@exemple.com" />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('clients.phone')}</Label>
                <Input id="phone" {...form.register('phone')} placeholder="+212 6..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">{t('clients.city')}</Label>
                <Input id="city" {...form.register('city')} placeholder="Casablanca, Rabat..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="balance">{t('suppliers.balance')}</Label>
                <Input 
                  id="balance" 
                  type="number" 
                  step="0.01" 
                  {...form.register('balance')} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('clients.address')}</Label>
              <Textarea id="address" {...form.register('address')} placeholder="Adresse complète" />
            </div>
          </div>

          {/* Legal Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Informations Légales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ice">{t('clients.ice', 'ICE')}</Label>
                <Input id="ice" {...form.register('ice')} placeholder="Identifiant Commun de l'Entreprise" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc">RC</Label>
                <Input id="rc" {...form.register('rc')} placeholder="Registre de Commerce" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="if">IF</Label>
                <Input id="if" {...form.register('if')} placeholder="Identifiant Fiscal" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnss">CNSS</Label>
                <Input id="cnss" {...form.register('cnss')} placeholder="Numéro d'affiliation" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('common.notes')}</Label>
            <Textarea id="notes" {...form.register('notes')} placeholder="Notes supplémentaires..." />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">{t('common.active')}</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
