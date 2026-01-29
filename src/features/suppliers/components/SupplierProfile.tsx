import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Supplier, Purchase, Payment, Product } from '@/core/types';

interface SupplierProfileProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchases: Purchase[];
  payments: Payment[];
  products: Product[];
  onGenerateStatement: (supplier: Supplier) => void;
  onToggleActive: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export const SupplierProfile: React.FC<SupplierProfileProps> = ({
  supplier,
  open,
  onOpenChange,
  purchases,
  payments,
  products,
  onGenerateStatement,
  onToggleActive,
  onDelete,
}) => {
  const { t } = useTranslation();

  if (!supplier) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 2,
    }).format(amount) + ' MAD';
  };

  const getRecentOperations = () => {
    const ops = [
      ...purchases.filter(p => p.supplierId === supplier.id).map(p => ({
        date: p.date,
        type: t('purchases.title'),
        ref: p.number,
        amount: p.totals.totalTTC,
      })),
      ...payments.filter(pm => pm.supplierId === supplier.id).map(pm => ({
        date: pm.date,
        type: t('cashbook.title'),
        ref: pm.reference || '',
        amount: -pm.amount,
      })),
    ];
    return ops
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const getTopProducts = () => {
    const qtyByProduct: Record<string, { name: string; quantity: number }> = {};
    purchases
      .filter(p => p.supplierId === supplier.id)
      .forEach(p => {
        p.lines.forEach(line => {
          const pid = line.productId;
          const pname =
            products.find(pr => pr.id === pid)?.name ||
            line.productName ||
            pid;
          if (!qtyByProduct[pid]) {
            qtyByProduct[pid] = { name: pname, quantity: 0 };
          }
          qtyByProduct[pid].quantity += line.quantity;
        });
      });
    return Object.entries(qtyByProduct)
      .map(([productId, v]) => ({ productId, name: v.name, quantity: v.quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{supplier.name}</SheetTitle>
          <SheetDescription>
            {supplier.email && <div>{supplier.email}</div>}
            {supplier.phone && <div>{supplier.phone}</div>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
              {supplier.ice && <div>ICE: {supplier.ice}</div>}
              {supplier.rc && <div>RC: {supplier.rc}</div>}
              {supplier.if && <div>IF: {supplier.if}</div>}
              {supplier.cnss && <div>CNSS: {supplier.cnss}</div>}
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">{t('suppliers.balance')}</div>
              <div className={`font-semibold text-lg ${supplier.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(supplier.balance)}
              </div>
            </div>
            <div className="stat-card bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">{t('clients.address')}</div>
              <div className="text-sm">{supplier.address || '-'}</div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('clients.recentOperations')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('common.type')}</TableHead>
                    <TableHead className="text-right">{t('common.amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getRecentOperations().map((op, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="py-2">{op.date}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col">
                          <span>{op.type}</span>
                          <span className="text-xs text-muted-foreground">{op.ref}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right py-2 ${op.amount < 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {formatCurrency(Math.abs(op.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('clientProfile.topProducts')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('products.title')}</TableHead>
                    <TableHead className="text-right">{t('clientProfile.quantity')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getTopProducts().map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell className="py-2">{p.name}</TableCell>
                      <TableCell className="text-right py-2">{p.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2 pt-4">
            <Button variant="outline" onClick={() => onGenerateStatement(supplier)} className="flex-1">
              <FileText className="w-4 h-4 me-2" />
              {t('clients.statement')}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => onToggleActive(supplier)} 
              className="flex-1"
            >
              {supplier.isActive ? t('common.deactivate') : t('common.activate')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => onDelete(supplier)} 
              className="flex-1"
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
