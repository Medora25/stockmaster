import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppStore } from '@/store/useAppStore';
import { ManualEntry } from '@/core/types';
import { format } from 'date-fns';
import { Trash2, Plus } from 'lucide-react';

export const AccountingManualEntries: React.FC = () => {
  const { t } = useTranslation();
  const { manualEntries, addManualEntry, deleteManualEntry, settings } = useAppStore();
  
  const [newEntry, setNewEntry] = useState<Partial<ManualEntry>>({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    debitAccount: '',
    creditAccount: '',
    amount: 0
  });

  const handleAdd = () => {
    if (!newEntry.reference || !newEntry.debitAccount || !newEntry.creditAccount || !newEntry.amount) return;
    
    addManualEntry({
      date: newEntry.date!,
      reference: newEntry.reference!,
      description: newEntry.description || '',
      debitAccount: newEntry.debitAccount!,
      creditAccount: newEntry.creditAccount!,
      amount: Number(newEntry.amount),
      branch: settings.defaultBranch
    });

    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      debitAccount: '',
      creditAccount: '',
      amount: 0
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opérations Diverses (OD)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-4 mb-6 items-end">
          <div>
            <Label>{t('date')}</Label>
            <Input type="date" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
          </div>
          <div>
            <Label>{t('reference')}</Label>
            <Input value={newEntry.reference} onChange={e => setNewEntry({...newEntry, reference: e.target.value})} placeholder="OD-..." />
          </div>
          <div className="col-span-2">
            <Label>Description</Label>
            <Input value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})} placeholder="Description..." />
          </div>
          <div className="col-span-2"></div>
          
          <div>
            <Label>{t('accounting.debitAccount')}</Label>
            <Input value={newEntry.debitAccount} onChange={e => setNewEntry({...newEntry, debitAccount: e.target.value})} placeholder="ex: 619..." />
          </div>
          <div>
            <Label>{t('accounting.creditAccount')}</Label>
            <Input value={newEntry.creditAccount} onChange={e => setNewEntry({...newEntry, creditAccount: e.target.value})} placeholder="ex: 514..." />
          </div>
          <div>
            <Label>{t('amount')}</Label>
            <Input type="number" value={newEntry.amount} onChange={e => setNewEntry({...newEntry, amount: Number(e.target.value)})} />
          </div>
          <div>
            <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" /> {t('add')}</Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('reference')}</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>{t('accounting.debitAccount')}</TableHead>
              <TableHead>{t('accounting.creditAccount')}</TableHead>
              <TableHead className="text-right">{t('amount')}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {manualEntries.map(entry => (
              <TableRow key={entry.id}>
                <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{entry.reference}</TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell>{entry.debitAccount}</TableCell>
                <TableCell>{entry.creditAccount}</TableCell>
                <TableCell className="text-right">{entry.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => deleteManualEntry(entry.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
