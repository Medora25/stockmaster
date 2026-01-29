import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Quotation } from '@/core/types';
import { FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface QuotationsStatsProps {
  quotations: Quotation[];
}

export const QuotationsStats: React.FC<QuotationsStatsProps> = ({ quotations = [] }) => {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    if (!quotations) return {
      total: 0,
      totalAmount: 0,
      draftCount: 0,
      validatedCount: 0,
      cancelledCount: 0
    };

    const total = quotations.length;
    const totalAmount = quotations.reduce((sum, q) => sum + (q.totals.totalTTC || 0), 0);
    const draftCount = quotations.filter(q => q.status === 'draft').length;
    const validatedCount = quotations.filter(q => q.status === 'validated').length;
    const cancelledCount = quotations.filter(q => q.status === 'cancelled').length;

    return {
      total,
      totalAmount,
      draftCount,
      validatedCount,
      cancelledCount
    };
  }, [quotations]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ` ${t('common.currency')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('quotations.title')}</p>
            <h3 className="text-2xl font-bold">{stats.total}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats.totalAmount)}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('documentStatus.draft')}</p>
            <h3 className="text-2xl font-bold">{stats.draftCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <Clock className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('documentStatus.validated')}</p>
            <h3 className="text-2xl font-bold">{stats.validatedCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('documentStatus.cancelled')}</p>
            <h3 className="text-2xl font-bold">{stats.cancelledCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <XCircle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
