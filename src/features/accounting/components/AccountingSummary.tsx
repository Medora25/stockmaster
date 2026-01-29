import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sale, Purchase, CashEntry, Client, Supplier, Product } from '@/core/types';

interface AccountingSummaryProps {
  sales: Sale[];
  purchases: Purchase[];
  recettes: CashEntry[];
  clients: Client[];
  suppliers: Supplier[];
  products: Product[];
}

export const AccountingSummary: React.FC<AccountingSummaryProps> = ({
  sales,
  purchases,
  recettes,
  clients,
  suppliers,
  products,
}) => {
  const { t } = useTranslation();
  const currency = t('currency');

  const fmt = (n: number) => `${n.toFixed(2)} ${currency}`;

  const summary = useMemo(() => {
    const totalSalesHT = sales.reduce((acc, s) => acc + s.totals.totalHT, 0);
    const totalSalesTVA = sales.reduce((acc, s) => acc + s.totals.totalTVA, 0);
    const totalSalesTTC = sales.reduce((acc, s) => acc + s.totals.totalTTC, 0);

    const totalPurchasesHT = purchases.reduce((acc, p) => acc + p.totals.totalHT, 0);
    const totalPurchasesTVA = purchases.reduce((acc, p) => acc + p.totals.totalTVA, 0);
    const totalPurchasesTTC = purchases.reduce((acc, p) => acc + p.totals.totalTTC, 0);

    const cashIn = recettes.filter((r) => r.type === 'ENTREE').reduce((acc, r) => acc + r.amount, 0);
    const cashOut = recettes.filter((r) => r.type === 'SORTIE').reduce((acc, r) => acc + r.amount, 0);
    const cashBalance = cashIn - cashOut;

    const clientDebt = clients.reduce((acc, c) => acc + (c.debt || 0), 0);
    const supplierBalance = suppliers.reduce((acc, s) => acc + (s.balance || 0), 0);
    const stockValue = products.reduce((acc, p) => acc + p.stockQuantity * p.purchasePrice, 0);

    // Calculate COGS (Cost of Goods Sold)
    const totalCOGS = sales.reduce((total, sale) => {
      const saleCOGS = sale.lines.reduce((lineSum, line) => {
        const product = products.find(p => p.id === line.productId);
        const cost = product ? product.purchasePrice : 0;
        return lineSum + (cost * line.quantity);
      }, 0);
      return total + saleCOGS;
    }, 0);

    // Expenses (SORTIE excluding PAIEMENT_FOURNISSEUR which is usually covered by Purchases logic if we consider accrual, 
    // but here Recettes are cash. 
    // For profit: Sales HT - COGS - Expenses (excluding supplier payments to avoid double counting if purchases are already tracked? 
    // Actually, PAIEMENT_FOURNISSEUR pays off the debt. The expense is the Purchase itself.
    // But `recettes` might include other expenses (rent, salaries).
    const expenses = recettes
      .filter(r => r.type === 'SORTIE' && r.category !== 'PAIEMENT_FOURNISSEUR' && r.category !== 'ACHAT') // Exclude ACHAT if it's a direct cash purchase already in Purchases? 
      // Assuming 'ACHAT' in recettes might be a duplicate if we also have it in 'Purchases'.
      // If the user enters a Purchase, it goes to Purchases list. If they pay it, it's PAIEMENT_FOURNISSEUR.
      // If they make a direct cash expense without a Purchase document, it's DEPENSE or AUTRE.
      .reduce((acc, r) => acc + r.amount, 0);

    const profitEstimate = totalSalesHT - totalCOGS - expenses;

    return {
      totalSalesTTC,
      totalPurchasesTTC,
      totalSalesTVA,
      totalPurchasesTVA,
      cashBalance,
      clientDebt,
      supplierBalance,
      stockValue,
      profitEstimate,
    };
  }, [sales, purchases, recettes, clients, suppliers, products]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('accounting.summary')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-primary/10">
            <div className="text-sm text-muted-foreground">{t('accounting.totalSales')}</div>
            <div className="text-xl font-semibold">{fmt(summary.totalSalesTTC)}</div>
            <Badge variant="outline" className="mt-2">{t('accounting.vatCollected')}: {fmt(summary.totalSalesTVA)}</Badge>
          </div>
          <div className="p-4 rounded-lg bg-secondary/10">
            <div className="text-sm text-muted-foreground">{t('accounting.totalPurchases')}</div>
            <div className="text-xl font-semibold">{fmt(summary.totalPurchasesTTC)}</div>
            <Badge variant="outline" className="mt-2">{t('accounting.vatDeductible')}: {fmt(summary.totalPurchasesTVA)}</Badge>
          </div>
          <div className="p-4 rounded-lg bg-accent/10">
            <div className="text-sm text-muted-foreground">{t('accounting.cashBalance')}</div>
            <div className="text-xl font-semibold">{fmt(summary.cashBalance)}</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="text-sm text-muted-foreground">{t('accounting.stockValue')}</div>
            <div className="text-xl font-semibold">{fmt(summary.stockValue)}</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="text-sm text-muted-foreground">{t('accounting.clientDebt')}</div>
            <div className="text-xl font-semibold">{fmt(summary.clientDebt)}</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="text-sm text-muted-foreground">{t('accounting.supplierBalance')}</div>
            <div className="text-xl font-semibold">{fmt(summary.supplierBalance)}</div>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10">
            <div className="text-sm text-muted-foreground">{t('accounting.profitEstimate')} (Gross)</div>
            <div className="text-xl font-semibold">{fmt(summary.profitEstimate)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
