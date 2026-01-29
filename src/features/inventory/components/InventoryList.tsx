import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product, Category } from '@/core/types';

interface InventoryListProps {
  products: Product[];
  categories: Category[];
}

const InventoryList: React.FC<InventoryListProps> = ({ products, categories }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const match = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const low = !showLowStock || p.stockQuantity <= p.stockMin;
      const cat = categoryFilter === 'all' || p.categoryId === categoryFilter;
      return match && low && cat;
    });
  }, [products, query, showLowStock, categoryFilter]);

  const allProductsSelected = filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length;

  const toggleSelectAllProducts = (checked: boolean) => {
    if (checked) setSelectedProductIds(filteredProducts.map(p => p.id));
    else setSelectedProductIds([]);
  };

  const toggleSelectProduct = (id: string, checked: boolean) => {
    setSelectedProductIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  const exportProductsCSV = () => {
    const list = selectedProductIds.length ? filteredProducts.filter(p => selectedProductIds.includes(p.id)) : filteredProducts;
    if (list.length === 0) return;
    
    // Audit log
    useAppStore.getState().addAuditLog(
      'EXPORT', 
      'product', 
      'bulk_export_csv', 
      `Export CSV de ${list.length} produits`
    );

    const rows = [
      ['Name', 'SKU', 'Category', 'Stock', 'StockMin', 'Unit'],
      ...list.map(p => [
        p.name,
        p.sku,
        categories.find(c => c.id === p.categoryId)?.name || '',
        p.stockQuantity,
        p.stockMin,
        p.unit || ''
      ])
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produits_${new Date().toISOString().slice(0,10)}${selectedProductIds.length ? `_sel${selectedProductIds.length}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('inventory.stockList')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative">
            <Input
              className="w-64"
              placeholder={t('common.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setShowLowStock((v) => !v)} className={showLowStock ? "bg-accent" : ""}>
            {showLowStock ? t('common.showAll') : t('inventory.showLowStock')}
          </Button>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('products.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1"></div>
          <Button variant="outline" onClick={exportProductsCSV}>
            {t('inventory.exportProductsCSV')}{selectedProductIds.length ? ` (${selectedProductIds.length})` : ''}
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">
                  <div className="flex items-center justify-center">
                    <Checkbox checked={allProductsSelected} onCheckedChange={(v) => toggleSelectAllProducts(Boolean(v))} />
                  </div>
                </TableHead>
                <TableHead>{t('products.name')}</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>{t('products.category')}</TableHead>
                <TableHead>{t('products.stock')}</TableHead>
                <TableHead>{t('products.stockMin')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="w-12">
                      <div className="flex items-center justify-center">
                        <Checkbox 
                          checked={selectedProductIds.includes(p.id)} 
                          onCheckedChange={(v) => toggleSelectProduct(p.id, Boolean(v))} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                    <TableCell>{categories.find(c => c.id === p.categoryId)?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.stockQuantity <= 0 ? 'destructive' :
                          p.stockQuantity <= p.stockMin ? 'secondary' :
                          'default'
                        }
                      >
                        {p.stockQuantity} {p.unit}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.stockMin}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryList;
