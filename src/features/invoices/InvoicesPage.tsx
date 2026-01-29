import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { storageService } from '@/services/storage/storageService';
import { Invoice } from '@/core/types';
import InvoiceStats from './components/InvoiceStats';
import InvoiceList from './components/InvoiceList';

const InvoicesPage: React.FC = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const loaded = storageService.loadCollection('invoices');
    // Sort by date descending
    loaded.sort((a: Invoice, b: Invoice) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setInvoices(loaded);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('invoices.title')}</h1>
          <p className="text-muted-foreground">
            {t('invoices.subtitle')}
          </p>
        </div>
        <Button asChild>
          <Link to="/invoices/new">
            <Plus className="me-2 h-4 w-4" />
            {t('invoices.addInvoice')}
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('invoices.overview')}</TabsTrigger>
          <TabsTrigger value="list">{t('invoices.allInvoices')}</TabsTrigger>
          <TabsTrigger value="unpaid">{t('invoices.unpaid')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <InvoiceStats invoices={invoices} />
          <div className="pt-4">
              <h3 className="text-lg font-medium mb-4">{t('dashboard.recentSales')}</h3>
              <InvoiceList data={invoices.slice(0, 5)} defaultFilter="all" />
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <InvoiceList data={invoices} defaultFilter="all" />
        </TabsContent>

        <TabsContent value="unpaid" className="space-y-4">
          <InvoiceList data={invoices} defaultFilter="unpaid" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvoicesPage;
