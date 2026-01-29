import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product, Category } from '@/core/types';

const productSchema = z.object({
  sku: z.string().min(1, { message: "SKU is required" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  nameAr: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  purchasePrice: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  tvaRate: z.coerce.number(),
  stockQuantity: z.coerce.number().min(0),
  stockMin: z.coerce.number().min(0),
  unit: z.string().default('pièce'),
  isActive: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Product | null;
  onSubmit: (data: ProductFormValues) => void;
  categories: Category[];
}

export const ProductForm: React.FC<ProductFormProps> = ({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  categories,
}) => {
  const { t } = useTranslation();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      nameAr: '',
      barcode: '',
      description: '',
      categoryId: undefined,
      purchasePrice: 0,
      salePrice: 0,
      tvaRate: 20,
      stockQuantity: 0,
      stockMin: 0,
      unit: 'pièce',
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          sku: initialData.sku,
          name: initialData.name,
          nameAr: initialData.nameAr || '',
          barcode: initialData.barcode || '',
          description: initialData.description || '',
          categoryId: initialData.categoryId || undefined,
          purchasePrice: initialData.purchasePrice,
          salePrice: initialData.salePrice,
          tvaRate: initialData.tvaRate,
          stockQuantity: initialData.stockQuantity,
          stockMin: initialData.stockMin,
          unit: initialData.unit,
          isActive: initialData.isActive,
        });
      } else {
        form.reset({
          sku: '',
          name: '',
          nameAr: '',
          barcode: '',
          description: '',
          categoryId: undefined,
          purchasePrice: 0,
          salePrice: 0,
          tvaRate: 20,
          stockQuantity: 0,
          stockMin: 0,
          unit: 'pièce',
          isActive: true,
        });
      }
    }
  }, [open, initialData, form]);

  const handleSubmit = (values: ProductFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('products.editProduct') : t('products.addProduct')}
          </DialogTitle>
          <DialogDescription>
            {t('products.formDescription', 'Remplissez les détails du produit ci-dessous.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.sku')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="REF-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.barcode')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123456789" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.name')}</FormLabel>
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
                    <FormLabel>{t('products.nameAr')}</FormLabel>
                    <FormControl>
                      <Input {...field} className="text-right" dir="rtl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('products.category')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "undefined"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="undefined">{t('common.none')}</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.purchasePrice')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.salePrice')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tvaRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.tvaRate')}</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="7">7%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="14">14%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.stockQuantity')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={!!initialData} />
                    </FormControl>
                    {initialData && <p className="text-xs text-muted-foreground">{t('products.useAdjustment')}</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stockMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.stockMin')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('products.unit')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pièce">{t('products.units.piece')}</SelectItem>
                        <SelectItem value="kg">{t('products.units.kg')}</SelectItem>
                        <SelectItem value="litre">{t('products.units.litre')}</SelectItem>
                        <SelectItem value="mètre">{t('products.units.metre')}</SelectItem>
                        <SelectItem value="carton">{t('products.units.carton')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.description')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t('common.active')}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('common.save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
