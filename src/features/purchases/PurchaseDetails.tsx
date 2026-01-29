import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Printer, Edit, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const PurchaseDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  // Mock data for demonstration
  const purchase = {
    id: id,
    number: `BA-2024-${id?.padStart(4, '0')}`,
    date: '2024-01-15',
    supplierName: 'Fournisseur Alpha SARL',
    status: 'validated',
    paymentStatus: 'unpaid',
    notes: 'Commande urgente pour le stock principal.',
    lines: [
      { id: '1', productName: 'Téléphone Smartphone X', quantity: 10, unitPrice: 2500, discount: 0, tvaRate: 20, totalHT: 25000, totalTVA: 5000, totalTTC: 30000 },
      { id: '2', productName: 'Écouteurs Bluetooth', quantity: 20, unitPrice: 150, discount: 10, tvaRate: 20, totalHT: 2700, totalTVA: 540, totalTTC: 3240 },
    ],
    totals: {
      totalHT: 27700,
      totalTVA: 5540,
      totalTTC: 33240,
      totalDiscount: 300, // Example discount
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'validated': return 'default';
      case 'draft': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'partial': return 'warning';
      case 'unpaid': return 'destructive';
      default: return 'outline';
    }
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
        <h1 className="text-3xl font-bold">{t('purchases.purchaseDetails')} #{purchase.number}</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="me-2 h-4 w-4" />
            {t('common.print')}
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/purchases/edit/${id}`}>
              <Edit className="me-2 h-4 w-4" />
              {t('common.edit')}
            </Link>
          </Button>
          <Button variant="destructive">
            <Trash2 className="me-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('purchases.generalInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('purchases.number')}</p>
            <p className="text-lg font-medium">{purchase.number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('purchases.date')}</p>
            <p className="text-lg font-medium">{purchase.date}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('purchases.supplier')}</p>
            <p className="text-lg font-medium">{purchase.supplierName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('purchases.status')}</p>
            <Badge variant={getStatusBadgeVariant(purchase.status)} className="text-lg">
              {t(`purchases.status${purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}`)}
            </Badge>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">{t('common.notes')}</p>
            <p className="text-lg font-medium">{purchase.notes || t('common.noNotes')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('purchases.products')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('products.name')}</TableHead>
                <TableHead className="text-right">{t('common.quantity')}</TableHead>
                <TableHead className="text-right">{t('products.unitPrice')}</TableHead>
                <TableHead className="text-right">{t('common.discount')}</TableHead>
                <TableHead className="text-right">{t('common.tva')}</TableHead>
                <TableHead className="text-right">{t('common.totalHT')}</TableHead>
                <TableHead className="text-right">{t('common.totalTTC')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.productName}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">{line.unitPrice.toFixed(2)} MAD</TableCell>
                  <TableCell className="text-right">{line.discount}%</TableCell>
                  <TableCell className="text-right">{line.tvaRate}%</TableCell>
                  <TableCell className="text-right">{line.totalHT.toFixed(2)} MAD</TableCell>
                  <TableCell className="text-right">{line.totalTTC.toFixed(2)} MAD</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('purchases.summary')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('purchases.totalHT')}</p>
            <p className="text-lg font-medium">{purchase.totals.totalHT.toFixed(2)} MAD</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('purchases.totalTVA')}</p>
            <p className="text-lg font-medium">{purchase.totals.totalTVA.toFixed(2)} MAD</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('purchases.totalTTC')}</p>
            <p className="text-lg font-medium">{purchase.totals.totalTTC.toFixed(2)} MAD</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('purchases.paymentStatus')}</p>
            <Badge variant={getPaymentStatusBadgeVariant(purchase.paymentStatus)} className="text-lg">
              {t(`purchases.paymentStatus${purchase.paymentStatus.charAt(0).toUpperCase() + purchase.paymentStatus.slice(1)}`)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseDetails;
