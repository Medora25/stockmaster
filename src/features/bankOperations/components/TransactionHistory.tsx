import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { CashEntry, BankTransfer } from '@/core/types';
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, Download, Filter } from 'lucide-react';

interface TransactionHistoryProps {
  cashEntries: CashEntry[];
  transfers: BankTransfer[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ cashEntries, transfers }) => {
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  // Combine and sort transactions
  const allTransactions = React.useMemo(() => {
    const entries = cashEntries.map(entry => ({
      id: entry.id,
      date: entry.dateTime,
      type: entry.type === 'ENTREE' ? 'income' : 'expense',
      category: entry.category,
      amount: entry.amount,
      method: entry.method,
      description: entry.description,
      source: 'CASH_ENTRY' as const
    }));

    const bankTransfers = transfers.map(transfer => ({
      id: transfer.id,
      date: transfer.date || transfer.dateTime, // Handle both property names if needed, though type says dateTime
      type: 'transfer',
      category: 'TRANSFER',
      amount: transfer.amount,
      method: 'virement',
      description: `${t('bankOperations.transferTypes.' + (transfer.type === 'BANQUE_TO_BANQUE' ? 'banqueToBanque' : transfer.type === 'ESPECE_TO_BANQUE' ? 'especeToBanque' : transfer.type === 'BANQUE_TO_ESPECE' ? 'banqueToEspece' : 'chequeToBanque'))}`,
      source: 'TRANSFER' as const
    }));

    return [...entries, ...bankTransfers].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [cashEntries, transfers, t]);

  const filteredTransactions = React.useMemo(() => {
    return allTransactions.filter(tx => {
      // Date Filter
      if (dateFrom && new Date(tx.date) < new Date(dateFrom)) return false;
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        if (new Date(tx.date) > endDate) return false;
      }

      // Type Filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // Method Filter
      if (methodFilter !== 'all' && tx.method !== methodFilter) return false;

      return true;
    });
  }, [allTransactions, dateFrom, dateTo, typeFilter, methodFilter]);

  const handleExportCSV = () => {
    const headers = [
      t('common.date'),
      t('common.type'),
      t('common.description'),
      t('common.amount'),
      t('common.method')
    ];

    const rows = filteredTransactions.map(tx => [
      format(new Date(tx.date), 'dd/MM/yyyy HH:mm'),
      tx.type,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount.toFixed(2),
      tx.method
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowDownRight className="w-4 h-4 text-green-600" />;
      case 'expense':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      default:
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{t('bankOperations.history.title', 'Transaction History')}</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('common.filters')}:</span>
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder={t('common.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="income">{t('common.income')}</SelectItem>
              <SelectItem value="expense">{t('common.expense')}</SelectItem>
              <SelectItem value="transfer">{t('bankOperations.transfer')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder={t('common.method')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="cash">{t('bankOperations.paymentMethods.especes')}</SelectItem>
              <SelectItem value="cheque">{t('bankOperations.paymentMethods.cheque')}</SelectItem>
              <SelectItem value="virement">{t('bankOperations.paymentMethods.banque')}</SelectItem>
            </SelectContent>
          </Select>

          <Input 
            type="date" 
            value={dateFrom} 
            onChange={(e) => setDateFrom(e.target.value)} 
            className="w-auto"
          />
          <span className="text-muted-foreground">-</span>
          <Input 
            type="date" 
            value={dateTo} 
            onChange={(e) => setDateTo(e.target.value)} 
            className="w-auto"
          />
          
          {(typeFilter !== 'all' || methodFilter !== 'all' || dateFrom || dateTo) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setTypeFilter('all');
                setMethodFilter('all');
                setDateFrom('');
                setDateTo('');
              }}
            >
              {t('common.resetFilters')}
            </Button>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('common.type')}</TableHead>
                <TableHead>{t('common.description')}</TableHead>
                <TableHead>{t('common.amount')}</TableHead>
                <TableHead>{t('common.method')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={`${tx.source}-${tx.id}`}>
                    <TableCell>{format(new Date(tx.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getIcon(tx.type)}
                        <span className="capitalize">{
                          tx.type === 'income' ? t('common.income') : 
                          tx.type === 'expense' ? t('common.expense') : 
                          t('bankOperations.transfer')
                        }</span>
                      </div>
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-xs">
                        {tx.method}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
