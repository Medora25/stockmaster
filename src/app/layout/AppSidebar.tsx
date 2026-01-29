// =====================================
// App Sidebar - Dynamic Navigation
// =====================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Package, 
  ShoppingCart, 
  FileText, 
  ClipboardList,
  Warehouse,
  Bell,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface NavItem {
  key: string;
  icon: React.ElementType;
  label: string;
  path: string;
  featureFlag?: string;
}

const navItems: NavItem[] = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'nav.dashboard', path: '/' },
  { key: 'clients', icon: Users, label: 'nav.clients', path: '/clients', featureFlag: 'clients' },
  { key: 'suppliers', icon: Truck, label: 'nav.suppliers', path: '/suppliers', featureFlag: 'suppliers' },
  { key: 'products', icon: Package, label: 'nav.products', path: '/products', featureFlag: 'products' },
  { key: 'categories', icon: FolderOpen, label: 'nav.categories', path: '/categories', featureFlag: 'products' },
  { key: 'purchases', icon: ShoppingCart, label: 'nav.purchases', path: '/purchases', featureFlag: 'bonAchat' },
  { key: 'deliveries', icon: FileText, label: 'nav.deliveries', path: '/deliveries', featureFlag: 'bonLivraison' },
  { key: 'quotations', icon: FileText, label: 'nav.quotations', path: '/quotations', featureFlag: 'devis' },
  { key: 'sales', icon: ClipboardList, label: 'nav.sales', path: '/sales', featureFlag: 'ventes' },
  { key: 'invoices', icon: FileText, label: 'nav.invoices', path: '/invoices', featureFlag: 'facturation' },
  { key: 'inventory', icon: Warehouse, label: 'nav.inventory', path: '/inventory', featureFlag: 'inventaire' },
  { key: 'alerts', icon: Bell, label: 'nav.alerts', path: '/alerts', featureFlag: 'alertes' },
  { key: 'cashbook', icon: Wallet, label: 'nav.cashbook', path: '/cashbook', featureFlag: 'recettes' },
  { key: 'bankOperations', icon: Calculator, label: 'nav.bankOperations', path: '/bank-operations', featureFlag: 'bankOperations' },
  { key: 'accounting', icon: Calculator, label: 'nav.accounting', path: '/accounting', featureFlag: 'accounting' },
  { key: 'audit', icon: ClipboardList, label: 'nav.audit', path: '/audit', featureFlag: 'parametres' },
  { key: 'settings', icon: Settings, label: 'nav.settings', path: '/settings', featureFlag: 'parametres' },
];

export const AppSidebar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { settings, sidebarOpen, toggleSidebar } = useAppStore();

  // Filter nav items based on feature flags
  const filteredNavItems = navItems.filter((item) => {
    if (!item.featureFlag) return true;
    return settings.features?.[item.featureFlag as keyof typeof settings.features] !== false;
  });

  const isRtl = settings.language === 'ar';

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'relative md:sticky md:top-4 h-auto md:h-[calc(100vh-2rem)] bg-gradient-to-b from-sidebar-accent to-sidebar-background text-sidebar-foreground z-40 flex flex-col backdrop-blur-md border border-sidebar-border/60 shadow-xl rounded-2xl m-3 md:m-4 transition-all duration-300 slide-in',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border/60">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">{t('app.name')}</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            {isRtl ? (
              sidebarOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />
            ) : (
              sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={cn(
                  'sidebar-item',
                  isActive && 'active',
                  !sidebarOpen && 'justify-center px-2'
                )}
                title={!sidebarOpen ? t(item.label) : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="truncate">{t(item.label)}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-sidebar-border/60">
            <div className="text-xs text-sidebar-foreground/60 text-center">
              v1.0.0 • {settings.company?.name || t('app.company')}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default AppSidebar;
