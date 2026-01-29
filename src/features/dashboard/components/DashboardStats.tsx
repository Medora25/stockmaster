import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Wallet,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendValue, variant = 'default' }) => {
  const variantClasses = {
    default: 'bg-card',
    primary: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
    success: 'bg-gradient-to-br from-green-500 to-green-600 text-white',
    warning: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white',
    danger: 'bg-gradient-to-br from-red-500 to-red-600 text-white',
  };

  const iconClasses = {
    default: 'text-primary bg-primary/10',
    primary: 'text-white bg-white/20',
    success: 'text-white bg-white/20',
    warning: 'text-white bg-white/20',
    danger: 'text-white bg-white/20',
  };

  return (
    <Card className={`${variantClasses[variant]} border-none shadow-sm`}>
      <CardContent className="p-6 min-h-[132px]">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${variant === 'default' ? 'text-muted-foreground' : 'text-white/80'}`}>
              {title}
            </p>
            <div className="flex items-baseline gap-1 mt-2 w-full flex-wrap leading-tight">
              <span 
                className={`text-2xl md:text-3xl font-bold tabular-nums ${variant === 'default' ? 'text-foreground' : 'text-white'} max-w-full overflow-hidden text-ellipsis whitespace-nowrap`}
                title={value}
              >
                {value.replace(/\s*MAD\s*$/i, '').trim()}
              </span>
              <span className={`text-sm ${variant === 'default' ? 'text-muted-foreground' : 'text-white/80'} flex-shrink-0`}>
                MAD
              </span>
            </div>
            {trend && trendValue && (
              <div className={`flex items-center mt-2 text-sm ${variant === 'default' ? '' : 'text-white/80'}`}>
                {trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ml-4 flex-shrink-0 ${iconClasses[variant]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DashboardStatsProps {
  stockValue: number;
  monthlySales: number;
  monthlyPurchases: number;
  totalLiquidity: number;
  clientsDebt: number;
  monthlySalesTrendDirection?: 'up' | 'down';
  monthlySalesTrendLabel?: string;
  monthlyPurchasesTrendDirection?: 'up' | 'down';
  monthlyPurchasesTrendLabel?: string;
  estimatedProfit: number;
  monthlyProfitTrendDirection?: 'up' | 'down';
  monthlyProfitTrendLabel?: string;
}

const DashboardStatsComp: React.FC<DashboardStatsProps> = ({
  stockValue,
  monthlySales,
  monthlyPurchases,
  totalLiquidity,
  clientsDebt,
  monthlySalesTrendDirection,
  monthlySalesTrendLabel,
  monthlyPurchasesTrendDirection,
  monthlyPurchasesTrendLabel,
  estimatedProfit,
  monthlyProfitTrendDirection,
  monthlyProfitTrendLabel
}) => {
  const { t, i18n } = useTranslation();

  const formatAmount = (amount: number) => {
    const locale = i18n.language.startsWith('ar') ? 'ar-MA' : 'fr-FR';
    return new Intl.NumberFormat(locale, {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="grid grid-flow-row-dense grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
      <StatCard
        title={t('dashboard.monthlySales')}
        value={`${formatAmount(monthlySales)} MAD`}
        icon={TrendingUp}
        trend={monthlySalesTrendDirection}
        trendValue={monthlySalesTrendLabel}
        variant="success"
      />
      <StatCard
        title={t('dashboard.monthlyPurchases')}
        value={`${formatAmount(monthlyPurchases)} MAD`}
        icon={ShoppingCart}
        trend={monthlyPurchasesTrendDirection}
        trendValue={monthlyPurchasesTrendLabel}
        variant="warning"
      />
      <StatCard
        title={t('dashboard.estimatedProfit')}
        value={`${formatAmount(estimatedProfit)} MAD`}
        icon={DollarSign}
        trend={monthlyProfitTrendDirection}
        trendValue={monthlyProfitTrendLabel}
        variant={estimatedProfit < 0 ? 'danger' : estimatedProfit > 0 ? 'success' : 'default'}
      />
      <StatCard
        title={t('dashboard.totalLiquidity', 'Liquidité Totale')}
        value={`${formatAmount(totalLiquidity)} MAD`}
        icon={Wallet}
        variant="primary"
      />
      <StatCard
        title={t('dashboard.stockValue')}
        value={`${formatAmount(stockValue)} MAD`}
        icon={Package}
        variant="default"
      />
      <StatCard
        title={t('dashboard.clientsDebt')}
        value={`${formatAmount(clientsDebt)} MAD`}
        icon={Users}
        variant="danger"
      />
    </div>
  );
};

export const DashboardStats = React.memo(DashboardStatsComp);
