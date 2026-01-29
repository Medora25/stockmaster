import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Edit, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  MoreHorizontal,
  Phone,
  MapPin,
  CreditCard
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Supplier } from '@/core/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';

interface SuppliersListProps {
  suppliers: Supplier[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onViewProfile: (supplier: Supplier) => void;
  onAddPayment: (supplier: Supplier) => void;
  onGenerateStatement: (supplier: Supplier) => void;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (key: 'name' | 'phone' | 'city' | 'balance') => void;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const SuppliersList: React.FC<SuppliersListProps> = ({
  suppliers,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onViewProfile,
  onAddPayment,
  onGenerateStatement,
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
    count: suppliers.length,
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
                  checked={suppliers.length > 0 && suppliers.every(s => selectedIds.has(s.id))}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => onSort('name')}>
                <div className="flex items-center space-x-1">
                  <span>{t('suppliers.name')}</span>
                  {sortBy === 'name' && (
                    sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => onSort('phone')}>
                <div className="flex items-center space-x-1">
                  <span>{t('clients.phone')}</span>
                  {sortBy === 'phone' && (
                    sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => onSort('city')}>
                <div className="flex items-center space-x-1">
                  <span>{t('clients.city')}</span>
                  {sortBy === 'city' && (
                    sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => onSort('balance')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>{t('suppliers.balance')}</span>
                  {sortBy === 'balance' && (
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
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {t('common.noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {virtualItems.length > 0 && (
                    <TableRow style={{ height: virtualItems[0].start, borderBottom: 0 }}>
                      <TableCell colSpan={7} />
                    </TableRow>
                  )}
                  {virtualItems.map((vi) => {
                    const supplier = suppliers[vi.index];
                    return (
                  <motion.tr
                    key={supplier.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                    className="group hover:bg-muted/50"
                  >
                    <TableCell className="text-center">
                      <Checkbox 
                        checked={selectedIds.has(supplier.id)}
                        onCheckedChange={() => onToggleSelect(supplier.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{supplier.name}</span>
                        {supplier.ice && <span className="text-xs text-muted-foreground">ICE: {supplier.ice}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="mr-2 h-3 w-3" />
                        {supplier.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-3 w-3" />
                        {supplier.city || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`font-semibold ${supplier.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {formatCurrency(supplier.balance)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                        {supplier.isActive ? t('common.active') : t('common.inactive')}
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
                          <DropdownMenuItem onClick={() => onViewProfile(supplier)}>
                            <FileText className="mr-2 h-4 w-4" />
                            {t('common.details')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(supplier)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAddPayment(supplier)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {t('suppliers.addPayment')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onGenerateStatement(supplier)}>
                            <FileText className="mr-2 h-4 w-4" />
                            {t('clients.statement')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDelete(supplier)}
                            className="text-destructive focus:text-destructive"
                          >
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
                      <TableCell colSpan={7} />
                    </TableRow>
                  )}
                </>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {t('common.showing')} {suppliers.length} {t('common.of')} {totalItems}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            {t('common.previous')}
          </Button>
          <div className="text-sm font-medium">
            {page} / {totalPages}
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
      </div>
    </div>
  );
};
