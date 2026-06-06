import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Trash2, Check, ChevronsUpDown, Calculator } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { stockService } from '@/services/stock/stockService';
import { auditService } from '@/services/audit/auditService';
import { Sale, DocumentLine, DocumentTotals, Client, Product, DocumentStatus, PaymentMethod, PaymentStatus } from '@/core/types/index';
import { useAppStore } from '@/store/useAppStore';

const lineSchema = z.object({
  productId: z.string().min(1, "Produit requis"),
  quantity: z.coerce.number().positive("La quantité doit être positive"),
  unitPrice: z.coerce.number().min(0, "Le prix doit être positif"),
  discount: z.coerce.number().min(0).max(100),
  tvaRate: z.coerce.number().min(0),
});

const saleSchema = z.object({
  branch: z.string().min(1, "Branche requise"),
  number: z.string().min(1),
  date: z.string().min(1),
  clientId: z.string().min(1, "Client requis"),
  status: z.enum(['draft', 'validated', 'cancelled']),
  paymentMethod: z.enum(['cash', 'cheque', 'virement', 'carte']),
  paymentStatus: z.enum(['paid', 'unpaid', 'partial']),
  paidAmount: z.coerce.number().min(0).optional(),
  isCredit: z.boolean(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, "Au moins un produit est requis"),
});

type SaleFormValues = z.infer<typeof saleSchema>;

const ClientSelector = ({ form, clients }: { form: any, clients: any[] }) => {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();

  return (
    <FormField
      control={form.control}
      name="clientId"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{t('sales.client')}</FormLabel>
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
                    : t('sales.selectClient')}
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

  const quantity = form.watch(`lines.${index}.quantity`) || 0;
  const productId = form.watch(`lines.${index}.productId`);
  const product = products.find((p: any) => p.id === productId);
  const isStockLow = product && (product.stockQuantity < quantity);

  return (
    <TableRow className={cn(isStockLow && "bg-destructive/10")}>
      <TableCell className="min-w-[250px] align-top">
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
                        !field.value && "text-muted-foreground",
                        isStockLow && "border-destructive text-destructive"
                      )}
                    >
                      {field.value
                        ? products.find((product: any) => product.id === field.value)?.name
                        : t('sales.selectProduct')}
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
                        {products.map((product: any) => (
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
              {isStockLow && (
                 <p className="text-xs text-destructive mt-1">Stock insuffisant ({product.stockQuantity})</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell width="100" className="align-top">
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
      <TableCell width="120" className="align-top">
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
      <TableCell width="100" className="align-top">
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
      <TableCell width="100" className="align-top">
         <FormField
          control={form.control}
          name={`lines.${index}.tvaRate`}
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
      <TableCell width="120" className="text-right align-top pt-4">
        {(() => {
          const qty = form.watch(`lines.${index}.quantity`) || 0;
          const price = form.watch(`lines.${index}.unitPrice`) || 0;
          const discount = form.watch(`lines.${index}.discount`) || 0;
          const total = qty * price * (1 - discount / 100);
          return total.toFixed(2);
        })()} MAD
      </TableCell>
      <TableCell width="50" className="align-top">
        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

const SaleForm: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const clients = useAppStore((state) => state.clients) as Client[];
  const products = useAppStore((state) => state.products) as Product[];
  const sales = useAppStore((state) => state.sales) as Sale[];
  const settings = useAppStore((state) => state.settings);
  const getNextNumber = useAppStore((state) => state.getNextNumber);
  const saveSaleDocument = useAppStore((state) => state.saveSaleDocument);
  const branches = settings.branches || [];
  const defaultBranch = settings.defaultBranch || branches[0] || '';

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      branch: defaultBranch,
      number: getNextNumber('sale'),
      date: new Date().toISOString().split('T')[0],
      clientId: '',
      status: 'draft',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      paidAmount: 0,
      isCredit: false,
      notes: '',
      lines: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0, tvaRate: 20 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  useEffect(() => {
    if (isEdit && id) {
      const sale = sales.find(s => s.id === id);
      if (sale) {
        form.reset({
          branch: sale.branch || defaultBranch,
          number: sale.number,
          date: sale.date,
          clientId: sale.clientId,
          status: sale.status,
          paymentMethod: sale.paymentMethod,
          paymentStatus: sale.paymentStatus,
          isCredit: sale.isCredit || false,
          notes: sale.notes || '',
          lines: sale.lines.map(line => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount,
            tvaRate: line.tvaRate,
          })),
        });
      }
    }
  }, [id, isEdit, form, defaultBranch, sales]);

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
  const paymentStatus = form.watch('paymentStatus');

  useEffect(() => {
    if (paymentStatus === 'paid') {
      form.setValue('paidAmount', totals.totalTTC);
      form.setValue('isCredit', false);
    } else if (paymentStatus === 'unpaid') {
      form.setValue('paidAmount', 0);
      form.setValue('isCredit', true);
    } else if (paymentStatus === 'partial') {
      form.setValue('isCredit', true);
    }
  }, [paymentStatus, totals.totalTTC, form]);

  const onSubmit = (values: SaleFormValues) => {
    const existingSale = isEdit ? sales.find(s => s.id === id) : null;
    const client = clients.find(c => c.id === values.clientId);
    const saleId = isEdit ? id! : crypto.randomUUID();

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

    const saleData: Sale = {
      id: saleId,
      createdAt: isEdit ? existingSale!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...values,
      clientName: client?.name,
      lines: docLines,
      totals: docTotals,
    };

    // Handle stock movement
    stockService.processDocumentStock(
      'SALE',
      saleId,
      values.lines,
      values.status,
      existingSale?.status,
      saleData.number
    );
    saveSaleDocument(saleData);

    // Audit Log
    auditService.log(
      isEdit ? 'UPDATE' : 'CREATE',
      'SALE',
      saleData.id,
      `Sale ${saleData.number} ${isEdit ? 'updated' : 'created'} with status ${saleData.status}`
    );

    navigate('/sales');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/sales">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{isEdit ? t('sales.editSale') : t('sales.newSale')}</h1>
        </div>
        <div className="flex items-center gap-2">
           <div className="hidden sm:block text-sm text-muted-foreground mr-4">
             Total: <span className="font-bold text-foreground">{totals.totalTTC.toFixed(2)} MAD</span>
           </div>
           <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            <Save className="w-4 h-4 me-2" />
            {t('save')}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              {/* Client & Info Section */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('sales.saleDetails')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <ClientSelector form={form} clients={clients} />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('sales.date')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('sales.number')}</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly className="bg-muted" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
              </Card>

              {/* Products Section */}
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-muted/30">
                  <div className="space-y-1">
                    <CardTitle>{t('sales.products')}</CardTitle>
                    <CardDescription>Ajoutez des produits à la vente</CardDescription>
                  </div>
                  <Button type="button" size="sm" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, discount: 0, tvaRate: 20 })}>
                    <Plus className="w-4 h-4 me-2" />
                    {t('sales.addProduct')}
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[250px]">{t('sales.product')}</TableHead>
                        <TableHead className="w-[100px]">{t('sales.quantity')}</TableHead>
                        <TableHead className="w-[120px]">{t('sales.unitPrice')}</TableHead>
                        <TableHead className="w-[100px]">Remise %</TableHead>
                        <TableHead className="w-[100px]">TVA %</TableHead>
                        <TableHead className="w-[120px] text-right">Total HT</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
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
                    <div className="p-8 text-center text-muted-foreground">
                      Aucun produit ajouté. Cliquez sur "Ajouter un produit" pour commencer.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="sticky top-24 shadow-md border-primary/20">
                <CardHeader className="bg-primary/5 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    {t('sales.summary')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Total HT</span>
                      <span>{totals.totalHT.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Total Remise</span>
                      <span>{totals.totalDiscount.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Total TVA</span>
                      <span>{totals.totalTVA.toFixed(2)} MAD</span>
                    </div>
                    
                    <Separator className="my-2" />

                    <div className="flex justify-between text-xl font-bold text-primary">
                      <span>Total TTC</span>
                      <span>{totals.totalTTC.toFixed(2)} MAD</span>
                    </div>
                  </div>

                  <Separator />
                  <div className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('sales.status')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('sales.paymentMethod')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">{t('sales.cash')}</SelectItem>
                              <SelectItem value="cheque">{t('sales.cheque')}</SelectItem>
                              <SelectItem value="virement">{t('sales.transfer')}</SelectItem>
                              <SelectItem value="carte">{t('sales.card')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="paymentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('sales.paymentStatus')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="paid">{t('paymentStatus.paid')}</SelectItem>
                              <SelectItem value="unpaid">{t('paymentStatus.unpaid')}</SelectItem>
                              <SelectItem value="partial">{t('paymentStatus.partial')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {(paymentStatus === 'partial' || paymentStatus === 'paid') && (
                      <FormField
                        control={form.control}
                        name="paidAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Montant Payé</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field} 
                                  className={cn(
                                    paymentStatus === 'paid' && "bg-muted"
                                  )}
                                />
                                {paymentStatus === 'partial' && (
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => form.setValue('paidAmount', totals.totalTTC)}
                                    title="Tout payer"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </FormControl>
                            <div className="text-xs text-muted-foreground">
                              Reste à payer: {(totals.totalTTC - (field.value || 0)).toFixed(2)} MAD
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="isCredit"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Vente à crédit</FormLabel>
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
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Notes internes..." className="min-h-[100px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SaleForm;
