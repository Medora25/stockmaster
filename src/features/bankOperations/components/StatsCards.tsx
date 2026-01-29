import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Landmark, CheckSquare, ArrowRightLeft } from 'lucide-react';

interface StatsCardsProps {
  cashBalance: number;
  bankBalance: number;
  pendingChequesCount: number;
  pendingChequesAmount: number;
  totalTransfersAmount: number;
  totalTransfersCount: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  cashBalance,
  bankBalance,
  pendingChequesCount,
  pendingChequesAmount,
  totalTransfersAmount,
  totalTransfersCount
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('bankOperations.stats.cashBalance')}</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {cashBalance.toFixed(2)} {t('common.currency')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('bankOperations.stats.availableCash', 'Available in cash')}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('bankOperations.stats.bankBalance')}</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${bankBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {bankBalance.toFixed(2)} {t('common.currency')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('bankOperations.stats.estimatedBank', 'Estimated bank balance')}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('bankOperations.stats.pendingCheques')}</CardTitle>
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {pendingChequesCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingChequesAmount.toFixed(2)} {t('common.currency')}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('bankOperations.stats.totalTransfers')}</CardTitle>
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalTransfersAmount.toFixed(2)} {t('common.currency')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalTransfersCount} {t('bankOperations.stats.transactions', 'transactions')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
