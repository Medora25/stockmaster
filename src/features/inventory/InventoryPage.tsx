import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, Package, History } from 'lucide-react';
import InventoryStats from './components/InventoryStats';
import InventoryList from './components/InventoryList';
import InventoryMovements from './components/InventoryMovements';
import StockAdjustmentDialog from './components/StockAdjustmentDialog';

const InventoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { products, stockMovements, categories } = useAppStore();
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('inventory.title')}</h1>
          <p className="text-muted-foreground">
            {t('inventory.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button onClick={() => setIsAdjustmentOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('inventory.stockAdjustment')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            {t('inventory.overview')}
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            {t('inventory.stockList')}
          </TabsTrigger>
          <TabsTrigger value="movements">
            <History className="mr-2 h-4 w-4" />
            {t('inventory.movements')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <InventoryStats products={products} categories={categories} />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
           <InventoryList products={products} categories={categories} />
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <InventoryMovements stockMovements={stockMovements} />
        </TabsContent>
      </Tabs>

      <StockAdjustmentDialog 
        open={isAdjustmentOpen} 
        onOpenChange={setIsAdjustmentOpen} 
        products={products}
      />
    </motion.div>
  );
};

export default InventoryPage;
