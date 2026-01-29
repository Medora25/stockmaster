import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText } from 'lucide-react';
import { pdfService } from '@/services/pdf/pdfService';
import { Sale, Purchase, Client, Supplier, Payment } from '@/core/types';

interface AccountingStatementsProps {
  clients: Client[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  payments: Payment[];
  salesBefore?: Sale[];
  purchasesBefore?: Purchase[];
  paymentsBefore?: Payment[];
}

export const AccountingStatements: React.FC<AccountingStatementsProps> = ({
  clients,
  suppliers,
  sales,
  purchases,
  payments,
  salesBefore = [],
  purchasesBefore = [],
  paymentsBefore = [],
}) => {
  const { t } = useTranslation();
  const [accountType, setAccountType] = useState<'client' | 'supplier'>('client');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  const statementData = useMemo(() => {
    if (!selectedEntityId) return { opening: 0, rows: [] as any[] };
    
    const rows: any[] = [];
    let opening = 0; // In a real system this would come from previous years

    if (accountType === 'client') {
      const c = clients.find((x) => x.id === selectedEntityId);
      
      // Calculate opening balance from previous transactions
      const prevSales = salesBefore.filter(s => s.clientId === selectedEntityId).reduce((sum, s) => sum + s.totals.totalTTC, 0);
      const prevPayments = paymentsBefore.filter(p => p.clientId === selectedEntityId).reduce((sum, p) => sum + p.amount, 0);
      opening = prevSales - prevPayments;

      sales.filter((s) => s.clientId === selectedEntityId).forEach((s) => {
        rows.push({
            date: s.date,
            type: t('sales.title'),
            reference: s.number,
            description: t('accounting.journalSale'),
            amount: s.totals.totalTTC,
            debit: s.totals.totalTTC,
            credit: 0 
        });
      });
      payments.filter((p) => p.clientId === selectedEntityId).forEach((p) => {
        rows.push({ 
            date: p.date, 
            type: t('cashbook.title'), 
            reference: p.reference, 
            description: t('cashbook.entryDetails'), 
            amount: -p.amount,
            debit: 0, 
            credit: p.amount 
        });
      });
    } else {
      const s = suppliers.find((x) => x.id === selectedEntityId);
      
      // Calculate opening balance from previous transactions
      const prevPurchases = purchasesBefore.filter(p => p.supplierId === selectedEntityId).reduce((sum, p) => sum + p.totals.totalTTC, 0);
      const prevPayments = paymentsBefore.filter(p => p.supplierId === selectedEntityId).reduce((sum, p) => sum + p.amount, 0);
      opening = prevPurchases - prevPayments;

      purchases.filter((pp) => pp.supplierId === selectedEntityId).forEach((pp) => {
        rows.push({ 
            date: pp.date, 
            type: t('purchases.title'), 
            reference: pp.number, 
            description: t('accounting.journalPurchase'), 
            amount: -pp.totals.totalTTC,
            debit: 0,
            credit: pp.totals.totalTTC 
        });
      });
      payments.filter((p) => p.supplierId === selectedEntityId).forEach((p) => {
        rows.push({ 
            date: p.date, 
            type: t('cashbook.title'), 
            reference: p.reference, 
            description: t('cashbook.entryDetails'), 
            amount: p.amount,
            debit: p.amount,
            credit: 0 
        });
      });
    }

    rows.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    let running = opening;
    rows.forEach((r) => {
      // For clients: Debit increases balance (Debt), Credit decreases it
      // For suppliers: Credit increases balance (Debt), Debit decreases it
      // However, here we track "Balance" from perspective of how much they owe us (Client) or we owe them (Supplier)?
      // Usually Statement shows running balance.
      // Client: Sale (Debit) -> Balance goes UP. Payment (Credit) -> Balance goes DOWN.
      // Supplier: Purchase (Credit) -> Balance goes UP. Payment (Debit) -> Balance goes DOWN.
      
      if (accountType === 'client') {
        running = running + r.debit - r.credit;
      } else {
        // For supplier statement, usually shown as "Amount we owe".
        // Purchase adds to what we owe. Payment subtracts.
        running = running + r.credit - r.debit;
      }
      r.balance = running;
    });

    return { opening, rows };ers, t, salesBefor, puchaseBeforepaymensBefore
  }, [accountType, selectedEntityId, sales, purchases, payments, clients, suppliers, t]);

  const exportStatementPDF = () => {
    if (!selectedEntityId) return;

    const transactions = statementData.rows.map(r => ({
      date: r.date,
      type: r.type,
      reference: r.reference,
      amount: accountType === 'client' ? (r.debit - r.credit) : (r.credit - r.debit), // Net effect on balance
      balance: r.balance
    }));

    const currentBalance = statementData.rows.length > 0 
      ? statementData.rows[statementData.rows.length - 1].balance 
      : 0;

    if (accountType === 'client') {
      const client = clients.find(c => c.id === selectedEntityId);
      if (client) {
        pdfService.generateClientStatementPDF(client, transactions, currentBalance);
      }
    } else {
      const supplier = suppliers.find(s => s.id === selectedEntityId);
      if (supplier) {
        pdfService.generateSupplierStatementPDF(supplier, transactions, currentBalance);
      }
    }
  };

  const exportStatementCSV = () => {
    const header = ['Date', 'Type', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'];
    const lines = statementData.rows.map((r) => [
      r.date,
      r.type,
      r.reference || '',
      (r.description || '').replace(/,/g, ' '),
      r.debit.toFixed(2),
      r.credit.toFixed(2),
      r.balance.toFixed(2),
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement_${accountType}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('accounting.accountStatements')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Select value={accountType} onValueChange={(v: 'client' | 'supplier') => { setAccountType(v); setSelectedEntityId(''); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">{t('accounting.accounts.clients')}</SelectItem>
              <SelectItem value="supplier">{t('accounting.accounts.suppliers')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder={accountType === 'client' ? t('accounting.selectClient') : t('accounting.selectSupplier')} />
            </SelectTrigger>
            <SelectContent>
              {(accountType === 'client' ? clients : suppliers).map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={exportStatementPDF} disabled={!selectedEntityId} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            {t('exportPDF')}
          </Button>
          <Button onClick={exportStatementCSV} disabled={!selectedEntityId} variant="outline">
            {t('exportCSV')}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('type')}</TableHead>
              <TableHead>{t('reference')}</TableHead>
              <TableHead>{t('description')}</TableHead>
              <TableHead className="text-right">{t('accounting.debit')}</TableHead>
              <TableHead className="text-right">{t('accounting.credit')}</TableHead>
              <TableHead className="text-right">{t('accounting.balance')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statementData.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {selectedEntityId ? t('noData') : t('accounting.selectEntity')}
                </TableCell>
              </TableRow>
            ) : (
              statementData.rows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{format(parseISO(row.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.reference}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell className="text-right">{row.debit.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{row.credit.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">{row.balance.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
