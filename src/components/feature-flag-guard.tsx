import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { FeatureFlags } from '@/core/types';
import { useToast } from '@/components/ui/use-toast';

interface FeatureFlagGuardProps {
  featureKey: keyof FeatureFlags;
}

const FeatureFlagGuard: React.FC<FeatureFlagGuardProps> = ({ featureKey }) => {
  const { settings } = useAppStore();
  const { t } = useTranslation();
  const { toast } = useToast();

  const isFeatureEnabled = settings?.features?.[featureKey] !== false;

  if (!isFeatureEnabled) {
    toast({
      title: t('messages.moduleDisabled'),
      description: t('messages.moduleDisabledDescription', { module: t(`nav.${featureKey}`) }),
      variant: 'destructive',
    });
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default FeatureFlagGuard;
