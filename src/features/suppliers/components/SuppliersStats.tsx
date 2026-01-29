import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Supplier, Purchase, Payment } from '@/core/types';

interface SuppliersStatsProps {
  suppliers: Supplier[];
  purchases: Purchase[];
  payments: Payment[];
}

export const SuppliersStats: React.FC<SuppliersStatsProps> = ({
  suppliers,
  purchases,
  payments,
}) => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 2,
    }).format(amount) + ' MAD';
  };

  const chartColors = ['#2563EB','#16A34A','#F59E0B','#DC2626','#7C3AED','#0891B2','#DB2777','#0EA5E9'];

  const totalPurchasesAmount = useMemo(() => {
    return (purchases || []).reduce((sum, p) => sum + (p.totals?.totalTTC || 0), 0);
  }, [purchases]);

  const totalPaymentsAmount = useMemo(() => {
    return (payments || []).reduce((sum, pm) => sum + pm.amount, 0);
  }, [payments]);

  const last30DaysPurchases = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return (purchases || [])
      .filter(p => new Date(p.date) >= thirtyDaysAgo)
      .reduce((sum, p) => sum + (p.totals?.totalTTC || 0), 0);
  }, [purchases]);

  const avgInvoicePerSupplier = useMemo(() => {
    const totalsBySupplier: Record<string, { total: number; count: number }> = {};
    (purchases || []).forEach((p) => {
      const id = p.supplierId;
      if (!id) return;
      if (!totalsBySupplier[id]) totalsBySupplier[id] = { total: 0, count: 0 };
      totalsBySupplier[id].total += p.totals?.totalTTC || 0;
      totalsBySupplier[id].count += 1;
    });
    const avgs = Object.values(totalsBySupplier).map((v) => (v.count > 0 ? v.total / v.count : 0));
    return avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : 0;
  }, [purchases]);

  const purchasesBySupplier = useMemo(() => {
    const totals: Record<string, { name: string; total: number }> = {};
    (purchases || []).forEach((p) => {
      const id = p.supplierId;
      if (!id) return;
      const name = suppliers.find((s) => s.id === id)?.name || id;
      if (!totals[id]) totals[id] = { name, total: 0 };
      totals[id].total += p.totals?.totalTTC || 0;
    });
    return Object.values(totals).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [purchases, suppliers]);

  const topBalanceSuppliers = useMemo(() => {
    return [...suppliers]
      .sort((a, b) => (b.balance || 0) - (a.balance || 0))
      .slice(0, 5)
      .map(s => ({ name: s.name, balance: s.balance || 0 }));
  }, [suppliers]);

  const suppliersByCity = useMemo(() => {
    const counts: Record<string, number> = {};
    suppliers.forEach((s) => {
      const city = s.city || 'Non spécifié';
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);
  }, [suppliers]);

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm bg-blue-50/50 dark:bg-blue-900/10">
          <div className="text-sm text-muted-foreground">Total des achats</div>
          <div className="text-xl font-bold text-blue-600">{formatCurrency(totalPurchasesAmount)}</div>
        </motion.div>
        <motion.div variants={itemVariants} className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm bg-green-50/50 dark:bg-green-900/10">
          <div className="text-sm text-muted-foreground">Total des paiements</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(totalPaymentsAmount)}</div>
        </motion.div>
        <motion.div variants={itemVariants} className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm bg-orange-50/50 dark:bg-orange-900/10">
          <div className="text-sm text-muted-foreground">Achats (30 derniers jours)</div>
          <div className="text-xl font-bold text-orange-600">{formatCurrency(last30DaysPurchases)}</div>
        </motion.div>
        <motion.div variants={itemVariants} className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm bg-purple-50/50 dark:bg-purple-900/10">
          <div className="text-sm text-muted-foreground">Facture moyenne</div>
          <div className="text-xl font-bold text-purple-600">{formatCurrency(avgInvoicePerSupplier)}</div>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="h-80 border rounded-xl p-4 bg-card">
          <h3 className="text-sm font-semibold mb-4">Achats par fournisseur (Top 8)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={purchasesBySupplier} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => `${Number(v).toFixed(2)} MAD`} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {purchasesBySupplier.map((_, idx) => (
                  <Cell key={`c-${idx}`} fill={chartColors[idx % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="h-80 border rounded-xl p-4 bg-card">
          <h3 className="text-sm font-semibold mb-4">Top 5 Fournisseurs par Solde</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topBalanceSuppliers}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => `${Number(v).toFixed(2)} MAD`} />
              <Bar dataKey="balance" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="h-80 border rounded-xl p-4 bg-card">
          <h3 className="text-sm font-semibold mb-4">Distribution par ville</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={suppliersByCity}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
              >
                {suppliersByCity.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {suppliersByCity.slice(0, 5).map((entry, index) => (
              <div key={entry.city} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                />
                <span className="text-xs text-muted-foreground">
                  {entry.city} ({entry.count})
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
