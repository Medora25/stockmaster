import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, endOfDay } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockMovement } from '@/core/types';
import { pdfService } from '@/services/pdf/pdfService';

interface InventoryMovementsProps {
  stockMovements: StockMovement[];
}

const InventoryMovements: React.FC<InventoryMovementsProps> = ({ stockMovements }) => {
  const { t } = useTranslation();
  const [movementType, setMovementType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedMovementIds, setSelectedMovementIds] = useState<string[]>([]);

  const filteredMovements = useMemo(() => {
    return stockMovements
      .slice()
      .filter((m) => {
        if (movementType !== 'all' && m.type !== movementType) return false;
        const d = new Date(m.createdAt);
        if (startDate) {
          const s = new Date(startDate);
          if (d < s) return false;
        }
        if (endDate) {
          const e = endOfDay(new Date(endDate));
          if (d > e) return false;
        }
        return true;
      })
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [stockMovements, movementType, startDate, endDate]);

  const allMovementsSelected = filteredMovements.length > 0 && selectedMovementIds.length === filteredMovements.length;

  const toggleSelectAllMovements = (checked: boolean) => {
    if (checked) setSelectedMovementIds(filteredMovements.map(m => m.id));
    else setSelectedMovementIds([]);
  };

  const toggleSelectMovement = (id: string, checked: boolean) => {
    setSelectedMovementIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  const exportMovementsCSV = () => {
    const list = selectedMovementIds.length ? filteredMovements.filter(m => selectedMovementIds.includes(m.id)) : filteredMovements;
    if (list.length === 0) return;
    const rows = [
      ['Date', 'Product', 'Type', 'Quantity', 'Previous', 'New'],
      ...list.map(m => [
        format(new Date(m.createdAt), 'dd/MM/yyyy HH:mm'),
        m.productName || m.productId,
        m.type,
        m.quantity,
        m.previousStock,
        m.newStock
      ])
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mouvements_${new Date().toISOString().slice(0,10)}${selectedMovementIds.length ? `_sel${selectedMovementIds.length}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMovementsPDF = () => {
    const list = selectedMovementIds.length ? filteredMovements.filter(m => selectedMovementIds.includes(m.id)) : filteredMovements;
    if (list.length === 0) return;
    pdfService.generateStockMovementsPDF(list);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('inventory.movements')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Select value={movementType} onValueChange={setMovementType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('inventory.movementType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="PURCHASE_IN">{t('inventory.movementTypes.PURCHASE_IN')}</SelectItem>
              <SelectItem value="DELIVERY_OUT">{t('inventory.movementTypes.DELIVERY_OUT')}</SelectItem>
              <SelectItem value="SALE_OUT">{t('inventory.movementTypes.SALE_OUT')}</SelectItem>
              <SelectItem value="ADJUSTMENT_IN">{t('inventory.movementTypes.ADJUSTMENT_IN')}</SelectItem>
              <SelectItem value="ADJUSTMENT_OUT">{t('inventory.movementTypes.ADJUSTMENT_OUT')}</SelectItem>
              <SelectItem value="RETURN_IN">{t('inventory.movementTypes.RETURN_IN')}</SelectItem>
              <SelectItem value="RETURN_OUT">{t('inventory.movementTypes.RETURN_OUT')}</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" className="w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" className="w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <div className="flex-1"></div>
          <Button variant="outline" onClick={exportMovementsCSV}>
            {t('inventory.exportMovementsCSV')}{selectedMovementIds.length ? ` (${selectedMovementIds.length})` : ''}
          </Button>
          <Button onClick={exportMovementsPDF}>
            {t('inventory.exportMovementsPDF')}{selectedMovementIds.length ? ` (${selectedMovementIds.length})` : ''}
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">
                  <div className="flex items-center justify-center">
                    <Checkbox checked={allMovementsSelected} onCheckedChange={(v) => toggleSelectAllMovements(Boolean(v))} />
                  </div>
                </TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('products.name')}</TableHead>
                <TableHead>{t('inventory.movementType')}</TableHead>
                <TableHead>{t('common.quantity')}</TableHead>
                <TableHead>{t('inventory.stockColumn')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="w-12">
                      <div className="flex items-center justify-center">
                        <Checkbox 
                          checked={selectedMovementIds.includes(m.id)} 
                          onCheckedChange={(v) => toggleSelectMovement(m.id, Boolean(v))} 
                        />
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(m.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="font-medium">{m.productName || m.productId}</TableCell>
                    <TableCell>{t(`inventory.movementTypes.${m.type}`, m.type)}</TableCell>
                    <TableCell className={m.quantity > 0 ? "text-green-600" : "text-red-600"}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {m.previousStock} → <span className="font-medium text-foreground">{m.newStock}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryMovements;
