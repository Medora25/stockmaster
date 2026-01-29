// =====================================
// Settings Page - App Configuration
// =====================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  FileDigit, 
  Languages, 
  ToggleLeft,
  Database
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanySettingsForm } from './components/CompanySettingsForm';
import { NumberingSettingsForm } from './components/NumberingSettingsForm';
import { GeneralSettingsForm } from './components/GeneralSettingsForm';
import { FeaturesSettingsForm } from './components/FeaturesSettingsForm';
import { DataManagement } from './components/DataManagement';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.company')}</span>
          </TabsTrigger>
          <TabsTrigger value="numbering" className="gap-2">
            <FileDigit className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.numbering')}</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="gap-2">
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.language')}</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <ToggleLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.features')}</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.backup')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <CompanySettingsForm />
        </TabsContent>

        <TabsContent value="numbering">
          <NumberingSettingsForm />
        </TabsContent>

        <TabsContent value="language">
          <GeneralSettingsForm />
        </TabsContent>

        <TabsContent value="features">
          <FeaturesSettingsForm />
        </TabsContent>

        <TabsContent value="data">
          <DataManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
