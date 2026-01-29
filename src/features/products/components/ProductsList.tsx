import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Edit, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Product, Category } from '@/core/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ProductsListProps {
  products: Product[];
  categories: Category[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const ProductsList: React.FC<ProductsListProps> = ({
  products,
  categories,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  sortBy,
  sortDir,
  onSort,
  page,
  pageSize,
  totalItems,
  onPageChange,
}) => {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = containerRef.current?.querySelector('div.relative.w-full.overflow-auto') as HTMLElement | null;
    setScrollEl(el || containerRef.current || null);
  }, [containerRef.current]);
  useEffect(() => {
    if (scrollEl) {
      scrollEl.style.maxHeight = '420px';
    }
  }, [scrollEl]);
  const rowVirtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => 64,
    overscan: 8,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 2,
    }).format(amount) + ' MAD';
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return '-';
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '-';
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px] text-center">
                <Checkbox 
                  checked={products.length > 0 && products.every(p => selectedIds.has(p.id))}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => onSort('name')}>
                <div className="flex items-center space-x-1">
                  <span>{t('products.name')}</span>
                  {sortBy === 'name' && (
                    sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => onSort('sku')}>
                <div className="flex items-center space-x-1">
                  <span>{t('products.sku')}</span>
                  {sortBy === 'sku' && (
                    sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => onSort('category')}>
                <div className="flex items-center space-x-1">
                  <span>{t('products.category')}</span>
                  {sortBy === 'category' && (
                    sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => onSort('price')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>{t('products.salePrice')}</span>
                  {sortBy === 'price' && (
                    sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => onSort('stock')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>{t('products.stockQuantity')}</span>
                  {sortBy === 'stock' && (
                    sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-center">{t('common.status')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {t('common.noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {virtualItems.length > 0 && (
                    <TableRow style={{ height: virtualItems[0].start, borderBottom: 0 }}>
                      <TableCell colSpan={8} />
                    </TableRow>
                  )}
                  {virtualItems.map((vi) => {
                    const product = products[vi.index];
                    return (
                  <motion.tr
                    key={product.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                    className="group hover:bg-muted/50"
                  >
                    <TableCell className="text-center">
                      <Checkbox 
                        checked={selectedIds.has(product.id)}
                        onCheckedChange={() => onToggleSelect(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{product.name}</span>
                        {product.nameAr && <span className="text-xs text-muted-foreground" dir="rtl">{product.nameAr}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {product.sku}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {getCategoryName(product.categoryId)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.salePrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {product.stockQuantity <= product.stockMin && (
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        )}
                        <span className={product.stockQuantity <= product.stockMin ? "text-orange-600 font-medium" : ""}>
                          {product.stockQuantity} {product.unit}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onEdit(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                    );
                  })}
                  {virtualItems.length > 0 && (
                    <TableRow style={{ height: totalSize - virtualItems[virtualItems.length - 1].end, borderBottom: 0 }}>
                      <TableCell colSpan={8} />
                    </TableRow>
                  )}
                </>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            {t('common.previous')}
          </Button>
          <div className="text-sm font-medium">
            Page {page} {t('common.of')} {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
};
