import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
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
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { stockService } from '@/services/stock/stockService';
import { auditService } from '@/services/audit/auditService';
import { Purchase, DocumentLine, DocumentTotals, Supplier, Product, DocumentStatus, PaymentStatus } from '@/core/types/index';
import { useAppStore } from '@/store/useAppStore';

const lineSchema = z.object({
  productId: z.string().min(1, "Produit requis"),
  quantity: z.coerce.number().positive("La quantité doit être positive"),
  unitPrice: z.coerce.number().min(0, "Le prix doit être positif"),
  discount: z.coerce.number().min(0).max(100),
  tvaRate: z.coerce.number().min(0),
});

const purchaseSchema = z.object({
  branch: z.string().min(1, "Branche requise"),
  number: z.string().min(1),
  date: z.string().min(1),
  supplierId: z.string().min(1, "Fournisseur requis"),
  status: z.enum(['draft', 'validated', 'cancelled']),
  paymentStatus: z.enum(['paid', 'partial', 'unpaid']),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, "Au moins un produit est requis"),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export const PurchaseForm: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const suppliers = useAppStore((state) => state.suppliers) as Supplier[];
  const products = useAppStore((state) => state.products) as Product[];
  const purchases = useAppStore((state) => state.purchases) as Purchase[];
  const settings = useAppStore((state) => state.settings);
  const getNextNumber = useAppStore((state) => state.getNextNumber);
  const savePurchaseDocument = useAppStore((state) => state.savePurchaseDocument);
  const branches = settings.branches || [];
  const defaultBranch = settings.defaultBranch || branches[0] || '';

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      branch: defaultBranch,
      number: getNextNumber('purchase'),
      date: new Date().toISOString().split('T')[0],
      supplierId: '',
      status: 'draft',
      paymentStatus: 'unpaid',
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
      const purchase = purchases.find(p => p.id === id);
      if (purchase) {
        form.reset({
          branch: purchase.branch || defaultBranch,
          number: purchase.number,
          date: purchase.date,
          supplierId: purchase.supplierId,
          status: purchase.status,
          paymentStatus: purchase.paymentStatus,
          notes: purchase.notes || '',
          lines: purchase.lines.map(line => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount,
            tvaRate: line.tvaRate,
          })),
        });
      }
    }
  }, [id, isEdit, form, defaultBranch, purchases]);

  const watchLines = form.watch("lines");

  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalDiscount = 0;

    watchLines.forEach(line => {
      const lineHT = line.quantity * line.unitPrice;
      const lineDiscount = lineHT * (line.discount / 100);
      const discountedHT = lineHT - lineDiscount;
      const lineTVA = discountedHT * (line.tvaRate / 100);

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

  const onSubmit = (values: PurchaseFormValues) => {
    const existingPurchase = isEdit ? purchases.find(p => p.id === id) : null;
    const supplier = suppliers.find(s => s.id === values.supplierId);
    const purchaseId = isEdit ? id! : crypto.randomUUID();

    const docLines: DocumentLine[] = values.lines.map(line => {
      const product = products.find(p => p.id === line.productId);
      const lineHT = line.quantity * line.unitPrice;
      const lineDiscount = lineHT * (line.discount / 100);
      const discountedHT = lineHT - lineDiscount;
      const lineTVA = discountedHT * (line.tvaRate / 100);

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

    const purchaseData: Purchase = {
      id: purchaseId,
      createdAt: isEdit ? existingPurchase!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...values,
      supplierName: supplier?.name,
      lines: docLines,
      totals: docTotals,
    };

    // Handle stock movement
    stockService.processDocumentStock(
      'PURCHASE',
      purchaseId,
      values.lines,
      values.status,
      existingPurchase?.status,
      purchaseData.number
    );
    savePurchaseDocument(purchaseData);

    // Audit Log
    auditService.log(
      isEdit ? 'UPDATE' : 'CREATE',
      'PURCHASE',
      purchaseData.id,
      `Purchase ${purchaseData.number} ${isEdit ? 'updated' : 'created'} with status ${purchaseData.status}`
    );

    navigate('/purchases');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to="/purchases">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('common.back')}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{isEdit ? t('purchases.editPurchase') : t('purchases.newPurchase')}</h1>
        <div className="w-24" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('purchases.purchaseDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormLabel>{t('purchases.number')}</FormLabel>
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
                    <FormLabel>{t('purchases.date')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchases.supplier')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('purchases.selectSupplier')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchases.status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('purchases.selectStatus')} />
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
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t('common.notes')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder={t('purchases.notesPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('purchases.products')}</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, discount: 0, tvaRate: 20 })}>
                <Plus className="me-2 h-4 w-4" />
                {t('purchases.addProduct')}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">{t('pdf.product')}</TableHead>
                      <TableHead className="min-w-[100px]">{t('pdf.quantity')}</TableHead>
                      <TableHead className="min-w-[120px]">{t('pdf.unitPrice')}</TableHead>
                      <TableHead className="min-w-[100px]">{t('pdf.discount')} %</TableHead>
                      <TableHead className="text-right min-w-[100px]">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.productId`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    const product = products.find(p => p.id === value);
                                    if (product) {
                                      form.setValue(`lines.${index}.unitPrice`, product.purchasePrice);
                                    }
                                  }} 
                                  defaultValue={field.value} 
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('purchases.selectProduct')} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {products.map(product => (
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
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input type="number" min="1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input type="number" step="0.01" min="0" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${index}.discount`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input type="number" min="0" max="100" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {((watchLines[index]?.quantity || 0) * (watchLines[index]?.unitPrice || 0) * (1 - (watchLines[index]?.discount || 0) / 100)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('purchases.totals')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('purchases.paymentStatus')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('purchases.selectPaymentStatus')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="paid">{t('paymentStatus.paid')}</SelectItem>
                            <SelectItem value="partial">{t('paymentStatus.partial')}</SelectItem>
                            <SelectItem value="unpaid">{t('paymentStatus.unpaid')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2 border-t md:border-t-0 md:border-s ps-0 md:ps-8 pt-4 md:pt-0">
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
                  <div className="flex justify-between py-2 border-t mt-2 text-lg font-bold">
                    <span>{t('purchases.totalTTC')}</span>
                    <span className="text-blue-600">{totals.totalTTC.toFixed(2)} {t('common.currency')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" asChild>
              <Link to="/purchases">{t('common.cancel')}</Link>
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

export default PurchaseForm;
