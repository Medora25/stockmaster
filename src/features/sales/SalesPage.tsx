import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle, Printer, Trash2 } from 'lucide-react';
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
import { storageService } from '@/services/storage/storageService';
import { pdfService } from '@/services/pdf/pdfService';
import { auditService } from '@/services/audit/auditService';
import { useToast } from '@/hooks/use-toast';
import { Sale, DocumentStatus } from '@/core/types/index';

const SalesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    const loadedSales = storageService.loadCollection('sales');
    setSales(loadedSales);
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm(t('common.confirmDelete'))) {
      const saleToDelete = sales.find(s => s.id === id);
      storageService.remove('sales', (sale) => sale.id === id);
      setSales(sales.filter(s => s.id !== id));
      
      if (saleToDelete) {
        auditService.log('DELETE', 'SALE', id, `Vente ${saleToDelete.number} supprimée`);
      }

      toast({
        title: t('common.success'),
        description: t('messages.deleteSuccess'),
      });
    }
  };

  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: "number",
      header: t("sales.table.number"),
      cell: ({ row }) => (
        <Link to={`/sales/${row.original.id}`} className="text-blue-600 hover:underline">
          {row.getValue("number")}
        </Link>
      ),
    },
    {
      accessorKey: "date",
      header: t("sales.table.date"),
      cell: ({ row }) => format(new Date(row.getValue("date")), "dd/MM/yyyy", { locale: i18n.language === 'fr' ? fr : undefined }),
    },
    {
      accessorKey: "clientName",
      header: t("sales.table.client"),
    },
    {
      accessorKey: "totals.totalTTC",
      header: t("sales.table.total"),
      cell: ({ row }) => `${row.original.totals.totalTTC.toFixed(2)} ${t('common.currency')}`,
    },
    {
      accessorKey: "status",
      header: t("sales.table.status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as DocumentStatus;
        let variant: "default" | "secondary" | "destructive" | "outline" = "default";
        if (status === "validated") variant = "default";
        if (status === "draft") variant = "secondary";
        if (status === "cancelled") variant = "destructive";
        return <Badge variant={variant}>{t(`documentStatus.${status}`)}</Badge>;
      },
    },
    {
      accessorKey: "paymentStatus",
      header: t("sales.table.paymentStatus"),
      cell: ({ row }) => {
        const status = row.getValue("paymentStatus") as string;
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        if (status === "paid") variant = "default";
        if (status === "unpaid") variant = "destructive";
        if (status === "partial") variant = "secondary";
        return <Badge variant={variant}>{t(`paymentStatus.${status}`)}</Badge>;
      },
    },
    {
      id: "actions",
      header: t("common.actions"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link to={`/sales/edit/${row.original.id}`} className="text-blue-600 hover:underline">
            {t('common.edit')}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => pdfService.generateSalePDF(row.original)}
            title={t('common.print')}
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleDelete(row.original.id)}
            className="text-destructive hover:text-destructive/90"
            title={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: sales,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('sales.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('sales.subtitle', { defaultValue: 'Suivi des ventes et impression des factures.' })}
          </p>
        </div>
        <Button asChild>
          <Link to="/sales/new">
            <PlusCircle className="me-2 h-4 w-4" />
            {t('sales.newSale')}
          </Link>
        </Button>
      </div>

      <div className="app-card rounded-2xl border shadow-sm">
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

export default SalesPage;
