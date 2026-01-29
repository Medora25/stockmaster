import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { AlertType } from '@/core/types';

export const useAlertSystem = () => {
  const { t } = useTranslation();
  const { 
    products, 
    invoices, 
    alerts, 
    addAlert, 
    settings 
  } = useAppStore();

  useEffect(() => {
    // Only run if alerts feature is enabled
    if (!settings?.features?.alertes) return;

    // 1. Check Low Stock
    products.forEach(product => {
      if (product.isActive && product.stockQuantity <= product.stockMin) {
        // Check if alert already exists
        const exists = alerts.some(a => 
          a.referenceId === product.id && 
          a.type === 'stock_rupture' &&
          !a.isRead
        );

        const duplicate = alerts.some(a => a.referenceId === product.id && a.type === 'stock_rupture');

        if (!duplicate) {
          addAlert({
            type: 'stock_rupture',
            priority: product.stockQuantity <= 0 ? 'critical' : 'high',
            title: t('alerts.lowStock'),
            message: `${t('alerts.lowStock')}: ${product.name} (${product.stockQuantity} / ${product.stockMin})`,
            isRead: false,
            referenceType: 'product',
            referenceId: product.id,
          });
        }
      }
    });
  }, [products, invoices, alerts, settings?.features?.alertes, addAlert, t]);
};
