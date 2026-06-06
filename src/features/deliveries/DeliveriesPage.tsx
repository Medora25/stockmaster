import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, PlusCircle, Printer } from 'lucide-react';
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
import { DeliveryNote, DocumentStatus } from '@/core/types/index';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

const DeliveriesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const deliveries = useAppStore((state) => state.deliveries);
  const convertDeliveryToInvoice = useAppStore((state) => state.convertDeliveryToInvoice);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleConvertToInvoice = (delivery: DeliveryNote) => {
    const invoice = convertDeliveryToInvoice(delivery.id);

    if (!invoice) {
      toast({
        title: t('common.error'),
        description: t('deliveries.convertToInvoiceUnavailable', 'Conversion indisponible pour ce bon de livraison.'),
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: t('common.success'),
      description: t('deliveries.convertedInvoice', { number: invoice.number }),
      action: (
        <ToastAction altText={t('common.view')} asChild>
          <Link to={`/invoices/edit/${invoice.id}`}>{t('common.view')}</Link>
        </ToastAction>
      ),
    });
  };

  const columns: ColumnDef<DeliveryNote>[] = [
    {
      accessorKey: "number",
      header: t("deliveries.table.number"),
      cell: ({ row }) => (
        <Link to={`/deliveries/${row.original.id}`} className="text-blue-600 hover:underline">
          {row.getValue("number")}
        </Link>
      ),
    },
    {
      accessorKey: "date",
      header: t("deliveries.table.date"),
      cell: ({ row }) => format(new Date(row.getValue("date")), "dd/MM/yyyy", { locale: i18n.language === 'fr' ? fr : undefined }),
    },
    {
      accessorKey: "clientName",
      header: t("deliveries.table.client"),
    },
    {
      accessorKey: "totals.totalTTC",
      header: t("deliveries.table.total"),
      cell: ({ row }) => `${row.original.totals.totalTTC.toFixed(2)} ${t('common.currency')}`,
    },
    {
      accessorKey: "status",
      header: t("deliveries.table.status"),
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
      id: "actions",
      header: t("common.actions"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link to={`/deliveries/edit/${row.original.id}`} className="text-blue-600 hover:underline">
            {t('common.edit')}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => pdfService.generateDeliveryPDF(row.original)}
            title={t('common.print')}
          >
            <Printer className="h-4 w-4" />
          </Button>
          {row.original.status === 'validated' && !row.original.convertedToInvoice && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConvertToInvoice(row.original)}
            >
              <FileText className="me-2 h-4 w-4" />
              {t('deliveries.convertToInvoice')}
            </Button>
          )}
          {row.original.convertedToInvoice && row.original.invoiceId && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/invoices/edit/${row.original.invoiceId}`}>
                <FileText className="me-2 h-4 w-4" />
                {t('common.view')}
              </Link>
            </Button>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: deliveries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const allSelected = useMemo(() => deliveries.length > 0 && selectedIds.length === deliveries.length, [deliveries, selectedIds]);
  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(deliveries.map(d => d.id));
    else setSelectedIds([]);
  };
  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };
  const exportPdfGrouped = () => {
    const list = selectedIds.length ? deliveries.filter(d => selectedIds.includes(d.id)) : deliveries;
    if (list.length === 0) return;
    pdfService.generateDeliveriesPDF(list);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('deliveries.title')}</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/deliveries/new">
              <PlusCircle className="me-2 h-4 w-4" />
              {t('deliveries.newDelivery')}
            </Link>
          </Button>
          <Button onClick={exportPdfGrouped}>
            <Printer className="me-2 h-4 w-4" />
            {t('common.exportPdf')}{selectedIds.length ? ` (${selectedIds.length})` : ''}
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead>
                  <div className="flex items-center justify-center">
                    <Checkbox checked={allSelected} onCheckedChange={(v) => toggleSelectAll(Boolean(v))} />
                  </div>
                </TableHead>
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
                <TableHead />
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
                  <TableCell className="w-12">
                    <div className="flex items-center justify-center">
                      <Checkbox 
                        checked={selectedIds.includes(row.original.id)} 
                        onCheckedChange={(v) => toggleSelectOne(row.original.id, Boolean(v))} 
                      />
                    </div>
                  </TableCell>
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

export default DeliveriesPage;
