import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { FeatureFlags } from '@/core/types';
import { auditService } from '@/services/audit/auditService';

const featureKeys: (keyof FeatureFlags)[] = [
  'clients',
  'suppliers',
  'products',
  'achats',
  'bonAchat',
  'bonLivraison',
  'ventes',
  'devis',
  'facturation',
  'inventaire',
  'alertes',
  'recettes',
  'parametres',
  'promotions',
  'sav',
  'retours',
  'multiEntrepots',
  'pos',
  'bankOperations',
  'accounting',
];

export const FeaturesSettingsForm: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateFeatures } = useAppStore();

  const handleFeatureToggle = (key: keyof FeatureFlags, checked: boolean) => {
    updateFeatures({ [key]: checked });
    auditService.log('UPDATE', 'SETTINGS', 'FEATURE_FLAG', `Feature ${key} toggled to ${checked}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.features')}</CardTitle>
        <CardDescription>{t('settings.modulesDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureKeys.map((key) => (
            <div key={key} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
              <Switch
                id={`feature-${key}`}
                checked={settings.features?.[key] ?? false}
                onCheckedChange={(checked) => handleFeatureToggle(key, checked)}
              />
              <Label htmlFor={`feature-${key}`} className="flex-1 cursor-pointer font-medium">
                {t(`settings.featureLabels.${key}`)}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
