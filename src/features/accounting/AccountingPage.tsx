import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { endOfDay, isWithinInterval, parseISO, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AccountingSummary } from './components/AccountingSummary';
import { AccountingJournal } from './components/AccountingJournal';
import { AccountingTrialBalance } from './components/AccountingTrialBalance';
import { AccountingVATReport } from './components/AccountingVATReport';
import { AccountingStatements } from './components/AccountingStatements';
import { AccountingManualEntries } from './components/AccountingManualEntries';
import { AccountingSettingsTab } from './components/AccountingSettings';
import { AccountKey, JournalEntry } from './types';

const AccountingPage: React.FC = () => {
  const { t } = useTranslation();
  const { clients, suppliers, products, sales, purchases, recettes, payments, settings, manualEntries } = useAppStore();
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [fiscalYear, setFiscalYear] = useState<string>(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [drillDownAccount, setDrillDownAccount] = useState<AccountKey | string | null>(null);

  // Fiscal Year Logic
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
  }, []);

  useEffect(() => {
    if (fiscalYear) {
      setDateFrom(`${fiscalYear}-01-01`);
      setDateTo(`${fiscalYear}-12-31`);
    }
  }, [fiscalYear]);

  const isBeforeStart = (d: string) => {
    if (!dateFrom) return false;
    const date = parseISO(d);
    const start = parseISO(dateFrom);
    return date < start;
  };

  const isInRange = (d: string) => {
    if (!dateFrom && !dateTo) return true;
    const date = parseISO(d);
    const start = dateFrom ? parseISO(dateFrom) : undefined;
    const end = dateTo ? endOfDay(parseISO(dateTo)) : undefined;
    if (start && end) return isWithinInterval(date, { start, end });
    if (start) return date >= start;
    if (end) return date <= end;
    return true;
  };

  const matchBranch = (b?: string) => {
    if (!selectedBranch) return true;
    const current = b || settings.defaultBranch || '';
    return current === selectedBranch;
  };

  // Data for Opening Balances (Before Start Date)
  const salesBefore = useMemo(() => sales.filter((s) => isBeforeStart(s.date) && matchBranch(s.branch)), [sales, dateFrom, selectedBranch]);
  const purchasesBefore = useMemo(() => purchases.filter((p) => isBeforeStart(p.date) && matchBranch(p.branch)), [purchases, dateFrom, selectedBranch]);
  const recettesBefore = useMemo(() => recettes.filter((r) => isBeforeStart(r.dateTime) && matchBranch(r.branch)), [recettes, dateFrom, selectedBranch]);
  const paymentsBefore = useMemo(() => payments.filter((p) => isBeforeStart(p.date) && matchBranch(p.branch)), [payments, dateFrom, selectedBranch]);
  const manualEntriesBefore = useMemo(() => manualEntries.filter((e) => isBeforeStart(e.date) && matchBranch(e.branch)), [manualEntries, dateFrom, selectedBranch]);

  // Data for Journal (Within Range)
  const salesFiltered = useMemo(() => sales.filter((s) => isInRange(s.date) && matchBranch(s.branch)), [sales, dateFrom, dateTo, selectedBranch]);
  const purchasesFiltered = useMemo(() => purchases.filter((p) => isInRange(p.date) && matchBranch(p.branch)), [purchases, dateFrom, dateTo, selectedBranch]);
  const recettesFiltered = useMemo(() => recettes.filter((r) => isInRange(r.dateTime) && matchBranch(r.branch)), [recettes, dateFrom, dateTo, selectedBranch]);
  const paymentsFiltered = useMemo(() => payments.filter((p) => isInRange(p.date) && matchBranch(p.branch)), [payments, dateFrom, dateTo, selectedBranch]);
  const manualEntriesFiltered = useMemo(() => manualEntries.filter((e) => isInRange(e.date) && matchBranch(e.branch)), [manualEntries, dateFrom, dateTo, selectedBranch]);

  // Journal Entries & Opening Balances Calculation
  const { journalEntries, openingBalances } = useMemo(() => {
    const entries: JournalEntry[] = [];
    const opening: Record<string, number> = {};

    const addToOpening = (account: string, amount: number) => {
      // Determine if account is Balance Sheet (Keep) or P&L (Close to Result)
      // Known P&L keys
      const pnlKeys = ['VENTES', 'ACHATS', 'DEPENSES_AUTRES'];
      
      // Check if it's a P&L account
      let isPnL = pnlKeys.includes(account);
      
      // If it's a manual code (starts with 6, 7, 8)
      if (!isPnL && /^[678]/.test(account)) {
        isPnL = true;
      }

      if (isPnL) {
        // Accumulate to Retained Earnings (Resultat)
        // Credit (Income) increases Result (Credit balance)
        // Debit (Expense) decreases Result
        // We move the balance to Result.
        opening['RESULTAT_ANTERIEUR'] = (opening['RESULTAT_ANTERIEUR'] || 0) + amount;
      } else {
        // Balance Sheet account - Keep
        opening[account] = (opening[account] || 0) + amount;
      }
    };

    // 1. Calculate Opening Balances from "Before" data
    salesBefore.forEach((s) => {
      const debitAccount = s.isCredit ? 'CLIENTS' : 'CAISSE';
      if (s.totals.totalHT > 0) {
        // Debit Client/Caisse (Asset -> Keep)
        addToOpening(debitAccount, s.totals.totalHT);
        // Credit Sales (Income -> Close)
        addToOpening('VENTES', -s.totals.totalHT);
      }
      if (s.totals.totalTVA > 0) {
        addToOpening(debitAccount, s.totals.totalTVA);
        addToOpening('TVA_COLLECTEE', -s.totals.totalTVA); // Liability -> Keep
      }
    });

    purchasesBefore.forEach((p) => {
      const creditAccount = 'FOURNISSEURS';
      if (p.totals.totalHT > 0) {
        addToOpening('ACHATS', p.totals.totalHT); // Expense -> Close
        addToOpening(creditAccount, -p.totals.totalHT); // Liability -> Keep
      }
      if (p.totals.totalTVA > 0) {
        addToOpening('TVA_DEDUCTIBLE', p.totals.totalTVA); // Asset -> Keep
        addToOpening(creditAccount, -p.totals.totalTVA);
      }
    });

    recettesBefore.forEach((r) => {
      if (r.type === 'ENTREE') {
        addToOpening('CAISSE', r.amount);
        addToOpening(r.category === 'VENTE' ? 'VENTES' : 'DEPENSES_AUTRES', -r.amount);
      } else {
        addToOpening('DEPENSES_AUTRES', r.amount);
        addToOpening('CAISSE', -r.amount);
      }
    });
    
    manualEntriesBefore.forEach((e) => {
      addToOpening(e.debitAccount, e.amount);
      addToOpening(e.creditAccount, -e.amount);
    });

    paymentsBefore.forEach((p) => {
      const isBank = p.method !== 'cash';
      const cashAccount = isBank ? 'BANQUE' : 'CAISSE';
      
      if (p.clientId) {
        // Payment from Client: Debit Cash/Bank, Credit Client
        addToOpening(cashAccount, p.amount);
        addToOpening('CLIENTS', -p.amount);
      } else if (p.supplierId) {
        // Payment to Supplier: Debit Supplier, Credit Cash/Bank
        addToOpening('FOURNISSEURS', p.amount);
        addToOpening(cashAccount, -p.amount);
      }
    });

    // 2. Generate Journal Entries from "Filtered" data
    salesFiltered.forEach((s) => {
      const debitAccount: AccountKey = s.isCredit ? 'CLIENTS' : 'CAISSE';
      if (s.totals.totalHT > 0) {
        entries.push({
          date: s.date,
          type: t('sales.title'),
          reference: s.number,
          description: t('accounting.journalSale'),
          debitAccount,
          debitAmount: s.totals.totalHT,
          creditAccount: 'VENTES',
          creditAmount: s.totals.totalHT,
        });
      }
      if (s.totals.totalTVA > 0) {
        entries.push({
          date: s.date,
          type: t('sales.title'),
          reference: s.number,
          description: t('accounting.journalVatCollected'),
          debitAccount,
          debitAmount: s.totals.totalTVA,
          creditAccount: 'TVA_COLLECTEE',
          creditAmount: s.totals.totalTVA,
        });
      }
    });

    purchasesFiltered.forEach((p) => {
      const creditAccount: AccountKey = 'FOURNISSEURS';
      if (p.totals.totalHT > 0) {
        entries.push({
          date: p.date,
          type: t('purchases.title'),
          reference: p.number,
          description: t('accounting.journalPurchase'),
          debitAccount: 'ACHATS',
          debitAmount: p.totals.totalHT,
          creditAccount,
          creditAmount: p.totals.totalHT,
        });
      }
      if (p.totals.totalTVA > 0) {
        entries.push({
          date: p.date,
          type: t('purchases.title'),
          reference: p.number,
          description: t('accounting.journalVatDeductible'),
          debitAccount: 'TVA_DEDUCTIBLE',
          debitAmount: p.totals.totalTVA,
          creditAccount,
          creditAmount: p.totals.totalTVA,
        });
      }
    });

    recettesFiltered.forEach((r) => {
      if (r.type === 'ENTREE') {
        entries.push({
          date: r.dateTime,
          type: t('cashbook.title'),
          reference: r.referenceType || '',
          description: r.description || t('cashbook.entryDetails'),
          debitAccount: 'CAISSE',
          debitAmount: r.amount,
          creditAccount: r.category === 'VENTE' ? 'VENTES' : 'DEPENSES_AUTRES',
          creditAmount: r.amount,
        });
      } else {
        entries.push({
          date: r.dateTime,
          type: t('cashbook.title'),
          reference: r.referenceType || '',
          description: r.description || t('cashbook.entryDetails'),
          debitAccount: 'DEPENSES_AUTRES',
          debitAmount: r.amount,
          creditAccount: 'CAISSE',
          creditAmount: r.amount,
        });
      }
    });

    paymentsFiltered.forEach((p) => {
      const isBank = p.method !== 'cash';
      const cashAccount = isBank ? 'BANQUE' : 'CAISSE';
      
      if (p.clientId) {
        entries.push({
          date: p.date,
          type: t('cashbook.paiement_client'),
          reference: p.reference || '',
          description: p.notes || t('cashbook.paiement_client'),
          debitAccount: cashAccount,
          debitAmount: p.amount,
          creditAccount: 'CLIENTS',
          creditAmount: p.amount,
        });
      } else if (p.supplierId) {
        entries.push({
          date: p.date,
          type: t('cashbook.paiement_fournisseur'),
          reference: p.reference || '',
          description: p.notes || t('cashbook.paiement_fournisseur'),
          debitAccount: 'FOURNISSEURS',
          debitAmount: p.amount,
          creditAccount: cashAccount,
          creditAmount: p.amount,
        });
      }
    });

    // Add Manual Entries
    manualEntriesFiltered.forEach((e) => {
      entries.push({
        date: e.date,
        type: 'OD', // Opérations Diverses
        reference: e.reference,
        description: e.description,
        debitAccount: e.debitAccount as any,
        debitAmount: e.amount,
        creditAccount: e.creditAccount as any,
        creditAmount: e.amount,
      });
    });

    return { 
      journalEntries: entries.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()),
      openingBalances: opening
    };
  }, [salesBefore, purchasesBefore, recettesBefore, manualEntriesBefore, salesFiltered, purchasesFiltered, recettesFiltered, manualEntriesFiltered, t]);

  // Filter journal entries for drill-down
  const displayedJournalEntries = useMemo(() => {
    if (!drillDownAccount) return journalEntries;
    return journalEntries.filter(e => e.debitAccount === drillDownAccount || e.creditAccount === drillDownAccount);
  }, [journalEntries, drillDownAccount]);

  const handleDrillDown = (account: AccountKey) => {
    setDrillDownAccount(account);
    setActiveTab('journal');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="page-title">{t('accounting.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('filter')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Exercice (Année)</label>
            <Select value={fiscalYear} onValueChange={setFiscalYear}>
              <SelectTrigger>
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm">{t('accounting.dateFrom')}</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm">{t('accounting.dateTo')}</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm">{t('accounting.branch')}</label>
            <Select value={selectedBranch} onValueChange={(v) => setSelectedBranch(v === '__ALL__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">{t('all')}</SelectItem>
                {(settings.branches || []).map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="summary">{t('accounting.summary')}</TabsTrigger>
          <TabsTrigger value="journal">{t('accounting.journal')}</TabsTrigger>
          <TabsTrigger value="trial">{t('accounting.trialBalance')}</TabsTrigger>
          <TabsTrigger value="vat">{t('accounting.vatReport')}</TabsTrigger>
          <TabsTrigger value="statements">{t('accounting.accountStatements')}</TabsTrigger>
          <TabsTrigger value="manual">Saisie Manuelle (OD)</TabsTrigger>
          <TabsTrigger value="settings">Plan Comptable</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <AccountingSummary 
            sales={salesFiltered}
            purchases={purchasesFiltered}
            recettes={recettesFiltered}
            clients={clients}
            suppliers={suppliers}
            products={products}
          />
        </TabsContent>

        <TabsContent value="journal" className="mt-4">
          {drillDownAccount && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded flex justify-between items-center">
              <span>Filtre actif: Compte <strong>{drillDownAccount}</strong></span>
              <button onClick={() => setDrillDownAccount(null)} className="text-sm text-blue-600 underline">Effacer le filtre</button>
            </div>
          )}
          <AccountingJournal 
            entries={displayedJournalEntries} 
            accountSettings={settings.accountSettings}
          />
        </TabsContent>

        <TabsContent value="trial" className="mt-4">
          <AccountingTrialBalance 
            entries={journalEntries} 
            openingBalances={openingBalances}
            onAccountClick={handleDrillDown}
          />
        </TabsContent>

        <TabsContent value="vat" className="mt-4">
          <AccountingVATReport 
            sales={salesFiltered} 
            purchases={purchasesFiltered} 
          />
        </TabsContent>

        <TabsContent value="statements" className="mt-4">
          <AccountingStatements 
            clients={clients}
            suppliers={suppliers}
            sales={salesFiltered}
            purchases={purchasesFiltered}
            payments={paymentsFiltered}
            salesBefore={salesBefore}
            purchasesBefore={purchasesBefore}
            paymentsBefore={paymentsBefore}
          />
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <AccountingManualEntries />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <AccountingSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingPage;
