import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FolderOpen,
  FolderTree,
  ListFilter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/useAppStore';
import { Category } from '@/core/types';

const CategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const { categories, addCategory, updateCategory, deleteCategory } = useAppStore();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Category>>({
    name: '',
    description: '',
    parentId: undefined,
    isActive: true,
  });

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) =>
      [c.name, c.description].filter(Boolean).some((v) => v!.toLowerCase().includes(q))
    );
  }, [query, categories]);

  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter(c => c.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [categories]);

  const handleSave = () => {
    if (!form.name) {
      toast({ 
        title: t('validation.required'), 
        description: t('products.category'),
        variant: 'destructive'
      });
      return;
    }
    if (editingId) {
      updateCategory(editingId, {
        name: form.name!,
        description: form.description,
        parentId: form.parentId,
        isActive: form.isActive ?? true,
      });
      toast({ title: t('messages.saveSuccess') });
    } else {
      addCategory({
        name: form.name!,
        description: form.description,
        parentId: form.parentId,
        isActive: form.isActive ?? true,
      });
      toast({ title: t('messages.saveSuccess') });
    }
    setIsDialogOpen(false);
    setEditingId(null);
    setForm({ name: '', description: '', parentId: undefined, isActive: true });
  };

  const handleEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      description: c.description,
      parentId: c.parentId,
      isActive: c.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCategory(id);
    setIsDeleteDialogOpen(null);
    toast({ title: t('messages.deleteSuccess') });
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
          {t('nav.categories')}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-300">
            <Plus className="w-4 h-4 me-2" />
            {t('common.add')}
          </Button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('products.totalProducts'), value: stats.total, icon: FolderTree, color: 'blue' },
          { label: t('common.active'), value: stats.active, icon: FolderOpen, color: 'green' },
          { label: t('common.inactive'), value: stats.inactive, icon: ListFilter, color: 'orange' },
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
        <div className="p-4 bg-muted/30 border-b border-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="ps-9 rounded-xl border-muted-foreground/20 focus:ring-primary/20 bg-background h-10"
              placeholder={t('common.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-none">
                <TableHead className="font-semibold">{t('products.category')}</TableHead>
                <TableHead className="font-semibold">{t('products.description')}</TableHead>
                <TableHead className="font-semibold">{t('common.status')}</TableHead>
                <TableHead className="text-right font-semibold">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>{t('common.noData')}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((c) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-primary/5 transition-colors border-muted/20 h-16"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <FolderOpen className="w-5 h-5 text-primary" />
                          </div>
                          <span>{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.description || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={c.isActive ? 'default' : 'secondary'}
                          className="rounded-lg px-2.5 py-0.5"
                        >
                          {c.isActive ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(c)}
                            className="h-8 w-8 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsDeleteDialogOpen(c.id)}
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary/5 px-6 py-6 border-b border-primary/10">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                  <FolderOpen className="w-5 h-5" />
                </div>
                {editingId ? t('common.edit') : t('common.add')}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/80">
                {editingId ? t('messages.editDescription') : t('messages.addDescription')}
              </DialogDescription>
            </DialogHeader>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 p-6"
          >
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">{t('products.category')} *</Label>
              <Input 
                id="name"
                value={form.name || ''} 
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-xl border-muted-foreground/20 focus:ring-primary/20 h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">{t('products.description')}</Label>
              <Input 
                id="description"
                value={form.description || ''} 
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="rounded-xl border-muted-foreground/20 focus:ring-primary/20 h-10"
              />
            </div>
          </motion.div>

          <div className="px-6 py-4 bg-muted/30 border-t border-muted-foreground/10 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl px-6">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} className="rounded-xl px-8 shadow-lg shadow-primary/20">
              {t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!isDeleteDialogOpen} onOpenChange={(open) => !open && setIsDeleteDialogOpen(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('messages.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => isDeleteDialogOpen && handleDelete(isDeleteDialogOpen)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesPage;
