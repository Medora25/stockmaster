import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Trash2, Printer } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { storageService } from '@/services/storage/storageService';
import { auditService } from '@/services/audit/auditService';
import { Invoice, DocumentLine, DocumentTotals, Client, Product, DocumentStatus, PaymentStatus } from '@/core/types';
import { useAppStore } from '@/store/useAppStore';

const lineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).max(100),
  tvaRate: z.coerce.number().min(0),
});

const invoiceSchema = z.object({
  branch: z.string().min(1),
  number: z.string().min(1),
  date: z.string().min(1),
  dueDate: z.string().optional(),
  clientId: z.string().min(1),
  status: z.enum(['draft', 'validated', 'cancelled']),
  paymentStatus: z.enum(['paid', 'partial', 'unpaid']),
  paidAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const InvoiceForm: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { getNextNumber, settings } = useAppStore();

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const branches = settings.branches || [];
  const defaultBranch = settings.defaultBranch || branches[0] || '';

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      branch: defaultBranch,
      number: getNextNumber('invoice'),
      date: new Date().toISOString().split('T')[0],
      dueDate: undefined,
      clientId: '',
      status: 'draft',
      paymentStatus: 'unpaid',
      paidAmount: 0,
      notes: '',
      lines: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0, tvaRate: settings.defaultTvaRate || 20 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  useEffect(() => {
    setClients(storageService.loadCollection('clients'));
    setProducts(storageService.loadCollection('products'));
    if (isEdit && id) {
      const invoice = (storageService.loadCollection('invoices') as Invoice[]).find((inv) => inv.id === id);
      if (invoice) {
        form.reset({
          branch: invoice.branch || defaultBranch,
          number: invoice.number,
          date: invoice.date,
          dueDate: invoice.dueDate,
          clientId: invoice.clientId,
          status: invoice.status,
          paymentStatus: invoice.paymentStatus,
          paidAmount: invoice.paidAmount ?? 0,
          notes: invoice.notes || '',
          lines: invoice.lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount,
            tvaRate: line.tvaRate,
          })),
        });
      }
    }
  }, [id, isEdit, form, defaultBranch]);

  const watchLines = form.watch('lines') || [];

  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalDiscount = 0;
    (watchLines || []).forEach((line) => {
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

  const onSubmit = (values: InvoiceFormValues, shouldPrint: boolean = false) => {
    const invoices = storageService.loadCollection('invoices') as Invoice[];
    const existingInvoice = isEdit ? invoices.find((inv) => inv.id === id) : null;
    const client = clients.find((c) => c.id === values.clientId);

    const docLines: DocumentLine[] = values.lines.map((line) => {
      const product = products.find((p) => p.id === line.productId);
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

    const invoiceData: Invoice = {
      id: isEdit ? id! : crypto.randomUUID(),
      createdAt: isEdit ? existingInvoice!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      number: values.number,
      date: values.date,
      dueDate: values.dueDate,
      clientId: values.clientId,
      clientName: client?.name,
      status: values.status as DocumentStatus,
      lines: docLines,
      totals: docTotals,
      paymentStatus: values.paymentStatus as PaymentStatus,
      paidAmount: values.paidAmount,
      notes: values.notes,
      branch: values.branch,
    };

    if (isEdit) {
      const index = invoices.findIndex((inv) => inv.id === id);
      invoices[index] = invoiceData;
    } else {
      invoices.push(invoiceData);
    }

    storageService.saveCollection('invoices', invoices);

    auditService.log(
      isEdit ? 'UPDATE' : 'CREATE',
      'INVOICE',
      invoiceData.id,
      `Invoice ${invoiceData.number} ${isEdit ? 'updated' : 'created'}`
    );

    if (shouldPrint) {
      // Use the PDF service to generate and download/print
      // Since generateInvoicePDF is likely void, we can just call it.
      // Ideally, we wait or check, but it's client side generation.
      import('@/services/pdf/pdfService').then(({ pdfService }) => {
          pdfService.generateInvoicePDF(invoiceData);
          navigate('/invoices');
      });
    } else {
        navigate('/invoices');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to="/invoices">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('common.back')}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{isEdit ? t('invoices.editInvoice') : t('invoices.addInvoice')}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => onSubmit(v, false))} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('invoices.title')}</CardTitle>
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
                              {branches.map((b: string) => (
                                <SelectItem key={b} value={b}>
                                  {b}
                                </SelectItem>
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
                          <FormLabel>{t('invoices.number')}</FormLabel>
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
                          <FormLabel>{t('common.date')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('invoices.dueDate')}</FormLabel>
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
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t('sales.products')}</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        productId: '',
                        quantity: 1,
                        unitPrice: 0,
                        discount: 0,
                        tvaRate: settings.defaultTvaRate || 20,
                      })
                    }
                  >
                    <Plus className="w-4 h-4 me-2" />
                    {t('sales.addProduct')}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="md:col-span-4">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.productId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index !== 0 ? 'sr-only' : ''}>{t('sales.product')}</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  const product = products.find((p) => p.id === val);
                                  if (product) {
                                    form.setValue(`lines.${index}.unitPrice`, product.salePrice);
                                    form.setValue(`lines.${index}.tvaRate`, product.tvaRate);
                                  }
                                }}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('sales.selectProduct')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name} ({product.sku})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index !== 0 ? 'sr-only' : ''}>{t('sales.quantity')}</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index !== 0 ? 'sr-only' : ''}>{t('sales.unitPrice')}</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.discount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index !== 0 ? 'sr-only' : ''}>{t('sales.discount')}</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.tvaRate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index !== 0 ? 'sr-only' : ''}>{t('sales.tva')}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value.toString()} value={field.value.toString()}>
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
                      <div className="md:col-span-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('sales.summary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('sales.totalHT')}</span>
                      <span>{totals.totalHT.toFixed(2)} {t('common.currency')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t('sales.totalDiscount')}</span>
                      <span>{totals.totalDiscount.toFixed(2)} {t('common.currency')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t('sales.totalTVA')}</span>
                      <span>{totals.totalTVA.toFixed(2)} {t('common.currency')}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>{t('sales.totalTTC')}</span>
                      <span>{totals.totalTTC.toFixed(2)} {t('common.currency')}</span>
                    </div>
                  </div>
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
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('sales.table.paymentStatus')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unpaid">{t('paymentStatus.unpaid')}</SelectItem>
                            <SelectItem value="partial">{t('paymentStatus.partial')}</SelectItem>
                            <SelectItem value="paid">{t('paymentStatus.paid')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paidAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('invoices.paidAmount')}</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('common.notes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Save className="me-2 h-4 w-4" />
                  {t('common.save')}
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  className="flex-1"
                  onClick={form.handleSubmit((v) => onSubmit(v, true))}
                >
                  <Printer className="me-2 h-4 w-4" />
                  {t('common.saveAndPrint')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default InvoiceForm;
