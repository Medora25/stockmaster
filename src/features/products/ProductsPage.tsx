import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Download, 
  Filter, 
  Trash2, 
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/useAppStore';
import { Product } from '@/core/types';
import { auditService } from '@/services/audit/auditService';
import { ProductForm } from './components/ProductForm';
import { ProductsList } from './components/ProductsList';
import { ProductsStats } from './components/ProductsStats';

export const ProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { products, categories, addProduct, updateProduct, deleteProduct } = useAppStore();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.toLowerCase().includes(query))
      );
    }

    if (categoryFilter && categoryFilter !== 'all') {
      result = result.filter((p) => p.categoryId === categoryFilter);
    }

    return result.sort((a, b) => {
      let valA: any = a[sortBy as keyof Product];
      let valB: any = b[sortBy as keyof Product];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, searchQuery, categoryFilter, sortBy, sortDir]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  // Handlers
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map(p => p.id)));
    }
  };

  const handleExport = () => {
    const headers = ['SKU', 'Name', 'Category', 'Purchase Price', 'Sale Price', 'Stock', 'Unit', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredProducts.map(p => {
        const category = categories.find(c => c.id === p.categoryId)?.name || '';
        return [
          p.sku,
          `"${p.name}"`,
          `"${category}"`,
          p.purchasePrice,
          p.salePrice,
          p.stockQuantity,
          p.unit,
          p.isActive ? 'Active' : 'Inactive'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    auditService.log('EXPORT', 'PRODUCT', undefined, 'Products list exported to CSV');
  };

  const handleSave = (data: any) => {
    if (productToEdit) {
      updateProduct(productToEdit.id, data);
      auditService.log('UPDATE', 'PRODUCT', productToEdit.id, `Product ${data.name} updated`);
      toast({ title: t('messages.updateSuccess', 'Produit mis à jour avec succès') });
    } else {
      // Add required fields for creation
      addProduct(data);
      auditService.log('CREATE', 'PRODUCT', undefined, `Product ${data.name} created`);
      toast({ title: t('messages.createSuccess', 'Produit créé avec succès') });
    }
    setIsFormOpen(false);
    setProductToEdit(null);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      auditService.log('DELETE', 'PRODUCT', productToDelete.id, `Product ${productToDelete.name} deleted`);
      toast({ title: t('messages.deleteSuccess', 'Produit supprimé avec succès') });
      setIsDeleteOpen(false);
      setProductToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    
    const count = selectedIds.size;
    selectedIds.forEach(id => deleteProduct(id));
    auditService.log('DELETE', 'PRODUCT', undefined, `Bulk delete of ${count} products`);
    
    toast({ title: t('messages.deleteSuccess', `${count} produits supprimés`) });
    setSelectedIds(new Set());
  };

  const handleBulkToggleStatus = () => {
    if (selectedIds.size === 0) return;

    selectedIds.forEach(id => {
      const product = products.find(p => p.id === id);
      if (product) {
        updateProduct(id, { isActive: !product.isActive });
      }
    });
    
    auditService.log('UPDATE', 'PRODUCT', undefined, `Bulk status toggle of ${selectedIds.size} products`);
    toast({ title: t('messages.updateSuccess', 'Statuts mis à jour') });
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('products.title')}</h1>
          <p className="text-muted-foreground">{t('products.subtitle', 'Gérez votre catalogue produits')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {t('common.export')}
          </Button>
          <Button onClick={() => { setProductToEdit(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            {t('products.addProduct')}
          </Button>
        </div>
      </div>

      <ProductsStats products={products} />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t('products.category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} {t('common.selected')}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="mr-2 h-4 w-4" />
                      {t('common.actions')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('common.bulkActions')}</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleBulkToggleStatus}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {t('common.toggleStatus')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <ProductsList
            products={paginatedProducts}
            categories={categories}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onEdit={(product) => { setProductToEdit(product); setIsFormOpen(true); }}
            onDelete={handleDeleteClick}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            page={page}
            pageSize={pageSize}
            totalItems={filteredProducts.length}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <ProductForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={productToEdit}
        onSubmit={handleSave}
        categories={categories}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsPage;
