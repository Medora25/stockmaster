import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle, ArrowUpCircle, ArrowDownCircle, Printer } from 'lucide-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from '@/components/ui/button';
import { pdfService } from '@/services/pdf/pdfService';
import { CashEntry, CashEntryType } from '@/core/types/index';
import { useAppStore } from '@/store/useAppStore';

const RecettesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const recettes = useAppStore((state) => state.recettes) as CashEntry[];
  const clients = useAppStore((state) => state.clients);
  const [view, setView] = useState<'ALL' | 'ENTREE' | 'SORTIE'>('ALL');

  const filtered = useMemo(() => {
    if (view === 'ALL') return recettes;
    return recettes.filter(r => r.type === view);
  }, [recettes, view]);

  const totalByMethod = useMemo(() => {
    const init = { cash: 0, cheque: 0, virement: 0, carte: 0 };
    filtered.forEach(r => {
      init[r.method] = (init[r.method] || 0) + r.amount * (r.type === 'ENTREE' ? 1 : -1);
    });
    return init;
  }, [filtered]);
  const totalExpenses = useMemo(() => {
    return recettes.filter(r => r.type === 'SORTIE').reduce((sum, r) => sum + r.amount, 0);
  }, [recettes]);
  const totalDebt = useMemo(() => {
    return clients.reduce((sum, c) => sum + (c.debt || 0), 0);
  }, [clients]);

  const columns: ColumnDef<CashEntry>[] = [
    {
      accessorKey: "dateTime",
      header: t("cashbook.table.date"),
      cell: ({ row }) => format(new Date(row.getValue("dateTime")), "dd/MM/yyyy HH:mm", { locale: i18n.language === 'fr' ? fr : undefined }),
    },
    {
      accessorKey: "type",
      header: t("cashbook.table.type"),
      cell: ({ row }) => {
        const type = row.getValue("type") as CashEntryType;
        return (
          <div className="flex items-center gap-2">
            {type === 'ENTREE' ? (
              <ArrowUpCircle className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
            )}
            <span>{t(`cashbook.${type.toLowerCase()}`)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: t("cashbook.table.category"),
      cell: ({ row }) => t(`cashbook.${row.original.category.toLowerCase()}`),
    },
    {
      accessorKey: "amount",
      header: t("cashbook.table.amount"),
      cell: ({ row }) => {
        const type = row.original.type;
        const amount = row.original.amount;
        return (
          <span className={type === 'ENTREE' ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
            {type === 'ENTREE' ? '+' : '-'}{amount.toFixed(2)} {t('common.currency')}
          </span>
        );
      },
    },
    {
      accessorKey: "description",
      header: t("cashbook.table.description"),
    },
    {
      id: "actions",
      header: t("common.actions"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link to={`/cashbook/edit/${row.original.id}`} className="text-blue-600 hover:underline">
            {t('common.edit')}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => pdfService.generateRecettePDF(row.original)}
            title={t('common.print')}
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('cashbook.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/cashbook/report">
              {t('cashbook.report')}
            </Link>
          </Button>
          <Button asChild>
            <Link to="/cashbook/new">
              <PlusCircle className="me-2 h-4 w-4" />
              {t('cashbook.addEntry')}
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/cashbook/new?preset=expense">
              <PlusCircle className="me-2 h-4 w-4" />
              {t('cashbook.addExpense')}
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">{t('sales.cash')}</div>
          <div className="font-bold">{totalByMethod.cash.toFixed(2)} {t('common.currency')}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">{t('sales.cheque')}</div>
          <div className="font-bold">{totalByMethod.cheque.toFixed(2)} {t('common.currency')}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">{t('sales.transfer')}</div>
          <div className="font-bold">{totalByMethod.virement.toFixed(2)} {t('common.currency')}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">{t('cashbook.debt')}</div>
          <div className="font-bold text-destructive">{totalDebt.toFixed(2)} {t('common.currency')}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">{t('cashbook.expensesTotal')}</div>
          <div className="font-bold">{totalExpenses.toFixed(2)} {t('common.currency')}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant={view === 'ALL' ? 'secondary' : 'outline'} onClick={() => setView('ALL')} className="rounded-full">{t('common.all')}</Button>
        <Button variant={view === 'ENTREE' ? 'secondary' : 'outline'} onClick={() => setView('ENTREE')} className="rounded-full">{t('cashbook.entree')}</Button>
        <Button variant={view === 'SORTIE' ? 'secondary' : 'outline'} onClick={() => setView('SORTIE')} className="rounded-full">{t('cashbook.sortie')}</Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('common.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RecettesPage;
