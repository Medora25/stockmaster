import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowSelectionState,
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
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Printer, Search, DollarSign, Receipt, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { pdfService } from '@/services/pdf/pdfService';
import { Purchase, DocumentStatus, PaymentStatus } from '@/core/types/index';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/store/useAppStore';

export const PurchasesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const purchases = useAppStore((state) => state.purchases) as Purchase[];
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [query, setQuery] = useState('');

  const selectedIds = useMemo(() => Object.keys(rowSelection), [rowSelection]);

  const filteredPurchases = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter((p) =>
      [p.number, p.supplierName].filter(Boolean).some((v) => v!.toLowerCase().includes(q))
    );
  }, [query, purchases]);

  const stats = useMemo(() => {
    const totalPurchases = purchases.length;
    const totalAmount = purchases.reduce((sum, p) => sum + p.totals.totalTTC, 0);
    const paidAmount = purchases.filter(p => p.paymentStatus === 'paid').reduce((sum, p) => sum + p.totals.totalTTC, 0);
    const unpaidAmount = purchases.filter(p => p.paymentStatus === 'unpaid').reduce((sum, p) => sum + p.totals.totalTTC, 0);

    return { totalPurchases, totalAmount, paidAmount, unpaidAmount };
  }, [purchases]);

  const columns: ColumnDef<Purchase>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
      header: t("purchases.table.number"),
      cell: ({ row }) => (
        <Link to={`/purchases/${row.original.id}`} className="text-blue-600 hover:underline">
          {row.getValue("number")}
        </Link>
      ),
    },
    {
      accessorKey: "date",
      header: t("purchases.table.date"),
      cell: ({ row }) => format(new Date(row.getValue("date")), "dd/MM/yyyy", { locale: i18n.language === 'fr' ? fr : undefined }),
    },
    {
      accessorKey: "supplierName",
      header: t("purchases.table.supplier"),
    },
    {
      accessorKey: "totals.totalTTC",
      header: t("purchases.table.total"),
      cell: ({ row }) => `${row.original.totals.totalTTC.toFixed(2)} ${t('common.currency')}`,
    },
    {
      accessorKey: "status",
      header: t("purchases.table.status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as DocumentStatus;
        let variant: "default" | "secondary" | "destructive" | "outline" = "default";
        if (status === "validated") variant = "default";
        if (status === "draft") variant = "secondary";
        if (status === "cancelled") variant = "destructive";
        return <Badge variant={variant} className="rounded-lg px-2.5 py-0.5">{t(`documentStatus.${status}`)}</Badge>;
      },
    },
    {
      accessorKey: "paymentStatus",
      header: t("purchases.table.paymentStatus"),
      cell: ({ row }) => {
        const paymentStatus = row.getValue("paymentStatus") as PaymentStatus;
        let variant: "default" | "secondary" | "destructive" | "outline" = "default";
        if (paymentStatus === "paid") variant = "default";
        if (paymentStatus === "partial") variant = "secondary";
        if (paymentStatus === "unpaid") variant = "destructive";
        return <Badge variant={variant} className="rounded-lg px-2.5 py-0.5">{t(`paymentStatus.${paymentStatus}`)}</Badge>;
      },
    },
    {
      id: "actions",
      header: t("common.actions"),
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/purchases/edit/${row.original.id}`} className="h-8 w-8 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center">
            {t('common.edit')}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => pdfService.generatePurchasePDF(row.original)}
            title={t('common.print')}
            className="h-8 w-8 rounded-lg text-green-500 hover:text-green-600 hover:bg-green-50"
          >
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredPurchases,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    getRowId: (row) => row.id,
  });

  const exportPdfGrouped = () => {
    const list = selectedIds.length ? purchases.filter(p => selectedIds.includes(p.id)) : purchases;
    if (list.length === 0) return;
    pdfService.generatePurchasesPDF(list);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold tracking-tight"
        >
          {t('purchases.title')}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button asChild className="rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-300">
            <Link to="/purchases/new">
              <PlusCircle className="me-2 h-4 w-4" />
              {t('purchases.newPurchase')}
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('purchases.totalPurchases'), value: stats.totalPurchases, icon: Receipt, color: 'blue' },
          { label: t('purchases.totalAmount'), value: `${stats.totalAmount.toFixed(2)} ${t('common.currency')}`, icon: DollarSign, color: 'green' },
          { label: t('purchases.paidAmount'), value: `${stats.paidAmount.toFixed(2)} ${t('common.currency')}`, icon: CheckCircle, color: 'emerald' },
          { label: t('purchases.unpaidAmount'), value: `${stats.unpaidAmount.toFixed(2)} ${t('common.currency')}`, icon: XCircle, color: 'red' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl bg-primary/10`}>
                    <stat.icon className={`w-5 h-5 text-primary`} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <h3 className="text-xl font-bold mt-1">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search & Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="p-4 bg-muted/30 border-b border-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="ps-9 rounded-xl border-muted-foreground/20 focus:ring-primary/20 bg-background h-10"
              placeholder={t('common.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={exportPdfGrouped} className="rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-300">
            <Printer className="me-2 h-4 w-4" />
            {t('common.exportPdf')}
            {selectedIds.length > 0 && ` (${selectedIds.length})`}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50 border-none">
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
              <AnimatePresence mode="popLayout">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-primary/5 transition-colors border-muted/20 h-16"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>{t('common.noData')}</p>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default PurchasesPage;
