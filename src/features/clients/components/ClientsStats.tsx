import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Client, Sale, Invoice, Payment } from '@/core/types';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, UserCheck, TrendingUp, AlertTriangle, CreditCard, Wallet } from 'lucide-react';

interface ClientsStatsProps {
  clients: Client[];
  sales: Sale[];
  invoices: Invoice[];
  payments: Payment[];
}

export const ClientsStats: React.FC<ClientsStatsProps> = ({ clients, sales, invoices, payments }) => {
  const { t } = useTranslation();

  const activeCount = useMemo(() => clients.filter(c => c.isActive).length, [clients]);
  const totalDebt = useMemo(() => clients.reduce((sum, c) => sum + (c.debt || 0), 0), [clients]);
  const countCreditExceeded = useMemo(() => 
    clients.filter(c => (c.creditLimit || 0) > 0 && (c.debt || 0) > (c.creditLimit || 0)).length, 
  [clients]);

  const totalRevenue = useMemo(() => {
    const salesTotal = sales.reduce((sum, s) => sum + (s.totals?.totalTTC || 0), 0);
    const invoicesTotal = invoices.reduce((sum, i) => sum + (i.totals?.totalTTC || 0), 0);
    return salesTotal + invoicesTotal;
  }, [sales, invoices]);

  const totalPayments = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const collectionRate = useMemo(() => {
    if (totalRevenue <= 0) return 0;
    return Math.min(100, (totalPayments / totalRevenue) * 100);
  }, [totalPayments, totalRevenue]);

  const cityDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(c => {
      const city = c.city || t('common.notSpecified');
      counts[city] = (counts[city] || 0) + 1;
    });
    const entries = Object.entries(counts).map(([city, count]) => ({ city, count }));
    const sorted = entries.sort((a, b) => b.count - a.count);
    const top = sorted.slice(0, 6);
    const rest = sorted.slice(6).reduce((sum, item) => sum + item.count, 0);
    return rest > 0 ? [...top, { city: t('common.others'), count: rest }] : top;
  }, [clients, t]);

  const monthlyTrendData = useMemo(() => {
    const result: { month: string; revenue: number; payments: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const revenue =
        sales.filter(s => s.date.startsWith(key)).reduce((sum, s) => sum + (s.totals?.totalTTC || 0), 0) +
        invoices.filter(inv => inv.date.startsWith(key)).reduce((sum, inv) => sum + (inv.totals?.totalTTC || 0), 0);
      const paymentsTotal = payments.filter(p => p.date.startsWith(key)).reduce((sum, p) => sum + p.amount, 0);
      result.push({ month: key, revenue, payments: paymentsTotal });
    }
    return result;
  }, [sales, invoices, payments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 2,
    }).format(amount) + ` ${t('common.currency')}`;
  };

  const chartColors = ['#2563EB','#16A34A','#F59E0B','#DC2626','#7C3AED','#0891B2','#DB2777','#0EA5E9'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('clients.title')}</p>
              <h3 className="text-2xl font-bold">{clients.length}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('common.active')}</p>
              <h3 className="text-2xl font-bold">{activeCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('clients.debt')}</p>
              <h3 className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Taux de Recouvrement</p>
              <h3 className="text-2xl font-bold">{collectionRate.toFixed(1)}%</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendance Mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Bar dataKey="revenue" name="Chiffre d'affaires" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="payments" name="Paiements" fill="#16A34A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('clients.city')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cityDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="city"
                  >
                    {cityDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
