import React from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { pdfService } from '@/services/pdf/pdfService';
import { JournalEntry, AccountKey } from '../types';

import { AccountSettings } from '@/core/types';

interface AccountingJournalProps {
  entries: JournalEntry[];
  accountSettings?: AccountSettings;
}

export const AccountingJournal: React.FC<AccountingJournalProps> = ({ entries, accountSettings }) => {
  const { t, i18n } = useTranslation();

  const getAccountCode = (key: AccountKey | string) => {
    if (!accountSettings) return key;
    switch (key) {
      case 'CLIENTS': return accountSettings.clientAccount;
      case 'FOURNISSEURS': return accountSettings.supplierAccount;
      case 'CAISSE': return accountSettings.cashAccount;
      case 'VENTES': return accountSettings.salesAccount;
      case 'ACHATS': return accountSettings.purchasesAccount;
      case 'TVA_COLLECTEE': return accountSettings.vatCollectedAccount;
      case 'TVA_DEDUCTIBLE': return accountSettings.vatDeductibleAccount;
      case 'BANQUE': return accountSettings.bankAccount;
      case 'DEPENSES_AUTRES': return '6111'; // Default or add to settings
      default: return key;
    }
  };

  const exportJournal = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    pdfService.generateJournalPDF(entries, format(new Date(), 'dd/MM/yyyy'));
  };

  const accountLabel = (key: AccountKey | string) => {
    switch (key) {
      case 'CLIENTS': return t('accounting.accounts.clients');
      case 'FOURNISSEURS': return t('accounting.accounts.suppliers');
      case 'CAISSE': return t('accounting.accounts.cash');
      case 'VENTES': return t('accounting.accounts.sales');
      case 'ACHATS': return t('accounting.accounts.purchases');
      case 'TVA_COLLECTEE': return t('accounting.accounts.vatCollected');
      case 'TVA_DEDUCTIBLE': return t('accounting.accounts.vatDeductible');
      case 'BANQUE': return 'Banque';
      case 'DEPENSES_AUTRES': return t('accounting.accounts.expenses');
      default: return key;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('accounting.journal')}</CardTitle>
        <div className="flex gap-2">
          <Button onClick={exportPDF} variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            {t('exportPDF')}
          </Button>
          <Button onClick={exportJournal} variant="outline" size="sm">
            {t('exportJSON')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">{t('date')}</TableHead>
              <TableHead className="text-primary-foreground">{t('status')}</TableHead>
              <TableHead className="text-primary-foreground">{t('notes')}</TableHead>
              <TableHead className="text-primary-foreground">{t('amount')} {t('currency')}</TableHead>
              <TableHead className="text-primary-foreground">{t('accounting.debitAccount')}</TableHead>
              <TableHead className="text-primary-foreground">{t('accounting.creditAccount')}</TableHead>
              <TableHead className="text-primary-foreground">{t('accounting.debitAccountCode')}</TableHead>
              <TableHead className="text-primary-foreground">{t('accounting.creditAccountCode')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {t('noData')}
                </TableCell>
              </TableRow>
            ) : (
              entries.map((e, idx) => (
                <TableRow key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                  <TableCell>{format(parseISO(e.date), i18n.language === 'fr' ? 'dd/MM/yyyy' : 'yyyy-MM-dd')}</TableCell>
                  <TableCell>{e.type}</TableCell>
                  <TableCell>
                    <div className="font-medium">{e.reference}</div>
                    <div className="text-xs text-muted-foreground">{e.description}</div>
                  </TableCell>
                  <TableCell className="font-mono">{e.debitAmount > 0 ? e.debitAmount.toFixed(2) : e.creditAmount.toFixed(2)}</TableCell>
                  <TableCell>{accountLabel(e.debitAmount > 0 ? e.debitAccount : '')}</TableCell>
                  <TableCell>{accountLabel(e.creditAmount > 0 ? e.creditAccount : '')}</TableCell>
                  <TableCell className="font-mono">{e.debitAmount > 0 ? getAccountCode(e.debitAccount, accountSettings) : ''}</TableCell>
                  <TableCell className="font-mono">{e.creditAmount > 0 ? getAccountCode(e.creditAccount, accountSettings) : ''}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
