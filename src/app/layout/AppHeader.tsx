// =====================================
// App Header - Top Navigation Bar
// =====================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  Sun, 
  Moon,
  Globe,
  User,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';

export const AppHeader: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { 
    settings, 
    alerts, 
    toggleSidebar, 
    updateSettings 
  } = useAppStore();

  const unreadAlerts = alerts.filter((a) => !a.isRead).length;

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  const toggleLanguage = () => {
    const newLang = settings.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
    updateSettings({ language: newLang });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 sticky top-0 z-30 flex items-center justify-between px-4 bg-card/70 backdrop-blur-md border-b border-border/30 shadow-sm">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="hidden md:block">
          <h1 className="font-semibold text-foreground">
            {settings.company?.name || t('app.name')}
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          title={settings.language === 'fr' ? 'العربية' : 'Français'}
        >
          <Globe className="w-5 h-5" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={settings.theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate('/alerts')}
        >
          <Bell className="w-5 h-5" />
          {unreadAlerts > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -end-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </Badge>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled>
              <User className="w-4 h-4 me-2" />
              {user?.email || 'Utilisateur'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="w-4 h-4 me-2" />
              {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 me-2" />
              {t('nav.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
