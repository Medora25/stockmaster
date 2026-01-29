import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Invoice } from '@/core/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';

interface InvoiceStatsProps {
  invoices: Invoice[];
}

const InvoiceStats: React.FC<InvoiceStatsProps> = ({ invoices }) => {
  const { t, i18n } = useTranslation();

  const stats = useMemo(() => {
    const totalSales = invoices
      .filter(i => i.status === 'validated')
      .reduce((acc, curr) => acc + curr.totals.totalTTC, 0);

    const unpaidInvoices = invoices.filter(i => i.paymentStatus !== 'paid' && i.status !== 'cancelled');
    const unpaidAmount = unpaidInvoices.reduce((acc, curr) => acc + (curr.totals.totalTTC - (curr.paidAmount || 0)), 0);
    const unpaidCount = unpaidInvoices.length;

    const cancelledAmount = invoices
      .filter(i => i.status === 'cancelled')
      .reduce((acc, curr) => acc + curr.totals.totalTTC, 0);

    // Prepare chart data (Last 6 months)
    const chartData = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = format(d, 'yyyy-MM');
      const monthLabel = format(d, 'MMM', { locale: i18n.language === 'ar' ? ar : fr });
      
      const monthlyTotal = invoices
        .filter(inv => inv.status === 'validated' && inv.date.startsWith(monthKey))
        .reduce((acc, inv) => acc + inv.totals.totalTTC, 0);

      chartData.push({
        name: monthLabel,
        total: monthlyTotal,
      });
    }

    return {
      totalSales,
      unpaidAmount,
      unpaidCount,
      cancelledAmount,
      chartData,
    };
  }, [invoices, i18n.language]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('invoices.stats.totalSales')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSales.toFixed(2)} {t('common.currency')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('invoices.stats.unpaidAmount')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.unpaidAmount.toFixed(2)} {t('common.currency')}</div>
          <p className="text-xs text-muted-foreground">
            {stats.unpaidCount} {t('invoices.stats.unpaidCount')}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('invoices.stats.cancelledAmount')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">{stats.cancelledAmount.toFixed(2)} {t('common.currency')}</div>
        </CardContent>
      </Card>
      
      <Card className="col-span-4 lg:col-span-4">
        <CardHeader>
          <CardTitle>{t('invoices.monthlySales')}</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={stats.chartData}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)} ${t('common.currency')}`, t('common.total')]}
                labelStyle={{ color: 'black' }}
              />
              <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceStats;
