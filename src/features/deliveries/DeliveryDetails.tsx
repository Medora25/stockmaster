import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { pdfService } from '@/services/pdf/pdfService';
import { DeliveryNote, DocumentStatus } from '@/core/types';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

const DeliveryDetails: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { id } = useParams();
  const deliveries = useAppStore((state) => state.deliveries) as DeliveryNote[];
  const convertDeliveryToInvoice = useAppStore((state) => state.convertDeliveryToInvoice);
  const delivery = deliveries.find((d) => d.id === id);

  if (!delivery) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link to="/deliveries">
              <ArrowLeft className="me-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{t('deliveries.deliveryDetails')}</h1>
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

  const handleConvertToInvoice = () => {
    if (!delivery) return;

    const invoice = convertDeliveryToInvoice(delivery.id);

    if (!invoice) {
      toast({
        title: t('common.error'),
        description: t('deliveries.convertToInvoiceUnavailable', 'Conversion indisponible pour ce bon de livraison.'),
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: t('common.success'),
      description: t('deliveries.convertedInvoice', { number: invoice.number }),
      action: (
        <ToastAction altText={t('common.view')} asChild>
          <Link to={`/invoices/edit/${invoice.id}`}>{t('common.view')}</Link>
        </ToastAction>
      ),
    });
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
        <h1 className="text-3xl font-bold">{t('deliveries.deliveryDetails')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => pdfService.generateDeliveryPDF(delivery)}>
            <Printer className="me-2 h-4 w-4" />
            {t('common.print')}
          </Button>
          {delivery.status === 'validated' && !delivery.convertedToInvoice && (
            <Button variant="outline" onClick={handleConvertToInvoice}>
              <FileText className="me-2 h-4 w-4" />
              {t('deliveries.convertToInvoice')}
            </Button>
          )}
          {delivery.convertedToInvoice && delivery.invoiceId && (
            <Button variant="outline" asChild>
              <Link to={`/invoices/edit/${delivery.invoiceId}`}>
                <FileText className="me-2 h-4 w-4" />
                {t('common.view')}
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link to={`/deliveries/edit/${delivery.id}`}>
              <Edit className="me-2 h-4 w-4" />
              {t('common.edit')}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('deliveries.generalInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>{t('deliveries.number')}:</strong> {delivery.number}</p>
            <p><strong>{t('deliveries.date')}:</strong> {delivery.date}</p>
            <p><strong>{t('deliveries.driver')}:</strong> {delivery.driverName || '-'}</p>
            <p><strong>{t('deliveries.vehicle')}:</strong> {delivery.vehicleInfo || '-'}</p>
          </div>
          <div>
            <p><strong>{t('deliveries.status')}:</strong> <Badge variant={getStatusBadgeVariant(delivery.status)}>{t(`documentStatus.${delivery.status}`)}</Badge></p>
            <p><strong>{t('deliveries.client')}:</strong> {delivery.clientName || '-'}</p>
          </div>
          {delivery.notes && (
            <div className="md:col-span-2">
              <p><strong>{t('common.notes')}:</strong> {delivery.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('deliveries.products')}</CardTitle>
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
              {delivery.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.productName}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">{line.totalTTC.toFixed(2)} {t('common.currency')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableRow>
              <TableCell colSpan={2} className="text-right font-bold">{t('common.total')}</TableCell>
              <TableCell className="text-right font-bold">{delivery.totals.totalTTC.toFixed(2)} {t('common.currency')}</TableCell>
            </TableRow>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryDetails;
