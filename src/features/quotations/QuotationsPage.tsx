import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { QuotationsList } from './components/QuotationsList';
import { QuotationsStats } from './components/QuotationsStats';

const QuotationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { quotations } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('quotations.title')}</h1>
        <Button asChild>
          <Link to="/quotations/new">
            <PlusCircle className="me-2 h-4 w-4" />
            {t('quotations.newQuotation')}
          </Link>
        </Button>
      </div>
      
      <QuotationsStats quotations={quotations} />
      
      <QuotationsList data={quotations} />
    </div>
  );
};

export default QuotationsPage;
