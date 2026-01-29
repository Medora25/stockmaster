import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Printer, Truck, FileText, MoreHorizontal, Trash2, Search } from 'lucide-react';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Quotation, DocumentStatus } from '@/core/types';
import { pdfService } from '@/services/pdf/pdfService';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuotationsListProps {
  data: Quotation[];
}

export const QuotationsList: React.FC<QuotationsListProps> = ({ data = [] }) => {
  const { t, i18n } = useTranslation();
  const { convertQuotationToDelivery, convertQuotationToInvoice, deleteQuotation } = useAppStore();
  const { toast } = useToast();
  
  const safeData = data || [];

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const selectedIds = Object.keys(rowSelection);

  const handleDelete = () => {
    selectedIds.forEach(id => deleteQuotation(id));
    setRowSelection({});
    setShowDeleteDialog(false);
    toast({
      title: t('common.success'),
      description: t('common.deletedSuccessfully'),
    });
  };

  const handleExportPdf = () => {
    const selectedQuotations = safeData.filter(q => selectedIds.includes(q.id));
    if (selectedQuotations.length === 0) return;
    pdfService.generateQuotationsPDF(selectedQuotations);
  };

  const columns: ColumnDef<Quotation>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "number",
      header: t("quotations.table.number"),
      cell: ({ row }) => (
        <Link to={`/quotations/edit/${row.original.id}`} className="font-medium text-blue-600 hover:underline">
          {row.getValue("number")}
        </Link>
      ),
    },
    {
      accessorKey: "date",
      header: t("quotations.table.date"),
      cell: ({ row }) => format(new Date(row.getValue("date")), "dd/MM/yyyy", { locale: i18n.language === 'fr' ? fr : undefined }),
    },
    {
      accessorKey: "clientName",
      header: t("quotations.table.client"),
    },
    {
      accessorKey: "totals.totalTTC",
      header: t("quotations.table.total"),
      cell: ({ row }) => {
        const amount = parseFloat(row.original.totals.totalTTC.toString());
        return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
      },
    },
    {
      accessorKey: "status",
      header: t("quotations.table.status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as DocumentStatus;
        let variant: "default" | "secondary" | "destructive" | "outline" = "default";
        if (status === "validated") variant = "default"; // green-like usually handled by badge variant styles or custom class
        if (status === "draft") variant = "secondary";
        if (status === "cancelled") variant = "destructive";
        
        // Custom styling for validated to be green
        const className = status === 'validated' ? 'bg-green-100 text-green-800 hover:bg-green-100' : '';

        return <Badge variant={variant} className={className}>{t(`documentStatus.${status}`)}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const quotation = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/quotations/edit/${quotation.id}`}>
                  {t('common.edit')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => pdfService.generateQuotationPDF(quotation)}>
                <Printer className="mr-2 h-4 w-4" />
                {t('common.print')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const delivery = convertQuotationToDelivery(quotation.id);
                if (delivery) {
                  toast({
                    title: t('quotations.convertedDeliveryTitle'),
                    description: t('quotations.convertedDelivery', { number: delivery.number }),
                    action: (
                      <ToastAction altText={t('common.view')} asChild>
                        <Link to={`/deliveries/${delivery.id}`}>{t('common.view')}</Link>
                      </ToastAction>
                    ),
                  });
                }
              }}>
                <Truck className="mr-2 h-4 w-4" />
                {t('quotations.convertToDelivery')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const invoice = convertQuotationToInvoice(quotation.id);
                if (invoice) {
                  toast({
                    title: t('quotations.convertedInvoiceTitle'),
                    description: t('quotations.convertedInvoice', { number: invoice.number }),
                    action: (
                      <ToastAction altText={t('common.view')} asChild>
                        <Link to={`/invoices/${invoice.id}`}>{t('common.view')}</Link>
                      </ToastAction>
                    ),
                  });
                }
              }}>
                <FileText className="mr-2 h-4 w-4" />
                {t('quotations.convertToInvoice')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: safeData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={(table.getColumn("clientName")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("clientName")?.setFilterValue(event.target.value)
              }
              className="pl-8 max-w-sm"
            />
          </div>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <Printer className="mr-2 h-4 w-4" />
              {t('common.exportPdf')} ({selectedIds.length})
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.delete')} ({selectedIds.length})
            </Button>
          </div>
        )}
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {t('common.previous')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {t('common.next')}
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.deleteConfirmationMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
