import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText } from 'lucide-react';
import { pdfService } from '@/services/pdf/pdfService';
import { JournalEntry, AccountKey } from '../types';
import { useAppStore } from '@/store/useAppStore';

interface AccountingTrialBalanceProps {
  entries: JournalEntry[];
  openingBalances?: Record<string, number>;
  onAccountClick?: (accountKey: AccountKey) => void;
}

export const AccountingTrialBalance: React.FC<AccountingTrialBalanceProps> = ({ entries, openingBalances = {}, onAccountClick }) => {
  const { t } = useTranslation();
  const { settings } = useAppStore();
  const accountSettings = settings.accountSettings;

  const getAccountCode = (key: string) => {
    if (!accountSettings) return '';
    switch (key) {
      case 'CLIENTS': return accountSettings.clientAccount;
      case 'FOURNISSEURS': return accountSettings.supplierAccount;
      case 'CAISSE': return accountSettings.cashAccount;
      case 'VENTES': return accountSettings.salesAccount;
      case 'ACHATS': return accountSettings.purchasesAccount;
      case 'TVA_COLLECTEE': return accountSettings.vatCollectedAccount;
      case 'TVA_DEDUCTIBLE': return accountSettings.vatDeductibleAccount;
      case 'BANQUE': return accountSettings.bankAccount;
      case 'RESULTAT_ANTERIEUR': return '1191';
      default: return key.match(/^\d+/) ? key.split(' ')[0] : '';
    }
  };

  const accountLabel = (key: AccountKey | string) => {
    const code = getAccountCode(key);
    let name = key;
    switch (key) {
      case 'CLIENTS': name = t('accounting.accounts.clients'); break;
      case 'FOURNISSEURS': name = t('accounting.accounts.suppliers'); break;
      case 'CAISSE': name = t('accounting.accounts.cash'); break;
      case 'VENTES': name = t('accounting.accounts.sales'); break;
      case 'ACHATS': name = t('accounting.accounts.purchases'); break;
      case 'TVA_COLLECTEE': name = t('accounting.accounts.vatCollected'); break;
      case 'TVA_DEDUCTIBLE': name = t('accounting.accounts.vatDeductible'); break;
      case 'BANQUE': name = 'Banque'; break;
      case 'DEPENSES_AUTRES': name = t('accounting.accounts.expenses'); break;
      case 'RESULTAT_ANTERIEUR': name = 'Report à Nouveau (Résultat Antérieur)'; break;
      default: name = key;
    }
    return code ? `${code} - ${name}` : name;
  };

  const trialBalance = useMemo(() => {
    const map = new Map<AccountKey, { debit: number; credit: number; opening: number }>();

    // Initialize with opening balances
    Object.entries(openingBalances).forEach(([key, val]) => {
      map.set(key as AccountKey, { debit: 0, credit: 0, opening: val });
    });

    const add = (key: AccountKey, field: 'debit' | 'credit', amount: number) => {
      const prev = map.get(key) || { debit: 0, credit: 0, opening: 0 };
      prev[field] += amount;
      map.set(key, prev);
    };
    entries.forEach((e) => {
      add(e.debitAccount, 'debit', e.debitAmount);
      add(e.creditAccount, 'credit', e.creditAmount);
    });
    return Array.from(map.entries()).map(([key, val]) => ({
      key,
      opening: val.opening,
      debit: val.debit,
      credit: val.credit,
      balance: val.opening + val.debit - val.credit,
    }));
  }, [entries, openingBalances]);

  const monthlyTrial = useMemo(() => {
    const map = new Map<string, { debit: number; credit: number }>();
    entries.forEach((e) => {
      const key = format(parseISO(e.date), 'yyyy-MM');
      const prev = map.get(key) || { debit: 0, credit: 0 };
      prev.debit += e.debitAmount;
      prev.credit += e.creditAmount;
      map.set(key, prev);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, val]) => ({
        month: key,
        debit: val.debit,
        credit: val.credit,
        balance: val.debit - val.credit,
      }));
  }, [entries]);

  const exportGeneralPDF = () => {
    const data = trialBalance.map(r => ({
      account: accountLabel(r.key),
      debit: r.debit,
      credit: r.credit,
      balance: r.balance
    }));
    pdfService.generateTrialBalancePDF(data, format(new Date(), 'dd/MM/yyyy'));
  };

  const exportMonthlyPDF = () => {
    const data = monthlyTrial.map(r => ({
      account: r.month,
      debit: r.debit,
      credit: r.credit,
      balance: r.balance
    }));
    pdfService.generateTrialBalancePDF(data, format(new Date(), 'yyyy'));
  };

  const exportMonthlyTrialCSV = () => {
    const header = ['Month', 'Debit', 'Credit', 'Balance'];
    const lines = monthlyTrial.map((r) => [r.month, r.debit.toFixed(2), r.credit.toFixed(2), (r.balance).toFixed(2)].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly_trial_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('accounting.trialBalance')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">{t('accounting.trialBalance')}</TabsTrigger>
            <TabsTrigger value="monthly">{t('accounting.monthlyTrialBalance')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="flex justify-end mb-4">
              <Button onClick={exportGeneralPDF} variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                {t('exportPDF')}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('accounting.account')}</TableHead>
                  <TableHead className="text-right">{t('openingBalance')}</TableHead>
                  <TableHead className="text-right">{t('accounting.debit')}</TableHead>
                  <TableHead className="text-right">{t('accounting.credit')}</TableHead>
                  <TableHead className="text-right">{t('accounting.balance')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trialBalance.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell>
                      <span 
                        className="cursor-pointer text-blue-600 hover:underline"
                        onClick={() => onAccountClick?.(row.key)}
                      >
                        {getAccountLabel(row.key, t, accountSettings)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.opening.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-red-600">{row.debit.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-green-600">{row.credit.toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-bold ${row.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.balance.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="monthly">
            <div className="flex gap-4 mb-4">
              <Button onClick={exportMonthlyTrialCSV} variant="outline">
                {t('exportCSV')}
              </Button>
              <Button onClick={exportMonthlyPDF} variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                {t('exportPDF')}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('month')}</TableHead>
                  <TableHead className="text-right">{t('accounting.debit')}</TableHead>
                  <TableHead className="text-right">{t('accounting.credit')}</TableHead>
                  <TableHead className="text-right">{t('accounting.balance')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyTrial.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell>{row.month}</TableCell>
                    <TableCell className="text-right">{row.debit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{row.credit.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold">{row.balance.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
