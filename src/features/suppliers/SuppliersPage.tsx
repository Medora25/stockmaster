import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, Download, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/useAppStore';
import { Supplier, PaymentMethod } from '@/core/types';
import { pdfService } from '@/services/pdf/pdfService';
import { auditService } from '@/services/audit/auditService';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import { SuppliersStats } from './components/SuppliersStats';
import { SuppliersList } from './components/SuppliersList';
import { SupplierForm } from './components/SupplierForm';
import { SupplierProfile } from './components/SupplierProfile';

const SuppliersPage: React.FC = () => {
  const { t } = useTranslation();
  const { 
    suppliers, 
    addSupplier, 
    updateSupplier, 
    deleteSupplier, 
    purchases, 
    payments, 
    products, 
    addPayment, 
    settings 
  } = useAppStore();
  const { toast } = useToast();

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [onlyInactive, setOnlyInactive] = useState(false);
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);
  const [cityFilter, setCityFilter] = useState<string>('all');
  
  // Sort & Pagination State
  const [sortBy, setSortBy] = useState<'name' | 'phone' | 'city' | 'balance'>('balance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileSupplier, setProfileSupplier] = useState<Supplier | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);

  // Payment Form State
  const branches = settings.branches || [];
  const defaultBranch = settings.defaultBranch || branches[0] || '';
  const [paymentForm, setPaymentForm] = useState<{ 
    date: string; 
    amount: number; 
    method: PaymentMethod; 
    reference?: string; 
    branch?: string; 
    purchaseId?: string 
  }>({
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    method: 'cash',
    reference: '',
    branch: defaultBranch,
    purchaseId: undefined,
  });

  // Computed Values
  const cities = useMemo(() => {
    return Array.from(new Set(suppliers.map(s => s.city).filter(Boolean))).sort();
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    let list = suppliers;
    
    // Apply filters
    if (onlyActive) list = list.filter(s => s.isActive);
    if (onlyInactive) list = list.filter(s => !s.isActive);
    if (onlyWithBalance) list = list.filter(s => (s.balance || 0) > 0);
    if (cityFilter && cityFilter !== 'all') list = list.filter(s => s.city === cityFilter);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        [s.name, s.phone, s.city, s.ice, s.email, s.address, s.rc, s.if, s.cnss]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(q))
      );
    }

    // Apply sorting
    return list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'balance') {
        cmp = (a.balance || 0) - (b.balance || 0);
      } else {
        const av = String(a[sortBy] || '').toLowerCase();
        const bv = String(b[sortBy] || '').toLowerCase();
        cmp = av.localeCompare(bv);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [suppliers, onlyActive, onlyInactive, onlyWithBalance, cityFilter, searchQuery, sortBy, sortDir]);

  const pagedSuppliers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, page, pageSize]);

  const remainingDue = useMemo(() => {
    if (!paymentForm.purchaseId) return null;
    const purchase = purchases.find(p => p.id === paymentForm.purchaseId);
    if (!purchase) return null;
    const alreadyPaid = payments
      .filter(pm => pm.purchaseId === paymentForm.purchaseId)
      .reduce((sum, pm) => sum + pm.amount, 0);
    const remaining = Math.max(0, (purchase.totals?.totalTTC || 0) - alreadyPaid);
    return Number(remaining.toFixed(2));
  }, [paymentForm.purchaseId, payments, purchases]);

  // Handlers
  const handleSort = (key: 'name' | 'phone' | 'city' | 'balance') => {
    if (sortBy === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = pagedSuppliers.every(s => next.has(s.id));
      if (allSelected) {
        pagedSuppliers.forEach(s => next.delete(s.id));
      } else {
        pagedSuppliers.forEach(s => next.add(s.id));
      }
      return next;
    });
  };

  const handleSaveSupplier = (data: any) => {
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, data);
      auditService.log('UPDATE', 'SUPPLIER', editingSupplier.id, `Supplier ${data.name} updated`);
      toast({ title: t('messages.saveSuccess') });
    } else {
      addSupplier(data);
      auditService.log('CREATE', 'SUPPLIER', undefined, `Supplier ${data.name} created`);
      toast({ title: t('messages.saveSuccess') });
    }
    setIsFormOpen(false);
    setEditingSupplier(null);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      auditService.log('DELETE', 'SUPPLIER', supplierToDelete.id, `Supplier ${supplierToDelete.name} deleted`);
      toast({ title: t('messages.deleteSuccess') });
      setIsDeleteOpen(false);
      setSupplierToDelete(null);
      if (profileSupplier?.id === supplierToDelete.id) {
        setIsProfileOpen(false);
        setProfileSupplier(null);
      }
    }
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    
    ids.forEach(id => {
      deleteSupplier(id);
      auditService.log('DELETE', 'SUPPLIER', id, 'Bulk delete');
    });
    
    setSelectedIds(new Set());
    toast({ title: t('messages.deleteSuccess') });
  };

  const handleGenerateStatement = (supplier: Supplier) => {
    const supplierPurchases = purchases.filter(p => p.supplierId === supplier.id);
    const supplierPayments = payments.filter(p => p.supplierId === supplier.id);
    const entries = [
      ...supplierPurchases.map(p => ({ date: p.date, type: 'ACHAT', ref: p.number, amount: p.totals.totalTTC })),
      ...supplierPayments.map(pm => ({ date: pm.date, type: 'PAIEMENT', ref: pm.reference || '', amount: -pm.amount })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let balance = 0;
    const transactions = entries.map(e => {
      balance += e.amount;
      return { date: e.date, type: e.type, reference: e.ref, amount: e.amount, balance };
    });
    
    pdfService.generateSupplierStatementPDF(supplier, transactions, supplier.balance);
    auditService.log('EXPORT', 'SUPPLIER', supplier.id, `Statement generated for ${supplier.name}`);
  };

  const handleOpenPayment = (supplier: Supplier) => {
    setPaymentSupplier(supplier);
    setPaymentForm({
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      method: 'cash',
      reference: '',
      branch: defaultBranch,
      purchaseId: undefined,
    });
    setIsPaymentOpen(true);
  };

  const handleSubmitPayment = () => {
    if (!paymentSupplier || !paymentForm.amount || paymentForm.amount <= 0) {
      toast({ title: t('validation.positive') });
      return;
    }
    addPayment({
      date: paymentForm.date,
      supplierId: paymentSupplier.id,
      amount: paymentForm.amount,
      method: paymentForm.method,
      reference: paymentForm.reference,
      branch: paymentForm.branch,
      purchaseId: paymentForm.purchaseId,
    });
    
    auditService.log('CREATE', 'PAYMENT', undefined, `Payment of ${paymentForm.amount} for ${paymentSupplier.name}`);
    
    setIsPaymentOpen(false);
    setPaymentSupplier(null);
    toast({ title: t('messages.saveSuccess') });
  };

  const handleExportCSV = () => {
    const headers = ['Nom', 'Email', 'Téléphone', 'Adresse', 'Ville', 'ICE', 'Solde', 'Actif'];
    const rows = filteredSuppliers.map(s => [
      s.name,
      s.email || '',
      s.phone || '',
      s.address || '',
      s.city || '',
      s.ice || '',
      s.balance.toString(),
      s.isActive ? 'Oui' : 'Non'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fournisseurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t('common.export') });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="space-y-6 pb-24 md:pb-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {t('suppliers.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('suppliers.listDescription', 'Gérez vos fournisseurs et suivez leurs soldes.')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setEditingSupplier(null); setIsFormOpen(true); }} className="shadow-sm">
            <Plus className="w-4 h-4 me-2" />
            {t('common.add')}
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <SuppliersStats 
        suppliers={suppliers} 
        purchases={purchases} 
        payments={payments} 
      />

      {/* Filters & Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {t('common.filters')}
              </CardTitle>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedIds.size} {t('common.selected', 'sélectionné(s)')}</Badge>
                  
                  <Button variant="outline" size="sm" onClick={handleBulkToggleStatus}>
                     <Filter className="w-4 h-4 me-2" />
                     {t('common.toggleStatus', 'Changer statut')}
                  </Button>

                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="w-4 h-4 me-2" />
                    {t('common.delete')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-2">
                <Label>{t('common.search')}</Label>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('common.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48 space-y-2">
                <Label>{t('clients.city')}</Label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pb-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="w-4 h-4 me-2" />
                      {t('common.filters')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Statut</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem checked={onlyActive} onCheckedChange={setOnlyActive}>
                      {t('common.active')} Only
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={onlyInactive} onCheckedChange={setOnlyInactive}>
                      {t('common.inactive')} Only
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Finance</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem checked={onlyWithBalance} onCheckedChange={setOnlyWithBalance}>
                      Avec solde
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 me-2" />
                  CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* List */}
      <motion.div variants={itemVariants}>
        <SuppliersList
          suppliers={pagedSuppliers}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onEdit={(s) => { setEditingSupplier(s); setIsFormOpen(true); }}
          onDelete={handleDeleteClick}
          onViewProfile={(s) => { setProfileSupplier(s); setIsProfileOpen(true); }}
          onAddPayment={handleOpenPayment}
          onGenerateStatement={handleGenerateStatement}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          page={page}
          pageSize={pageSize}
          totalItems={filteredSuppliers.length}
          onPageChange={setPage}
        />
      </motion.div>

      {/* Modals */}
      <SupplierForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingSupplier}
        onSubmit={handleSaveSupplier}
      />

      <SupplierProfile
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        supplier={profileSupplier}
        purchases={purchases}
        payments={payments}
        products={products}
        onGenerateStatement={handleGenerateStatement}
        onToggleActive={(s) => updateSupplier(s.id, { isActive: !s.isActive })}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('messages.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('suppliers.addPayment')}</DialogTitle>
            <DialogDescription>{t('suppliers.addPaymentDesc', 'Enregistrer un paiement pour ce fournisseur.')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>{t('common.date')}</Label>
              <Input 
                type="date" 
                value={paymentForm.date} 
                onChange={(e) => setPaymentForm((f) => ({ ...f, date: e.target.value }))} 
              />
            </div>
            <div className="space-y-2">
              <Label>{t('common.amount')}</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={paymentForm.amount} 
                onChange={(e) => setPaymentForm((f) => ({ ...f, amount: Number(e.target.value) }))} 
              />
              {remainingDue !== null && (
                <p className="text-xs text-muted-foreground">
                  Reste à payer sur le BA: {remainingDue} MAD
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('common.method')}</Label>
              <Select 
                value={paymentForm.method} 
                onValueChange={(v: PaymentMethod) => setPaymentForm((f) => ({ ...f, method: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('common.cash')}</SelectItem>
                  <SelectItem value="cheque">{t('common.cheque')}</SelectItem>
                  <SelectItem value="virement">{t('common.transfer')}</SelectItem>
                  <SelectItem value="carte">{t('common.card')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('common.reference')}</Label>
              <Input 
                value={paymentForm.reference || ''} 
                onChange={(e) => setPaymentForm((f) => ({ ...f, reference: e.target.value }))} 
                placeholder="Ex: Chèque n°123"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitPayment}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default SuppliersPage;
