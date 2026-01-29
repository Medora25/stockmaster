import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Product } from '@/core/types';

interface ProductsStatsProps {
  products: Product[];
}

export const ProductsStats: React.FC<ProductsStatsProps> = ({ products }) => {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter(p => p.stockQuantity <= p.stockMin).length;
    const totalPurchaseValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.stockQuantity), 0);
    const totalSaleValue = products.reduce((sum, p) => sum + (p.salePrice * p.stockQuantity), 0);
    const potentialProfit = totalSaleValue - totalPurchaseValue;

    return { total, lowStock, totalPurchaseValue, totalSaleValue, potentialProfit };
  }, [products]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 2,
    }).format(amount) + ' MAD';
  };

  const statItems = [
    { label: t('products.totalProducts'), value: stats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: t('products.lowStockCount'), value: stats.lowStock, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: t('products.totalStockValue'), value: formatCurrency(stats.totalPurchaseValue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { label: t('products.potentialProfit'), value: formatCurrency(stats.potentialProfit), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-xl font-bold mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
