import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { AccountSettings } from '@/core/types';

const defaultAccountSettings: AccountSettings = {
  salesAccount: '7111',
  purchasesAccount: '6111',
  vatCollectedAccount: '4455',
  vatDeductibleAccount: '3455',
  clientAccount: '3421',
  supplierAccount: '4411',
  cashAccount: '5161',
  bankAccount: '5141',
  expensesAccount: '6191'
};

export const AccountingSettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState<AccountSettings>(defaultAccountSettings);

  useEffect(() => {
    if (settings.accountSettings) {
      setLocalSettings(settings.accountSettings);
    }
  }, [settings.accountSettings]);

  const handleSave = () => {
    updateSettings({ accountSettings: localSettings });
  };

  const handleChange = (key: keyof AccountSettings, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('accounting.accountCode')} (Plan Comptable)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Ventes & Clients</h3>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label>{t('accounting.accounts.sales')} (7111)</Label>
              <Input value={localSettings.salesAccount} onChange={e => handleChange('salesAccount', e.target.value)} />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label>{t('accounting.accounts.clients')} (3421)</Label>
              <Input value={localSettings.clientAccount} onChange={e => handleChange('clientAccount', e.target.value)} />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label>{t('accounting.accounts.vatCollected')} (4455)</Label>
              <Input value={localSettings.vatCollectedAccount} onChange={e => handleChange('vatCollectedAccount', e.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Achats & Fournisseurs</h3>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label>{t('accounting.accounts.purchases')} (6111)</Label>
              <Input value={localSettings.purchasesAccount} onChange={e => handleChange('purchasesAccount', e.target.value)} />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label>{t('accounting.accounts.suppliers')} (4411)</Label>
              <Input value={localSettings.supplierAccount} onChange={e => handleChange('supplierAccount', e.target.value)} />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label>{t('accounting.accounts.vatDeductible')} (3455)</Label>
              <Input value={localSettings.vatDeductibleAccount} onChange={e => handleChange('vatDeductibleAccount', e.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Trésorerie</h3>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label>{t('accounting.accounts.cash')} (5161)</Label>
              <Input value={localSettings.cashAccount} onChange={e => handleChange('cashAccount', e.target.value)} />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label>Banque (5141)</Label>
              <Input value={localSettings.bankAccount} onChange={e => handleChange('bankAccount', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={handleSave}>{t('save')}</Button>
        </div>
      </CardContent>
    </Card>
  );
};
