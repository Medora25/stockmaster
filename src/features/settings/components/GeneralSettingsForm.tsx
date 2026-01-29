import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/store/useAppStore';
import { auditService } from '@/services/audit/auditService';

export const GeneralSettingsForm: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useAppStore();

  const handleLanguageChange = (lang: 'fr' | 'ar') => {
    i18n.changeLanguage(lang);
    updateSettings({ language: lang });
    auditService.log('UPDATE', 'SETTINGS', 'LANGUAGE', `Language changed to ${lang}`);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    auditService.log('UPDATE', 'SETTINGS', 'THEME', `Theme changed to ${theme}`);
  };

  const handleThemePresetChange = (preset: 'corporate' | 'minimal' | 'vibrant' | 'ocean' | 'forest' | 'sunset' | 'aurora' | 'royale' | 'citrus') => {
    const primaryByPreset: Record<string, 'blue' | 'green' | 'amber' | 'violet' | 'teal' | 'rose' | 'indigo'> = {
      corporate: 'blue',
      minimal: settings.primaryColor || 'blue',
      vibrant: 'violet',
      ocean: 'blue',
      forest: 'green',
      sunset: 'amber',
      aurora: 'violet',
      royale: 'indigo',
      citrus: 'amber',
    };
    const nextPrimary = primaryByPreset[preset];
    updateSettings({ themePreset: preset, primaryColor: nextPrimary });
    auditService.log('UPDATE', 'SETTINGS', 'THEME_PRESET', `Theme preset changed to ${preset}`);
  };

  const handlePrimaryColorChange = (color: 'blue' | 'green' | 'amber' | 'violet' | 'teal' | 'rose' | 'indigo') => {
    updateSettings({ primaryColor: color });
    auditService.log('UPDATE', 'SETTINGS', 'PRIMARY_COLOR', `Primary color changed to ${color}`);
  };

  const handleNavigationThemeChange = (nav: 'dark' | 'light') => {
    updateSettings({ navigationTheme: nav });
  };

  const handleCardBrightnessChange = (mode: 'light' | 'glass' | 'dim') => {
    updateSettings({ cardBrightness: mode });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.language')}</CardTitle>
        <CardDescription>Langue et affichage de l'application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>{t('settings.language')}</Label>
          <Select value={settings.language || 'fr'} onValueChange={(v) => handleLanguageChange(v as 'fr' | 'ar')}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="ar">🇲🇦 العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('settings.theme')}</Label>
          <Select value={settings.theme || 'light'} onValueChange={(v) => handleThemeChange(v as 'light' | 'dark' | 'system')}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">☀️ Clair</SelectItem>
              <SelectItem value="dark">🌙 Sombre</SelectItem>
              <SelectItem value="system">💻 Système</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Thème prêt à l’emploi</Label>
          <Select value={settings.themePreset || 'corporate'} onValueChange={(v) => handleThemePresetChange(v as 'corporate' | 'minimal' | 'vibrant' | 'ocean' | 'forest' | 'sunset' | 'aurora' | 'royale' | 'citrus')}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="vibrant">Vibrant</SelectItem>
              <SelectItem value="ocean">Ocean</SelectItem>
              <SelectItem value="forest">Forest</SelectItem>
              <SelectItem value="sunset">Sunset</SelectItem>
              <SelectItem value="aurora">Aurora</SelectItem>
              <SelectItem value="royale">Royale</SelectItem>
              <SelectItem value="citrus">Citrus</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Thème du menu</Label>
          <Select value={settings.navigationTheme || 'dark'} onValueChange={(v) => handleNavigationThemeChange(v as 'dark' | 'light')}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">Sombre</SelectItem>
              <SelectItem value="light">Clair</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('settings.baseColor')}</Label>
          <Select value={settings.primaryColor || 'blue'} onValueChange={(v) => handlePrimaryColorChange(v as 'blue' | 'green' | 'amber' | 'violet' | 'teal' | 'rose' | 'indigo')}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue">Bleu</SelectItem>
              <SelectItem value="green">Vert</SelectItem>
              <SelectItem value="amber">Ambre</SelectItem>
              <SelectItem value="violet">Violet</SelectItem>
              <SelectItem value="teal">Turquoise</SelectItem>
              <SelectItem value="rose">Rose</SelectItem>
              <SelectItem value="indigo">Indigo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Style des cartes</Label>
          <Select value={settings.cardBrightness || 'light'} onValueChange={(v) => handleCardBrightnessChange(v as 'light' | 'glass' | 'dim')}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Standard</SelectItem>
              <SelectItem value="glass">Glassmorphism</SelectItem>
              <SelectItem value="dim">Mat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
