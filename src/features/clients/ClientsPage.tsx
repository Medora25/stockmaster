import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/useAppStore';
import { Client, Invoice, Payment, Sale } from '@/core/types';
import { auditService } from '@/services/audit/auditService';
import { pdfService } from '@/services/pdf/pdfService';
import { ClientForm } from './components/ClientForm';
import { ClientsList } from './components/ClientsList';
import { ClientsStats } from './components/ClientsStats';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const ClientsPage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { clients, addClient, updateClient, deleteClient, invoices, payments, sales } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [onlyWithDebt, setOnlyWithDebt] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'phone' | 'city' | 'debt'>('debt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter clients
  const filteredClients = useMemo(() => {
    let list = clients;
    if (onlyActive) list = list.filter(c => c.isActive);
    if (onlyWithDebt) list = list.filter(c => (c.debt || 0) > 0);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.nameAr?.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.city?.toLowerCase().includes(query)
      );
    }
    return list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'debt') {
        cmp = (a.debt || 0) - (b.debt || 0);
      } else {
        const av = String(a[sortBy] || '').toLowerCase();
        const bv = String(b[sortBy] || '').toLowerCase();
        cmp = av.localeCompare(bv);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [clients, searchQuery, onlyActive, onlyWithDebt, sortBy, sortDir]);

  const pagedClients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, page, pageSize]);

  const handleOpenForm = (client?: Client) => {
    setSelectedClient(client || null);
    setIsFormOpen(true);
  };

  const handleSave = (data: any) => {
    if (selectedClient) {
      updateClient(selectedClient.id, data);
      auditService.log('UPDATE', 'CLIENT', selectedClient.id, `Client ${data.name} updated`);
      toast({ title: t('messages.saveSuccess') });
    } else {
      addClient(data);
      auditService.log('CREATE', 'CLIENT', undefined, `Client ${data.name} created`);
      toast({ title: t('messages.saveSuccess') });
    }
    setIsFormOpen(false);
    setSelectedClient(null);
  };

  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedClient) {
      auditService.log('DELETE', 'CLIENT', selectedClient.id, `Client ${selectedClient.name} deleted`);
      deleteClient(selectedClient.id);
      toast({ title: t('messages.deleteSuccess') });
    }
    setIsDeleteOpen(false);
    setSelectedClient(null);
  };

  const handleStatement = (client: Client) => {
    const clientInvoices: Invoice[] = invoices.filter(i => i.clientId === client.id);
    const clientSales: Sale[] = sales.filter(s => s.clientId === client.id);
    const clientPayments: Payment[] = payments.filter(p => p.clientId === client.id);
    const entries = [
      ...clientSales.map(s => ({ date: s.date, type: 'SALE', ref: s.number, amount: s.totals.totalTTC })),
      ...clientInvoices.map(i => ({ date: i.date, type: 'INVOICE', ref: i.number, amount: i.totals.totalTTC })),
      ...clientPayments.map(p => ({ date: p.date, type: 'PAYMENT', ref: p.reference || '', amount: -p.amount })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate running balance
    let balance = 0;
    const transactions = entries.map(e => {
      balance += e.amount;
      return { date: e.date, type: e.type, reference: e.ref, amount: e.amount, balance };
    });
    
    pdfService.generateClientStatementPDF(client, transactions, client.debt);
  };

  const openHistory = (client: Client) => {
    setSelectedClient(client);
    setIsHistoryOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = pagedClients.every(c => next.has(c.id));
      if (allSelected) {
        pagedClients.forEach(c => next.delete(c.id));
      } else {
        pagedClients.forEach(c => next.add(c.id));
      }
      return next;
    });
  };

  const handleSort = (key: 'name' | 'phone' | 'city' | 'debt') => {
    if (sortBy === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 2,
    }).format(amount) + ` ${t('common.currency')}`;
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Hero Header */}
      <div className="rounded-xl p-6 bg-gradient-to-r from-primary to-primary/70 text-primary-foreground shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight">{t('clients.title')}</h1>
          <Button
            variant="secondary"
            className="bg-white/15 hover:bg-white/25 text-primary-foreground border border-white/20 rounded-full"
            onClick={() => handleOpenForm()}
          >
            <Plus className="w-4 h-4 me-2" />
            {t('clients.addClient')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <ClientsStats clients={clients} sales={sales} invoices={invoices} payments={payments} />

      {/* Actions & Filters */}
      <Card className="shadow-lg">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 rounded-xl border-muted-foreground/20 focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={onlyActive ? "default" : "outline"} 
                className="rounded-xl border-muted-foreground/20" 
                onClick={() => setOnlyActive(v => !v)}
              >
                {t('common.active')}
              </Button>
              <Button 
                variant={onlyWithDebt ? "default" : "outline"} 
                className="rounded-xl border-muted-foreground/20" 
                onClick={() => setOnlyWithDebt(v => !v)}
              >
                {t('clients.debtPositive')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <ClientsList
        clients={pagedClients}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAllPage}
        onEdit={handleOpenForm}
        onDelete={handleDelete}
        onViewHistory={openHistory}
        onGenerateStatement={handleStatement}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        page={page}
        pageSize={pageSize}
        totalItems={filteredClients.length}
        onPageChange={setPage}
      />

      {/* Form Dialog */}
      <ClientForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={selectedClient}
        onSubmit={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('clients.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('clients.history')}</DialogTitle>
            <DialogDescription>{selectedClient?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <Card>
              <div className="p-4 font-semibold border-b">{t('sales.title')}</div>
              <div className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('sales.number')}</TableHead>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead>{t('common.total')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.filter(s => s.clientId === selectedClient?.id).map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{s.number}</TableCell>
                        <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(s.totals.totalTTC)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
            <Card>
              <div className="p-4 font-semibold border-b">{t('invoices.title')}</div>
              <div className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('invoices.number')}</TableHead>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead>{t('common.total')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.filter(i => i.clientId === selectedClient?.id).map(i => (
                      <TableRow key={i.id}>
                        <TableCell>{i.number}</TableCell>
                        <TableCell>{new Date(i.date).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(i.totals.totalTTC)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
            <Card>
               <div className="p-4 font-semibold border-b">{t('cashbook.title')}</div>
               <div className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead>{t('common.amount')}</TableHead>
                      <TableHead>{t('common.notes')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.filter(p => p.clientId === selectedClient?.id).map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(p.amount)}</TableCell>
                        <TableCell>{p.reference || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
