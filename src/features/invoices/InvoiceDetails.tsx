import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Printer, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { pdfService } from '@/services/pdf/pdfService';
import { Invoice, DocumentStatus } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import { auditService } from '@/services/audit/auditService';
import { useAppStore } from '@/store/useAppStore';

const InvoiceDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { toast } = useToast();
  const invoices = useAppStore((state) => state.invoices) as Invoice[];
  const updateInvoice = useAppStore((state) => state.updateInvoice);
  const invoice = invoices.find((i) => i.id === id);

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link to="/invoices">
              <ArrowLeft className="me-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{t('invoices.title')}</h1>
          <div />
        </div>
        <Card>
          <CardContent>{t('common.noData')}</CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: DocumentStatus) => {
    switch (status) {
      case 'validated':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'draft':
      default:
        return 'secondary';
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
        <h1 className="text-3xl font-bold">{t('invoices.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => pdfService.generateInvoicePDF(invoice)}>
            <Printer className="me-2 h-4 w-4" />
            {t('common.print')}
          </Button>
          {invoice.paymentStatus !== 'paid' && (
            <Button
              variant="default"
              onClick={() => {
                const updated: Invoice = {
                  ...invoice,
                  paymentStatus: 'paid',
                  paidAmount: invoice.totals.totalTTC,
                  updatedAt: new Date().toISOString(),
                };
                updateInvoice(invoice.id, updated);
                auditService.log('UPDATE', 'INVOICE', updated.id, `Invoice ${updated.number} marked as PAID`);
                toast({
                  title: t('paymentStatus.paid'),
                  description: `${t('invoices.number')}: ${updated.number}`,
                });
              }}
            >
              <CheckCircle className="me-2 h-4 w-4" />
              {t('paymentStatus.paid')}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('invoices.number')}: {invoice.number}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>{t('common.date')}:</strong> {invoice.date}</p>
            <p><strong>{t('sales.table.client')}:</strong> {invoice.clientName || '-'}</p>
            <p><strong>{t('invoices.paidAmount')}:</strong> {invoice.paidAmount?.toFixed(2)} {t('common.currency')}</p>
          </div>
          <div>
            <p>
              <strong>{t('common.status')}:</strong>{' '}
              <Badge variant={getStatusBadgeVariant(invoice.status)}>{t(`documentStatus.${invoice.status}`)}</Badge>
            </p>
            <p><strong>{t('sales.table.paymentStatus')}:</strong> {t(`paymentStatus.${invoice.paymentStatus}`)}</p>
          </div>
          {invoice.notes && (
            <div className="md:col-span-2">
              <p><strong>{t('common.notes')}:</strong> {invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('sales.products')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('products.name')}</TableHead>
                <TableHead className="text-right">{t('common.quantity')}</TableHead>
                <TableHead className="text-right">{t('common.total')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.productName}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">{line.totalTTC.toFixed(2)} {t('common.currency')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableRow>
              <TableCell colSpan={2} className="text-right font-bold">{t('common.total')}</TableCell>
              <TableCell className="text-right font-bold">{invoice.totals.totalTTC.toFixed(2)} {t('common.currency')}</TableCell>
            </TableRow>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('sales.summary')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total HT</span>
            <span>{invoice.totals.totalHT.toFixed(2)} {t('common.currency')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Remise</span>
            <span>{invoice.totals.totalDiscount.toFixed(2)} {t('common.currency')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total TVA</span>
            <span>{invoice.totals.totalTVA.toFixed(2)} {t('common.currency')}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total TTC</span>
            <span>{invoice.totals.totalTTC.toFixed(2)} {t('common.currency')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetails;
