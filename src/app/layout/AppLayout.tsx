// =====================================
// App Layout - Main Layout Component
// =====================================

import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useAppStore } from '@/store/useAppStore';
import { useAlertSystem } from '@/hooks/useAlertSystem';
import { storageService } from '@/services/storage/storageService';
import { useAuth } from '@/contexts/AuthContext';

export const AppLayout: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { loadData, settings } = useAppStore();
  const [isReady, setIsReady] = useState(false);

  // Initialize alert system
  useAlertSystem(isReady);

  // Load data on mount
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      if (!user) {
        if (isMounted) setIsReady(false);
        return;
      }

      await storageService.initialize();
      loadData();

      if (isMounted) {
        setIsReady(true);
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [loadData, user]);

  // Set RTL direction based on language
  useEffect(() => {
    const isRtl = settings.language === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language || 'fr';
    
    if (settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n]);

  // Set theme
  useEffect(() => {
    const theme = settings.theme || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = (matches: boolean) => {
        document.documentElement.classList.toggle('dark', matches);
      };
      apply(media.matches);
      const listener = (e: MediaQueryListEvent) => apply(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  useEffect(() => {
    const color = settings.primaryColor || 'blue';
    const map: Record<string, string> = {
      blue: '217 91% 50%',
      green: '142 71% 45%',
      amber: '38 92% 50%',
      violet: '271 91% 50%',
      teal: '174 72% 41%',
      rose: '347 77% 60%',
      indigo: '231 83% 45%',
    };
    const hsl = map[color] || map.blue;
    document.documentElement.style.setProperty('--primary', hsl);
  }, [settings.primaryColor]);

  useEffect(() => {
    const presets = ['theme-corporate', 'theme-minimal', 'theme-vibrant', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-aurora', 'theme-royale', 'theme-citrus'];
    presets.forEach((c) => document.documentElement.classList.remove(c));
    const preset = settings.themePreset || 'corporate';
    document.documentElement.classList.add(`theme-${preset}`);
  }, [settings.themePreset]);

  useEffect(() => {
    const styles = ['cards-light', 'cards-glass', 'cards-dim'];
    styles.forEach((c) => document.documentElement.classList.remove(c));
    const brightness = settings.cardBrightness || 'light';
    document.documentElement.classList.add(`cards-${brightness}`);
  }, [settings.cardBrightness]);

  useEffect(() => {
    const navStyles = ['nav-dark', 'nav-light'];
    navStyles.forEach((c) => document.documentElement.classList.remove(c));
    const nav = settings.navigationTheme || 'dark';
    document.documentElement.classList.add(`nav-${nav}`);
  }, [settings.navigationTheme]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="text-sm text-muted-foreground">جارٍ تحميل البيانات...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-muted/40">
      <div className="flex min-h-screen max-w-7xl mx-auto">
        <AppSidebar />

        <div
          className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        >
          <AppHeader />

          <main
            className={`flex-1 p-6 md:p-8 overflow-auto app-background ${
              settings.backgroundGradient ? 'gradient-enabled' : ''
            } ${settings.backgroundPattern ? 'pattern-enabled' : ''}`}
          >
            <div className="grid gap-6 lg:gap-8">
              <section className="app-card rounded-2xl border shadow-sm p-4 md:p-6 lg:p-8 fade-in">
                <Outlet />
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
