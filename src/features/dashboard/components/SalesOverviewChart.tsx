import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Sale, Purchase } from '@/core/types';
import { startOfMonth, format, parseISO } from 'date-fns';
import { fr, ar } from 'date-fns/locale';

interface SalesOverviewChartProps {
  sales: Sale[];
  purchases: Purchase[];
}

const SalesOverviewChartComp: React.FC<SalesOverviewChartProps> = ({ sales, purchases }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const data = React.useMemo(() => {
    const map: Record<string, { label: string; sales: number; purchases: number; sortKey: number }> = {};
    const locale = isRTL ? ar : fr;
    const addEntry = (keyLabel: string, sortKey: number, type: 'sales' | 'purchases', amount: number) => {
      if (!map[keyLabel]) map[keyLabel] = { label: keyLabel, sales: 0, purchases: 0, sortKey };
      map[keyLabel][type] += amount;
    };
    sales.forEach(sale => {
      if (sale.status === 'validated') {
        const d = parseISO(sale.date);
        const start = startOfMonth(d).getTime();
        const label = format(d, 'MMM', { locale });
        addEntry(label, start, 'sales', sale.totals.totalTTC);
      }
    });
    purchases.forEach(purchase => {
      if (purchase.status === 'validated') {
        const d = parseISO(purchase.date);
        const start = startOfMonth(d).getTime();
        const label = format(d, 'MMM', { locale });
        addEntry(label, start, 'purchases', purchase.totals.totalTTC);
      }
    });
    return Object.values(map).sort((a, b) => a.sortKey - b.sortKey);
  }, [sales, purchases, isRTL]);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('dashboard.salesOverview', 'Aperçu des ventes et achats')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => {
                  const locale = i18n.language.startsWith('ar') ? 'ar-MA' : 'fr-MA';
                  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'MAD' }).format(value);
                }}
              />
              <Legend />
              <Bar dataKey="sales" name={t('dashboard.sales')} fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="purchases" name={t('dashboard.purchases')} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const SalesOverviewChart = React.memo(SalesOverviewChartComp);
