import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Printer, Copy, Trash2, Download } from 'lucide-react';
import { Invoice, DocumentStatus, PaymentStatus } from '@/core/types';
import { pdfService } from '@/services/pdf/pdfService';
import { useNavigate } from 'react-router-dom';
import { storageService } from '@/services/storage/storageService';
import { auditService } from '@/services/audit/auditService';
import { useToast } from '@/hooks/use-toast';

interface InvoiceListProps {
  data: Invoice[];
  defaultFilter?: 'all' | 'unpaid';
}

const InvoiceList: React.FC<InvoiceListProps> = ({ data, defaultFilter = 'all' }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all');
  const [clientFilter, setClientFilter] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredData = useMemo(() => {
    return data.filter((inv) => {
      // Status Filter
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      
      // Default Tab Filter (Unpaid)
      if (defaultFilter === 'unpaid') {
         if (inv.paymentStatus === 'paid' || inv.status === 'cancelled') return false;
      }

      // Date Filter
      const d = new Date(inv.date);
      if (startDate) {
        const s = new Date(startDate);
        if (d < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        if (d > e) return false;
      }

      // Client Name Filter
      if (clientFilter) {
        if (!inv.clientName?.toLowerCase().includes(clientFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [data, statusFilter, defaultFilter, startDate, endDate, clientFilter]);

  const handleDuplicate = (invoice: Invoice) => {
    // Logic to duplicate: Navigate to new form with state or query param, 
    // but easier is to create a new object and save it? 
    // Better: Navigate to /invoices/new with sourceId.
    // Since we don't have query param logic in Form yet, we can modify Form later.
    // For now, let's just copy to clipboard or create a draft directly?
    // Let's go with creating a draft directly for better UX.
    
    const newInvoice: Invoice = {
      ...invoice,
      id: crypto.randomUUID(),
      number: 'DRAFT-' + Date.now(), // Temporary, should be auto-generated on save usually
      status: 'draft',
      paymentStatus: 'unpaid',
      paidAmount: 0,
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const invoices = storageService.loadCollection('invoices') as Invoice[];
    invoices.push(newInvoice);
    storageService.saveCollection('invoices', invoices);
    
    auditService.log('CREATE', 'INVOICE', newInvoice.id, `Duplicated from ${invoice.number}`);
    
    toast({
      title: t('messages.saveSuccess'),
      description: t('invoices.duplicatedSuccess'),
    });
    
    // Refresh page or navigate to edit
    navigate(`/invoices/edit/${newInvoice.id}`);
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      id: 'select',
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
      accessorKey: 'number',
      header: t('invoices.number'),
    },
    {
      accessorKey: 'date',
      header: t('common.date'),
      cell: ({ row }) =>
        format(new Date(row.getValue('date')), 'dd/MM/yyyy', {
          locale: i18n.language === 'fr' ? fr : undefined,
        }),
    },
    {
      accessorKey: 'clientName',
      header: t('sales.table.client'),
    },
    {
      accessorKey: 'totals.totalTTC',
      header: t('common.total'),
      cell: ({ row }) => `${row.original.totals.totalTTC.toFixed(2)} ${t('common.currency')}`,
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      cell: ({ row }) => {
        const status = row.getValue('status') as DocumentStatus;
        let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
        if (status === 'validated') variant = 'default';
        if (status === 'draft') variant = 'secondary';
        if (status === 'cancelled') variant = 'destructive';
        return <Badge variant={variant}>{t(`documentStatus.${status}`)}</Badge>;
      },
    },
    {
      accessorKey: 'paymentStatus',
      header: t('sales.table.paymentStatus'),
      cell: ({ row }) => {
        const ps = row.getValue('paymentStatus') as PaymentStatus;
        return t(`paymentStatus.${ps}`);
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(`/invoices/edit/${invoice.id}`)}>
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => pdfService.generateInvoicePDF(invoice)}>
                <Printer className="mr-2 h-4 w-4" />
                {t('common.print')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(invoice)}>
                <Copy className="mr-2 h-4 w-4" />
                {t('invoices.duplicate')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: (updater) => {
        // Handle row selection state manually if needed or rely on table state
        // Here we just let the table handle it, but we need to extract IDs for bulk actions
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  
  const exportCsvGrouped = () => {
    const list = selectedRows.length ? selectedRows.map(r => r.original) : filteredData;
    const rows = [
      ['Number', 'Date', 'Client', 'TotalTTC', 'Status', 'PaymentStatus'],
      ...list.map((i) => [
        i.number,
        i.date,
        i.clientName || '',
        i.totals.totalTTC.toFixed(2),
        i.status,
        i.paymentStatus,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdfGrouped = () => {
    const list = selectedRows.length ? selectedRows.map(r => r.original) : filteredData;
    if (list.length === 0) return;
    pdfService.generateInvoicesPDF(list);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
         <div className="flex gap-2 flex-1">
            <Input 
              placeholder={t('common.search') + ' ' + t('clients.name') + '...'} 
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="max-w-sm"
            />
             <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | DocumentStatus)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('common.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="draft">{t('documentStatus.draft')}</SelectItem>
              <SelectItem value="validated">{t('documentStatus.validated')}</SelectItem>
              <SelectItem value="cancelled">{t('documentStatus.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
         </div>
         <div className="flex gap-2">
            <Input type="date" className="w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" className="w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
         </div>
      </div>
      
      <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={exportCsvGrouped} size="sm">
            <Download className="me-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={exportPdfGrouped} size="sm">
            <Printer className="me-2 h-4 w-4" />
            PDF
          </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
    </div>
  );
};

export default InvoiceList;
