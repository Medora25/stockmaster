import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AlertTriangle,
  Package,
  ArrowRight,
  Calculator
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/useAppStore';
import { storageService } from '@/services/storage/storageService';
import { BankAccount } from '@/core/types';
import { Alert } from '@/core/types';
import { DashboardStats } from './components/DashboardStats';
import { SalesOverviewChart } from './components/SalesOverviewChart';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { addDays, subDays, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { products, clients, sales, purchases, recettes, alerts, markAlertRead, markAllAlertsRead, settings } = useAppStore();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<'last7' | 'last30' | 'thisMonth' | 'custom'>('thisMonth');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  useEffect(() => {
    const loadedAccounts = storageService.loadCollection<BankAccount>('bankAccounts');
    if (loadedAccounts) setBankAccounts(loadedAccounts);
  }, []);

  const matchBranch = (itemBranch?: string) => {
    if (selectedBranch === "all") return true;
    return itemBranch === selectedBranch;
  };

  const getRange = () => {
    const today = new Date();
    if (timeframe === 'last7') {
      const end = today;
      const start = subDays(end, 6);
      return { start, end };
    }
    if (timeframe === 'last30') {
      const end = today;
      const start = subDays(end, 29);
      return { start, end };
    }
    if (timeframe === 'thisMonth') {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      return { start, end };
    }
    const start = customStart ? new Date(customStart) : startOfMonth(today);
    const end = customEnd ? new Date(customEnd) : endOfMonth(today);
    return { start, end };
  };

  const getPreviousRange = (current: { start: Date; end: Date }) => {
    const days = Math.ceil((current.end.getTime() - current.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const prevEnd = subDays(current.start, 1);
    const prevStart = subDays(prevEnd, days - 1);
    return { start: prevStart, end: prevEnd };
  };

  const {
    stockValue,
    clientsDebt,
    monthlySales,
    monthlyPurchases,
    previousMonthlySales,
    previousMonthlyPurchases,
    estimatedProfit,
    previousEstimatedProfit,
    cashBalance,
    bankBalance,
    totalLiquidity,
    lowStockProducts,
    unreadAlerts,
    filteredSales,
    filteredPurchases,
    monthlySalesSparkline,
    monthlyPurchasesSparkline,
    profitSparkline
  } = useMemo(() => {
    const range = getRange();
    const prevRange = getPreviousRange(range);
    const stockValueCalc = products.reduce((sum, p) => sum + (p.stockQuantity * p.purchasePrice), 0);
    const clientsDebtCalc = clients.reduce((sum, c) => sum + c.debt, 0);
    const monthlySalesCalc = sales
      .filter((s) => s.status === 'validated' && matchBranch(s.branch) && isWithinInterval(parseISO(s.date), { start: range.start, end: range.end }))
      .reduce((sum, s) => sum + s.totals.totalTTC, 0);
    const monthlyPurchasesCalc = purchases
      .filter((p) => p.status === 'validated' && matchBranch(p.branch) && isWithinInterval(parseISO(p.date), { start: range.start, end: range.end }))
      .reduce((sum, p) => sum + p.totals.totalTTC, 0);
    const previousMonthlySalesCalc = sales
      .filter((s) => s.status === 'validated' && matchBranch(s.branch) && isWithinInterval(parseISO(s.date), { start: prevRange.start, end: prevRange.end }))
      .reduce((sum, s) => sum + s.totals.totalTTC, 0);
    const previousMonthlyPurchasesCalc = purchases
      .filter((p) => p.status === 'validated' && matchBranch(p.branch) && isWithinInterval(parseISO(p.date), { start: prevRange.start, end: prevRange.end }))
      .reduce((sum, p) => sum + p.totals.totalTTC, 0);
    const monthlySalesData = sales
      .filter((s) => s.status === 'validated' && matchBranch(s.branch) && isWithinInterval(parseISO(s.date), { start: range.start, end: range.end }));
    const monthlySalesHT = monthlySalesData.reduce((sum, s) => sum + s.totals.totalHT, 0);
    const monthlyCOGS = monthlySalesData.reduce((totalCOGS, sale) => {
      const saleCOGS = sale.lines.reduce((lineSum, line) => {
        const product = products.find(p => p.id === line.productId);
        const cost = product ? product.purchasePrice : 0;
        return lineSum + (cost * line.quantity);
      }, 0);
      return totalCOGS + saleCOGS;
    }, 0);
    const monthlyExpenses = recettes
      .filter((r) => r.type === 'SORTIE' && matchBranch(r.branch) && r.category !== 'PAIEMENT_FOURNISSEUR' && isWithinInterval(parseISO(r.dateTime), { start: range.start, end: range.end }))
      .reduce((sum, r) => sum + r.amount, 0);
    const estimatedProfitCalc = monthlySalesHT - monthlyCOGS - monthlyExpenses;
    const previousMonthlySalesData = sales
      .filter((s) => s.status === 'validated' && matchBranch(s.branch) && isWithinInterval(parseISO(s.date), { start: prevRange.start, end: prevRange.end }));
    const previousMonthlySalesHT = previousMonthlySalesData.reduce((sum, s) => sum + s.totals.totalHT, 0);
    const previousMonthlyCOGS = previousMonthlySalesData.reduce((totalCOGS, sale) => {
      const saleCOGS = sale.lines.reduce((lineSum, line) => {
        const product = products.find(p => p.id === line.productId);
        const cost = product ? product.purchasePrice : 0;
        return lineSum + (cost * line.quantity);
      }, 0);
      return totalCOGS + saleCOGS;
    }, 0);
    const previousMonthlyExpenses = recettes
      .filter((r) => r.type === 'SORTIE' && matchBranch(r.branch) && r.category !== 'PAIEMENT_FOURNISSEUR' && isWithinInterval(parseISO(r.dateTime), { start: prevRange.start, end: prevRange.end }))
      .reduce((sum, r) => sum + r.amount, 0);
    const previousEstimatedProfitCalc = previousMonthlySalesHT - previousMonthlyCOGS - previousMonthlyExpenses;
    const cashIncome = recettes
      .filter((r) => r.type === 'ENTREE' && matchBranch(r.branch))
      .reduce((sum, r) => sum + r.amount, 0);
    const cashExpense = recettes
      .filter((r) => r.type === 'SORTIE' && matchBranch(r.branch))
      .reduce((sum, r) => sum + r.amount, 0);
    const cashBalanceCalc = cashIncome - cashExpense;
    const bankBalanceCalc = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
    const totalLiquidityCalc = cashBalanceCalc + bankBalanceCalc;
    const lowStockProductsCalc = products.filter((p) => p.stockQuantity <= p.stockMin);
    const unreadAlertsCalc = alerts.filter((a) => !a.isRead);
    const filteredSalesCalc = sales.filter(s => matchBranch(s.branch) && s.status === 'validated' && isWithinInterval(parseISO(s.date), { start: range.start, end: range.end }));
    const filteredPurchasesCalc = purchases.filter(p => matchBranch(p.branch) && p.status === 'validated' && isWithinInterval(parseISO(p.date), { start: range.start, end: range.end }));
    const days = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const sparkSales: number[] = Array.from({ length: days }, (_, i) => {
      const d = addDays(range.start, i);
      const total = monthlySalesData
        .filter(s => parseISO(s.date).toDateString() === d.toDateString())
        .reduce((sum, s) => sum + s.totals.totalTTC, 0);
      return total;
    });
    const sparkPurchases: number[] = Array.from({ length: days }, (_, i) => {
      const d = addDays(range.start, i);
      const total = filteredPurchasesCalc
        .filter(p => parseISO(p.date).toDateString() === d.toDateString())
        .reduce((sum, p) => sum + p.totals.totalTTC, 0);
      return total;
    });
    const sparkProfit: number[] = Array.from({ length: days }, (_, i) => {
      const d = addDays(range.start, i);
      const salesDay = monthlySalesData
        .filter(s => parseISO(s.date).toDateString() === d.toDateString())
        .reduce((sum, s) => sum + s.totals.totalHT, 0);
      const cogsDay = monthlySalesData
        .filter(s => parseISO(s.date).toDateString() === d.toDateString())
        .reduce((totalCOGS, sale) => {
          const saleCOGS = sale.lines.reduce((lineSum, line) => {
            const product = products.find(p => p.id === line.productId);
            const cost = product ? product.purchasePrice : 0;
            return lineSum + (cost * line.quantity);
          }, 0);
          return totalCOGS + saleCOGS;
        }, 0);
      const expensesDay = recettes
        .filter(r => r.type === 'SORTIE' && matchBranch(r.branch) && isWithinInterval(parseISO(r.dateTime), { start: d, end: d }))
        .reduce((sum, r) => sum + r.amount, 0);
      return salesDay - cogsDay - expensesDay;
    });
    return {
      stockValue: stockValueCalc,
      clientsDebt: clientsDebtCalc,
      monthlySales: monthlySalesCalc,
      monthlyPurchases: monthlyPurchasesCalc,
      previousMonthlySales: previousMonthlySalesCalc,
      previousMonthlyPurchases: previousMonthlyPurchasesCalc,
      estimatedProfit: estimatedProfitCalc,
      previousEstimatedProfit: previousEstimatedProfitCalc,
      cashBalance: cashBalanceCalc,
      bankBalance: bankBalanceCalc,
      totalLiquidity: totalLiquidityCalc,
      lowStockProducts: lowStockProductsCalc,
      unreadAlerts: unreadAlertsCalc,
      filteredSales: filteredSalesCalc,
      filteredPurchases: filteredPurchasesCalc,
      monthlySalesSparkline: sparkSales,
      monthlyPurchasesSparkline: sparkPurchases,
      profitSparkline: sparkProfit
    };
  }, [products, clients, sales, purchases, recettes, bankAccounts, selectedBranch, timeframe, customStart, customEnd]);
  
  const computeTrend = (current: number, previous: number) => {
    if (!previous || previous <= 0) {
      return { direction: undefined as undefined | 'up' | 'down', label: undefined as string | undefined };
    }
    const diff = current - previous;
    if (diff === 0) {
      return { direction: undefined as undefined | 'up' | 'down', label: undefined as string | undefined };
    }
    const percent = (diff / previous) * 100;
    const direction: 'up' | 'down' = diff > 0 ? 'up' : 'down';
    const label = `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;
    return { direction, label };
  };
  
  const salesTrend = computeTrend(monthlySales, previousMonthlySales);
  const purchasesTrend = computeTrend(monthlyPurchases, previousMonthlyPurchases);
  const profitTrend = computeTrend(estimatedProfit, previousEstimatedProfit);

  const handleAlertClick = (alert: Alert) => {
    if (alert.referenceType && alert.referenceId) {
      if (alert.referenceType === 'product') {
        navigate('/inventory');
      } else if (alert.referenceType === 'invoice') {
        navigate('/invoices');
      } else if (alert.referenceType === 'client') {
        navigate('/clients');
      }
    }
    if (!alert.isRead) {
      markAlertRead(alert.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.subtitle', 'Overview of your business performance')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(settings.branches && settings.branches.length > 0) && (
             <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('dashboard.branch')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.allBranches')}</SelectItem>
                {settings.branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center gap-1">
            <Button variant={timeframe === 'last7' ? 'default' : 'outline'} size="sm" onClick={() => setTimeframe('last7')}>{t('dashboard.last7Days', '7 jours')}</Button>
            <Button variant={timeframe === 'last30' ? 'default' : 'outline'} size="sm" onClick={() => setTimeframe('last30')}>{t('dashboard.last30Days', '30 jours')}</Button>
            <Button variant={timeframe === 'thisMonth' ? 'default' : 'outline'} size="sm" onClick={() => setTimeframe('thisMonth')}>{t('dashboard.thisMonth', 'Ce mois')}</Button>
            <Button variant={timeframe === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => setTimeframe('custom')}>{t('dashboard.custom', 'Personnalisé')}</Button>
          </div>
          {timeframe === 'custom' && (
            <div className="flex items-center gap-2">
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-[160px]" />
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-[160px]" />
            </div>
          )}

          {settings.features?.accounting && (
            <Button variant="outline" onClick={() => navigate('/accounting')}>
              <Calculator className="w-4 h-4 mr-2" />
              {t('dashboard.accountingSummary')}
            </Button>
          )}

          <Button onClick={() => navigate('/sales/new')}>
            {t('nav.sales')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/products')}>
            {t('nav.products')}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStats 
        stockValue={stockValue}
        monthlySales={monthlySales}
        monthlyPurchases={monthlyPurchases}
        totalLiquidity={totalLiquidity}
        clientsDebt={clientsDebt}
        monthlySalesTrendDirection={salesTrend.direction}
        monthlySalesTrendLabel={salesTrend.label}
        monthlyPurchasesTrendDirection={purchasesTrend.direction}
        monthlyPurchasesTrendLabel={purchasesTrend.label}
        estimatedProfit={estimatedProfit}
        monthlyProfitTrendDirection={profitTrend.direction}
        monthlyProfitTrendLabel={profitTrend.label}
        monthlySalesSparkline={monthlySalesSparkline}
        monthlyPurchasesSparkline={monthlyPurchasesSparkline}
        profitSparkline={profitSparkline}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart */}
        <SalesOverviewChart sales={filteredSales} purchases={filteredPurchases} />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">{t('dashboard.liquidityBreakdown', 'تفصيل السيولة')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { name: t('dashboard.cash', 'نقد'), value: cashBalance },
                    { name: t('dashboard.bank', 'بنك'), value: bankBalance }
                  ]} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    <Cell fill="#22c55e" />
                    <Cell fill="#3b82f6" />
                  </Pie>
                  <Tooltip formatter={(value: number) => new Intl.NumberFormat(i18n.language.startsWith('ar') ? 'ar-MA' : 'fr-MA', { style: 'currency', currency: 'MAD' }).format(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts & Low Stock */}
        <div className="space-y-6">
          
          {/* Low Stock Products */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base font-medium">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  {t('dashboard.lowStock')}
                </div>
                <Badge variant="outline">{lowStockProducts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  {t('common.noData')}
                </p>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div 
                      key={product.id} 
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <Badge variant={product.stockQuantity <= 0 ? 'destructive' : 'secondary'}>
                        {product.stockQuantity} / {product.stockMin}
                      </Badge>
                    </div>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <Button 
                      variant="ghost" 
                      className="w-full text-xs" 
                      onClick={() => navigate('/products')}
                    >
                      {t('common.showAll')} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base font-medium">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  {t('dashboard.recentAlerts')}
                </div>
                <Badge variant="outline">{unreadAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unreadAlerts.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  {t('common.noData')}
                </p>
              ) : (
                <div className="space-y-4">
                  {unreadAlerts.slice(0, 5).map((alert) => (
                    <div 
                      key={alert.id} 
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => handleAlertClick(alert)}
                    >
                      <AlertTriangle 
                        className={`w-4 h-4 mt-0.5 ${
                          alert.type === 'critical' ? 'text-destructive' : 
                          alert.type === 'warning' ? 'text-warning' : 'text-blue-500'
                        }`} 
                      />
                      <div className="space-y-1">
                        <p className="text-sm text-foreground leading-none">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/alerts')}
                    >
                      {t('common.showAll')}
                    </Button>
                    {unreadAlerts.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAllAlertsRead()}
                      >
                        {t('alerts.markAllRead')}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
