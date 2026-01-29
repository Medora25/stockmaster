import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product, Category } from '@/core/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Package, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';

interface InventoryStatsProps {
  products: Product[];
  categories: Category[];
}

const InventoryStats: React.FC<InventoryStatsProps> = ({ products, categories }) => {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stockQuantity <= p.stockMin).length;
    const totalStockValue = products.reduce((sum, p) => sum + (p.stockQuantity * p.purchasePrice), 0);
    const totalPotentialSalesValue = products.reduce((sum, p) => sum + (p.stockQuantity * p.salePrice), 0);
    const potentialProfit = totalPotentialSalesValue - totalStockValue;

    return {
      totalProducts,
      lowStockProducts,
      totalStockValue,
      potentialProfit
    };
  }, [products]);

  const chartData = useMemo(() => {
    return categories.map(cat => {
      const catProducts = products.filter(p => p.categoryId === cat.id);
      const value = catProducts.reduce((sum, p) => sum + (p.stockQuantity * p.purchasePrice), 0);
      return {
        name: cat.name,
        value: value
      };
    }).filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 10); // Top 10 categories
  }, [products, categories]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('products.totalProducts')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('products.lowStockCount')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.lowStockProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('products.totalStockValue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStockValue.toFixed(2)} {t('common.currency')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('products.potentialProfit')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.potentialProfit.toFixed(2)} {t('common.currency')}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>{t('inventory.stockValueByCategory')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)} ${t('common.currency')}`, t('common.value')]}
                />
                <Bar dataKey="value" name={t('common.value')}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryStats;
