import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';
import { pdfService } from '@/services/pdf/pdfService';
import { Sale, Purchase } from '@/core/types';

interface AccountingVATReportProps {
  sales: Sale[];
  purchases: Purchase[];
}

export const AccountingVATReport: React.FC<AccountingVATReportProps> = ({ sales, purchases }) => {
  const { t } = useTranslation();

  const vatData = useMemo(() => {
    const s = sales;
    const p = purchases;
    
    const collected = s.reduce((acc, x) => acc + x.totals.totalTVA, 0);
    const baseSales = s.reduce((acc, x) => acc + x.totals.totalHT, 0);
    const deductible = p.reduce((acc, x) => acc + x.totals.totalTVA, 0);
    const basePurchases = p.reduce((acc, x) => acc + x.totals.totalHT, 0);
    const net = collected - deductible;

    // Calculate details by rate for sales
    const detailsMap = new Map<number, { baseHT: number; tvaAmount: number }>();
    s.forEach(sale => {
      sale.lines.forEach(line => {
        const rate = line.tvaRate || 20;
        const prev = detailsMap.get(rate) || { baseHT: 0, tvaAmount: 0 };
        // We need line totalHT. If not stored, calculate it.
        const lineHT = line.totalHT || (line.unitPrice * line.quantity * (1 - (line.discount || 0) / 100));
        prev.baseHT += lineHT;
        // Approximate TVA for line to avoid rounding errors matching total
        prev.tvaAmount += lineHT * (rate / 100);
        detailsMap.set(rate, prev);
      });
    });

    const details = Array.from(detailsMap.entries()).map(([rate, val]) => ({
      rate,
      baseHT: val.baseHT,
      tvaAmount: val.tvaAmount
    })).sort((a, b) => a.rate - b.rate);

    return { collected, deductible, net, baseSales, basePurchases, details };
  }, [sales, purchases]);

  const exportVatJSON = () => {
    const dataStr = JSON.stringify(vatData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vat_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportVatPDF = () => {
    const pdfData = {
      collected: vatData.collected,
      deductible: vatData.deductible,
      toPay: vatData.net,
      details: vatData.details
    };
    pdfService.generateVATReportPDF(pdfData, t('accounting.vatReport'));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('accounting.vatReport')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6 justify-end">
          <Button onClick={exportVatPDF} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            {t('exportPDF')}
          </Button>
          <Button onClick={exportVatJSON} variant="outline">
            {t('exportJSON')}
          </Button>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          <div className="space-y-2 p-4 border rounded-lg">
            <h3 className="font-semibold text-muted-foreground">{t('accounting.vatCollected')}</h3>
            <div className="text-2xl font-bold">{vatData.collected.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Base: {vatData.baseSales.toFixed(2)}</div>
          </div>
          <div className="space-y-2 p-4 border rounded-lg">
            <h3 className="font-semibold text-muted-foreground">{t('accounting.vatDeductible')}</h3>
            <div className="text-2xl font-bold">{vatData.deductible.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Base: {vatData.basePurchases.toFixed(2)}</div>
          </div>
          <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold text-muted-foreground">{t('accounting.vatNet')}</h3>
            <div className={`text-2xl font-bold ${vatData.net > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {vatData.net.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              {vatData.net > 0 ? t('accounting.toPay') : t('accounting.credit')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
