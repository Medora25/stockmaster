import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Client } from '@/core/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, FileText, Clock, ArrowUpDown, Eye, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ClientsListProps {
  clients: Client[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onViewHistory: (client: Client) => void;
  onGenerateStatement: (client: Client) => void;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (key: 'name' | 'phone' | 'city' | 'debt') => void;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const ClientsList: React.FC<ClientsListProps> = ({
  clients,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onViewHistory,
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
    count: clients.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => 72,
    overscan: 6,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 2,
    }).format(amount) + ` ${t('common.currency')}`;
  };

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={clients.length > 0 && clients.every(c => selectedIds.has(c.id))}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSort('name')}>
                <div className="flex items-center gap-2">
                  {t('clients.name')}
                  {sortBy === 'name' && <ArrowUpDown className="h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSort('phone')}>
                <div className="flex items-center gap-2">
                  {t('clients.phone')}
                  {sortBy === 'phone' && <ArrowUpDown className="h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSort('city')}>
                <div className="flex items-center gap-2">
                  {t('clients.city')}
                  {sortBy === 'city' && <ArrowUpDown className="h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => onSort('debt')}>
                <div className="flex items-center justify-end gap-2">
                  {t('clients.debt')}
                  {sortBy === 'debt' && <ArrowUpDown className="h-4 w-4" />}
                </div>
              </TableHead>
              <TableHead className="text-center">{t('common.status')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                  const client = clients[vi.index];
                  return (
                <TableRow key={client.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.has(client.id)}
                      onCheckedChange={() => onToggleSelect(client.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                    {client.nameAr && <div className="text-xs text-muted-foreground font-arabic">{client.nameAr}</div>}
                    {client.email && <div className="text-xs text-muted-foreground">{client.email}</div>}
                  </TableCell>
                  <TableCell>
                    {client.phone ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {client.phone}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.city ? (
                      <Badge variant="outline" className="font-normal">
                        <MapPin className="h-3 w-3 mr-1" />
                        {client.city}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`font-bold ${(client.debt || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(client.debt || 0)}
                    </div>
                    {(client.creditLimit || 0) > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Max: {formatCurrency(client.creditLimit || 0)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={client.isActive ? 'default' : 'secondary'}>
                      {client.isActive ? t('common.active') : t('common.inactive')}
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
                        <DropdownMenuItem onClick={() => onEdit(client)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewHistory(client)}>
                          <Clock className="mr-2 h-4 w-4" />
                          Historique
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onGenerateStatement(client)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Relevé de compte
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(client)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                  );
                })}
                {virtualItems.length > 0 && (
                  <TableRow style={{ height: totalSize - virtualItems[virtualItems.length - 1].end, borderBottom: 0 }}>
                    <TableCell colSpan={7} />
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalItems > 0 ? (
            <>
              Affichage de {((page - 1) * pageSize) + 1} à {Math.min(page * pageSize, totalItems)} sur {totalItems} clients
            </>
          ) : (
            t('common.noResults')
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Précédent
          </Button>
          <div className="text-sm font-medium">
            Page {page} sur {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
};
