import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { storageService } from '@/services/storage/storageService';
import { stockService } from '@/services/stock/stockService';
import { auditService } from '@/services/audit/auditService';
import { DeliveryNote, DocumentLine, DocumentTotals, Client, Product, DocumentStatus } from '@/core/types/index';

const lineSchema = z.object({
  productId: z.string().min(1, "Produit requis"),
  quantity: z.coerce.number().positive("La quantité doit être positive"),
  unitPrice: z.coerce.number().min(0, "Le prix doit être positif"),
  discount: z.coerce.number().min(0).max(100),
  tvaRate: z.coerce.number().min(0),
});

const deliverySchema = z.object({
  number: z.string().min(1),
  date: z.string().min(1),
  clientId: z.string().min(1, "Client requis"),
  status: z.enum(['draft', 'validated', 'cancelled']),
  driverName: z.string().optional(),
  vehicleInfo: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, "Au moins un produit est requis"),
});

type DeliveryFormValues = z.infer<typeof deliverySchema>;

const ClientSelector = ({ form, clients }: { form: any, clients: any[] }) => {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();

  return (
    <FormField
      control={form.control}
      name="clientId"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{t('deliveries.client')}</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
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
                    ? clients.find((client) => client.id === field.value)?.name
                    : t('deliveries.selectClient')}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder={t('sales.searchClient')} />
                <CommandList>
                  <CommandEmpty>{t('sales.noClientFound')}</CommandEmpty>
                  <CommandGroup>
                    {clients.map((client) => (
                      <CommandItem
                        value={client.name}
                        key={client.id}
                        onSelect={() => {
                          form.setValue("clientId", client.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            client.id === field.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {client.name}
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
  );
};

const ProductLineItem = ({ index, products, remove, form }: { index: number, products: any[], remove: (index: number) => void, form: any }) => {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();

  return (
    <TableRow>
      <TableCell className="min-w-[250px]">
        <FormField
          control={form.control}
          name={`lines.${index}.productId`}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <Popover open={open} onOpenChange={setOpen}>
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
                        : t('purchases.selectProduct')}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder={t('sales.searchProduct')} />
                    <CommandList>
                      <CommandEmpty>{t('sales.noProductFound')}</CommandEmpty>
                      <CommandGroup>
                        {products.map((product) => (
                          <CommandItem
                            value={product.name}
                            key={product.id}
                            onSelect={() => {
                              form.setValue(`lines.${index}.productId`, product.id);
                              form.setValue(`lines.${index}.unitPrice`, product.salePrice ?? 0);
                              form.setValue(`lines.${index}.tvaRate`, product.tvaRate ?? 20);
                              setOpen(false);
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
                            {product.name}
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
      </TableCell>
      <TableCell width="100">
        <FormField
          control={form.control}
          name={`lines.${index}.quantity`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell width="120">
        <FormField
          control={form.control}
          name={`lines.${index}.unitPrice`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell width="100">
        <FormField
          control={form.control}
          name={`lines.${index}.discount`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell width="120" className="text-right">
        {(() => {
          const qty = form.watch(`lines.${index}.quantity`) || 0;
          const price = form.watch(`lines.${index}.unitPrice`) || 0;
          const discount = form.watch(`lines.${index}.discount`) || 0;
          const total = qty * price * (1 - discount / 100);
          return total.toFixed(2);
        })()} MAD
      </TableCell>
      <TableCell width="50">
        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

const DeliveryForm: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      number: `BL-${new Date().getFullYear()}-${String(storageService.loadCollection('deliveries').length + 1).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      clientId: '',
      status: 'draft',
      driverName: '',
      vehicleInfo: '',
      notes: '',
      lines: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0, tvaRate: 20 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  useEffect(() => {
    setClients(storageService.loadCollection('clients'));
    setProducts(storageService.loadCollection('products'));

    if (isEdit && id) {
      const delivery = storageService.loadCollection('deliveries').find(d => d.id === id);
      if (delivery) {
        form.reset({
          number: delivery.number,
          date: delivery.date,
          clientId: delivery.clientId,
          status: delivery.status,
          driverName: delivery.driverName || '',
          vehicleInfo: delivery.vehicleInfo || '',
          notes: delivery.notes || '',
          lines: delivery.lines.map(line => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount,
            tvaRate: line.tvaRate,
          })),
        });
      }
    }
  }, [id, isEdit, form]);

  const watchLines = form.watch("lines");

  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalDiscount = 0;

    watchLines.forEach(line => {
      const lineHT = (line.quantity || 0) * (line.unitPrice || 0);
      const lineDiscount = lineHT * ((line.discount || 0) / 100);
      const discountedHT = lineHT - lineDiscount;
      const lineTVA = discountedHT * ((line.tvaRate || 0) / 100);

      totalHT += discountedHT;
      totalTVA += lineTVA;
      totalDiscount += lineDiscount;
    });

    return {
      totalHT,
      totalTVA,
      totalTTC: totalHT + totalTVA,
      totalDiscount,
    };
  };

  const totals = calculateTotals();

  const onSubmit = (values: DeliveryFormValues) => {
    console.log("Submitting delivery:", values);
    try {
      const deliveries = storageService.loadCollection('deliveries');
    const existingDelivery = isEdit ? deliveries.find(d => d.id === id) : null;
    const client = clients.find(c => c.id === values.clientId);

    const docLines: DocumentLine[] = values.lines.map(line => {
      const product = products.find(p => p.id === line.productId);
      const lineHT = (line.quantity || 0) * (line.unitPrice || 0);
      const lineDiscount = lineHT * ((line.discount || 0) / 100);
      const discountedHT = lineHT - lineDiscount;
      const lineTVA = discountedHT * ((line.tvaRate || 0) / 100);

      return {
        id: crypto.randomUUID(),
        productId: line.productId,
        productName: product?.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: line.discount,
        tvaRate: line.tvaRate,
        totalHT: discountedHT,
        totalTVA: lineTVA,
        totalTTC: discountedHT + lineTVA,
      };
    });

    const docTotals: DocumentTotals = calculateTotals();

    const deliveryData: DeliveryNote = {
      id: isEdit ? id! : crypto.randomUUID(),
      createdAt: isEdit ? existingDelivery!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...values,
      clientName: client?.name,
      lines: docLines,
      totals: docTotals,
    };

    // Handle stock movement
    stockService.processDocumentStock(
      'DELIVERY',
      deliveryData.id,
      values.lines,
      values.status,
      existingDelivery?.status,
      deliveryData.number
    );

    if (isEdit) {
      const index = deliveries.findIndex(d => d.id === id);
      deliveries[index] = deliveryData;
    } else {
      deliveries.push(deliveryData);
    }

    storageService.saveCollection('deliveries', deliveries);

    // Audit Log
    auditService.log(
      isEdit ? 'UPDATE' : 'CREATE',
      'DELIVERY',
      deliveryData.id,
      `Delivery ${deliveryData.number} ${isEdit ? 'updated' : 'created'} with status ${deliveryData.status}`
    );

    navigate('/deliveries');
    } catch (error) {
      console.error("Error saving delivery:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to="/deliveries">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('common.back')}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{isEdit ? t('deliveries.editDelivery') : t('deliveries.newDelivery')}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('deliveries.generalInfo')}</CardTitle>
              <CardDescription>{t('deliveries.generalInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('deliveries.number')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('deliveries.date')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ClientSelector form={form} clients={clients} />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.status')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">{t('documentStatus.draft')}</SelectItem>
                        <SelectItem value="validated">{t('documentStatus.validated')}</SelectItem>
                        <SelectItem value="cancelled">{t('documentStatus.cancelled')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="driverName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('deliveries.driver')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('deliveries.driverPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('deliveries.vehicle')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('deliveries.vehiclePlaceholder')} />
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
                      <Textarea {...field} placeholder={t('deliveries.notesPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('deliveries.products')}</CardTitle>
                <CardDescription>{t('deliveries.productsDescription')}</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, discount: 0, tvaRate: 20 })}>
                <Plus className="me-2 h-4 w-4" />
                {t('deliveries.addProduct')}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('pdf.product')}</TableHead>
                    <TableHead>{t('pdf.quantity')}</TableHead>
                    <TableHead>{t('pdf.unitPrice')}</TableHead>
                    <TableHead>{t('pdf.discount')}</TableHead>
                    <TableHead className="text-right">Total HT</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <ProductLineItem 
                      key={field.id} 
                      index={index} 
                      products={products} 
                      remove={remove} 
                      form={form} 
                    />
                  ))}
                </TableBody>
              </Table>
              {fields.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  Aucun produit ajouté
                </div>
              )}
              {form.formState.errors.lines && (
                 <div className="text-destructive text-sm px-4 pb-2">
                   {form.formState.errors.lines.message}
                 </div>
              )}
              
              <div className="p-4 border-t">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">{t('purchases.totalHT')}</span>
                  <span className="font-medium">{totals.totalHT.toFixed(2)} {t('common.currency')}</span>
                </div>
                <div className="flex justify-between py-1 text-muted-foreground text-sm">
                  <span>Remises</span>
                  <span>-{totals.totalDiscount.toFixed(2)} {t('common.currency')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">{t('purchases.totalTVA')}</span>
                  <span className="font-medium">{totals.totalTVA.toFixed(2)} {t('common.currency')}</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between py-2 text-lg font-bold">
                  <span>{t('purchases.totalTTC')}</span>
                  <span className="text-blue-600">{totals.totalTTC.toFixed(2)} {t('common.currency')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" asChild>
              <Link to="/deliveries">{t('common.cancel')}</Link>
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

export default DeliveryForm;
