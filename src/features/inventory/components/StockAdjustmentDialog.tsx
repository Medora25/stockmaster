import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Product } from '@/core/types';
import { useAppStore } from '@/store/useAppStore';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { auditService } from '@/services/audit/auditService';

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

const formSchema = z.object({
  productId: z.string().min(1, { message: "Product is required" }),
  type: z.enum(['ADJUSTMENT_IN', 'ADJUSTMENT_OUT']),
  quantity: z.string().transform((v) => Number(v)).refine((v) => v > 0, { message: "Quantity must be greater than 0" }),
  notes: z.string().optional(),
});

const StockAdjustmentDialog: React.FC<StockAdjustmentDialogProps> = ({ open, onOpenChange, products }) => {
  const { t } = useTranslation();
  const { updateStock } = useAppStore();
  const { toast } = useToast();
  const [openCombobox, setOpenCombobox] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: '',
      type: 'ADJUSTMENT_IN',
      quantity: 1,
      notes: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      updateStock(values.productId, values.quantity, values.type, undefined);
      
      const product = products.find(p => p.id === values.productId);
      auditService.log(
        'UPDATE', 
        'INVENTORY', 
        values.productId, 
        `Stock adjustment: ${values.type} ${values.quantity} for ${product?.name || 'Unknown Product'}`
      );

      toast({
        title: t('common.success'),
        description: t('inventory.stockAdjustedSuccess'),
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.errorOccurred'),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('inventory.stockAdjustment')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('products.product')}</FormLabel>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? products.find((product) => product.id === field.value)?.name
                            : t('products.selectProduct')}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder={t('products.searchProduct')} />
                        <CommandList>
                          <CommandEmpty>{t('common.noResults')}</CommandEmpty>
                          <CommandGroup>
                            {products.map((product) => (
                              <CommandItem
                                value={product.name}
                                key={product.id}
                                onSelect={() => {
                                  form.setValue("productId", product.id);
                                  setOpenCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    product.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {product.name} ({product.stockQuantity} {product.unit})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('inventory.adjustmentType')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADJUSTMENT_IN">{t('inventory.adjustmentIn')}</SelectItem>
                      <SelectItem value="ADJUSTMENT_OUT">{t('inventory.adjustmentOut')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.quantity')}</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
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
                  <FormLabel>{t('common.notes')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
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

export default StockAdjustmentDialog;
