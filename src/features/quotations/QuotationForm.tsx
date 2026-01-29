import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Trash2, Check, ChevronsUpDown, Search } from 'lucide-react';
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
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DocumentLine, DocumentTotals, Quotation, DocumentStatus } from '@/core/types';
import { pdfService } from '@/services/pdf/pdfService';
import { useAppStore } from '@/store/useAppStore';

const lineSchema = z.object({
  productId: z.string().min(1, "Produit requis"),
  quantity: z.coerce.number().positive("La quantité doit être positive"),
  unitPrice: z.coerce.number().min(0, "Le prix doit être positif"),
  discount: z.coerce.number().min(0).max(100),
  tvaRate: z.coerce.number().min(0),
});

const quotationSchema = z.object({
  branch: z.string().min(1, "Branche requise"),
  number: z.string().min(1),
  date: z.string().min(1),
  validUntil: z.string().optional(),
  clientId: z.string().min(1, "Client requis"),
  status: z.enum(['draft', 'validated', 'cancelled']),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, "Au moins un produit est requis"),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

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
      <TableCell width="120">
        <FormField
          control={form.control}
          name={`lines.${index}.tvaRate`}
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()} value={field.value?.toString()}>
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
      </TableCell>
      <TableCell width="120" className="text-right">
        {(() => {
          const qty = form.watch(`lines.${index}.quantity`) || 0;
          const price = form.watch(`lines.${index}.unitPrice`) || 0;
          const discount = form.watch(`lines.${index}.discount`) || 0;
          const tva = form.watch(`lines.${index}.tvaRate`) || 0;
          const ht = qty * price * (1 - discount / 100);
          const ttc = ht * (1 + tva / 100);
          return ttc.toFixed(2);
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

const QuotationForm: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const { 
    clients, 
    products, 
    quotations, 
    settings, 
    addQuotation, 
    updateQuotation,
    deleteQuotation,
    getNextNumber 
  } = useAppStore();

  const handleDelete = () => {
    if (isEdit && id) {
      if (window.confirm(t('common.confirmDelete'))) {
        deleteQuotation(id);
        navigate('/quotations');
      }
    }
  };

  const branches = settings.branches || [];
  const defaultBranch = settings.defaultBranch || branches[0] || '';

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      branch: defaultBranch,
      number: '', // Will be set in useEffect or initialized if not edit
      date: new Date().toISOString().split('T')[0],
      validUntil: undefined,
      clientId: '',
      status: 'draft',
      notes: '',
      lines: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0, tvaRate: settings.defaultTvaRate || 20 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  // Initialize number for new quotation
  useEffect(() => {
    if (!isEdit) {
      form.setValue('number', getNextNumber('quotation'));
      const validityDate = new Date();
      validityDate.setDate(validityDate.getDate() + 30);
      form.setValue('validUntil', validityDate.toISOString().split('T')[0]);
    }
  }, [isEdit, getNextNumber, form]);

  useEffect(() => {
    if (isEdit && id) {
      const quotation = quotations.find(q => q.id === id);
      if (quotation) {
        form.reset({
          branch: quotation.branch || defaultBranch,
          number: quotation.number,
          date: quotation.date,
          validUntil: quotation.validUntil,
          clientId: quotation.clientId,
          status: quotation.status,
          notes: quotation.notes || '',
          lines: quotation.lines.map(line => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount,
            tvaRate: line.tvaRate,
          })),
        });
      }
    }
  }, [id, isEdit, form, quotations, defaultBranch]);

  const watchLines = form.watch("lines") || [];

  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalDiscount = 0;

    (watchLines || []).forEach(line => {
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

  const handlePrint = () => {
    const values = form.getValues();
    const client = clients.find(c => c.id === values.clientId);
    const docLines: DocumentLine[] = (values.lines || []).map((line) => {
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
    
    // Construct a temporary quotation object for printing
    const quotationData: Quotation = {
      id: isEdit ? id! : 'temp-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      number: values.number,
      date: values.date,
      validUntil: values.validUntil,
      clientId: values.clientId,
      clientName: client?.name,
      status: values.status as DocumentStatus,
      notes: values.notes,
      lines: docLines,
      totals,
      branch: values.branch,
    };
    pdfService.generateQuotationPDF(quotationData);
  };

  const onSubmit = (values: QuotationFormValues) => {
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

    const quotationData = {
      ...values,
      clientName: client?.name,
      lines: docLines,
      totals: docTotals,
    };

    if (isEdit && id) {
      updateQuotation(id, quotationData);
    } else {
      addQuotation(quotationData);
    }

    navigate('/quotations');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to="/quotations">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('common.back')}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{isEdit ? t('quotations.editQuotation') : t('quotations.newQuotation')}</h1>
          <Button type="button" variant="outline" onClick={handlePrint}>
            {t('common.print')}
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)}>
            <Save className="me-2 h-4 w-4" />
            {t('common.save')}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('quotations.quotationDetails')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <FormLabel>{t('quotations.number')}</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
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
                          <FormLabel>{t('quotations.date')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('quotations.validUntil')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('sales.client')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('sales.selectClient')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t('sales.products')}</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, discount: 0, tvaRate: settings.defaultTvaRate || 20 })}>
                    <Plus className="w-4 h-4 me-2" />
                    {t('sales.addProduct')}
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('sales.product')}</TableHead>
                        <TableHead>{t('sales.quantity')}</TableHead>
                        <TableHead>{t('sales.unitPrice')}</TableHead>
                        <TableHead>Rem.</TableHead>
                        <TableHead>TVA</TableHead>
                        <TableHead className="text-right">Total TTC</TableHead>
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
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 sticky top-4 h-fit">
              <Card>
                <CardHeader>
                  <CardTitle>{t('sales.summary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total HT</span>
                      <span>{totals.totalHT.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Remise</span>
                      <span>{totals.totalDiscount.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total TVA</span>
                      <span>{totals.totalTVA.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total TTC</span>
                      <span>{totals.totalTTC.toFixed(2)} MAD</span>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('quotations.status')}</FormLabel>
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
                  
                  <Button type="submit" className="w-full">
                    <Save className="me-2 h-4 w-4" />
                    {t('common.save')}
                  </Button>

                  {isEdit && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      className="w-full mt-2" 
                      onClick={handleDelete}
                    >
                      <Trash2 className="me-2 h-4 w-4" />
                      {t('common.delete')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default QuotationForm;
