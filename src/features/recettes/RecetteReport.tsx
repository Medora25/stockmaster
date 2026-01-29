import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const mockCashbookEntries = [
  {
    id: '1',
    date: '2024-01-01',
    type: 'income',
    category: 'sale',
    amount: 1500.00,
    notes: 'Vente de produits X',
  },
  {
    id: '2',
    date: '2024-01-05',
    type: 'expense',
    category: 'otherExpense',
    amount: 200.00,
    notes: 'Achat de fournitures de bureau',
  },
  {
    id: '3',
    date: '2024-01-10',
    type: 'income',
    category: 'clientPayment',
    amount: 500.00,
    notes: 'Paiement client Y',
  },
];

const RecetteReport: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams(); // Could be used for specific report periods or filters

  // Calculate totals from mock data
  const totalIncome = mockCashbookEntries
    .filter((entry) => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalExpense = mockCashbookEntries
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to="/cashbook">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('common.back')}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{t('cashbook.reportTitle')}</h1>
        <Button variant="outline">
          <Printer className="me-2 h-4 w-4" />
          {t('common.print')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('cashbook.summary')}</CardTitle>
          <CardDescription>{t('cashbook.summaryDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
            <p className="text-lg font-semibold">{t('cashbook.totalIncome')}</p>
            <p className="text-2xl font-bold text-green-600">{totalIncome.toFixed(2)} {t('common.currency')}</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
            <p className="text-lg font-semibold">{t('cashbook.totalExpense')}</p>
            <p className="text-2xl font-bold text-red-600">{totalExpense.toFixed(2)} {t('common.currency')}</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
            <p className="text-lg font-semibold">{t('cashbook.balance')}</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance.toFixed(2)} {t('common.currency')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('cashbook.entries')}</CardTitle>
          <CardDescription>{t('cashbook.entriesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('cashbook.type')}</TableHead>
                <TableHead>{t('cashbook.category')}</TableHead>
                <TableHead>{t('common.notes')}</TableHead>
                <TableHead className="text-right">{t('common.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCashbookEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>
                    <Badge variant={entry.type === 'income' ? 'default' : 'destructive'}>
                      {t(`cashbook.${entry.type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>{t(`cashbook.${entry.category}`)}</TableCell>
                  <TableCell>{entry.notes}</TableCell>
                  <TableCell className="text-right">{entry.amount.toFixed(2)} {t('common.currency')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecetteReport;
