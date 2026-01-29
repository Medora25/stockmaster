import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Trash2, 
  Eye, 
  Bell,
  CheckCheck
} from 'lucide-react';
import { Alert, AlertType } from '@/core/types';

const AlertsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { alerts, markAlertRead, markAllAlertsRead, deleteAlert, clearAllAlerts } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  const getVariant = (priority: string) => {
    if (priority === 'critical') return 'destructive';
    if (priority === 'high') return 'default';
    if (priority === 'medium') return 'secondary';
    return 'outline';
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'stock_rupture':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'client_impaye':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'system':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeText = (type: AlertType) => {
    return t(`alerts.type.${type}`) || type;
  };

  const filteredAlerts = useMemo(() => {
    let result = alerts.slice().sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
    
    if (activeTab === 'unread') {
      result = result.filter(a => !a.isRead);
    } else if (activeTab === 'critical') {
      result = result.filter(a => a.priority === 'critical' || a.priority === 'high');
    }
    
    return result;
  }, [alerts, activeTab]);

  const allSelected = filteredAlerts.length > 0 && selectedIds.length === filteredAlerts.length;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredAlerts.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const markSelectedRead = () => {
    const unreadSelected = filteredAlerts.filter(a => !a.isRead && selectedIds.includes(a.id)).map(a => a.id);
    unreadSelected.forEach((id) => markAlertRead(id));
    setSelectedIds([]);
  };

  const deleteSelected = () => {
    selectedIds.forEach((id) => deleteAlert(id));
    setSelectedIds([]);
  };

  const handleNavigate = (alert: Alert) => {
    if (alert.referenceType && alert.referenceId) {
      switch (alert.referenceType) {
        case 'product':
          navigate('/inventory'); // Ideally open product details
          break;
        case 'invoice':
          navigate('/invoices'); // Ideally open invoice details
          break;
        case 'client':
          navigate('/clients');
          break;
        default:
          break;
      }
    }
    if (!alert.isRead) {
      markAlertRead(alert.id);
    }
  };

  const AlertTable = ({ data }: { data: Alert[] }) => (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="w-12">
            <div className="flex items-center justify-center">
              <Checkbox checked={allSelected && data.length > 0} onCheckedChange={(v) => toggleSelectAll(Boolean(v))} />
            </div>
          </TableHead>
          <TableHead>{t('common.date')}</TableHead>
          <TableHead>{t('alerts.type.system')}</TableHead>
          <TableHead>Priorité</TableHead>
          <TableHead>{t('common.details')}</TableHead>
          <TableHead className="text-center">{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              {t('common.noData')}
            </TableCell>
          </TableRow>
        ) : (
          data.map((a) => (
            <TableRow key={a.id} className={!a.isRead ? 'bg-muted/20' : ''}>
              <TableCell className="w-12">
                <div className="flex items-center justify-center">
                  <Checkbox 
                    checked={selectedIds.includes(a.id)} 
                    onCheckedChange={(v) => toggleSelectOne(a.id, Boolean(v))} 
                  />
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="text-sm">
                  {new Date(a.createdAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleTimeString()}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTypeIcon(a.type)}
                  <span className="text-sm">{getTypeText(a.type)}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getVariant(a.priority)}>{a.priority.toUpperCase()}</Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">{a.message}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  {!a.isRead && (
                    <Button variant="ghost" size="icon" onClick={() => markAlertRead(a.id)} title={t('alerts.markRead')}>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </Button>
                  )}
                  {a.referenceId && (
                    <Button variant="ghost" size="icon" onClick={() => handleNavigate(a)} title={t('alerts.viewReference')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => deleteAlert(a.id)} title={t('alerts.delete')}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.alerts')}</h1>
          <p className="text-muted-foreground">
            {t('alerts.autoCheck')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button variant="destructive" size="sm" onClick={deleteSelected}>
                <Trash2 className="h-4 w-4 me-2" />
                {t('alerts.delete')} ({selectedIds.length})
              </Button>
              <Button variant="outline" size="sm" onClick={markSelectedRead}>
                <CheckCheck className="h-4 w-4 me-2" />
                {t('alerts.markRead')}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => markAllAlertsRead()}>
            {t('alerts.markAllRead')}
          </Button>
          <Button variant="destructive" size="sm" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => clearAllAlerts()}>
            {t('alerts.deleteAll')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-0">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                <TabsTrigger value="all">{t('alerts.tabs.all')}</TabsTrigger>
                <TabsTrigger value="unread">
                  {t('alerts.tabs.unread')}
                  {alerts.filter(a => !a.isRead).length > 0 && (
                    <Badge variant="destructive" className="ms-2 h-5 min-w-5 px-1">
                      {alerts.filter(a => !a.isRead).length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="critical">{t('alerts.tabs.critical')}</TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="pt-6">
              <TabsContent value="all" className="mt-0">
                <AlertTable data={filteredAlerts} />
              </TabsContent>
              <TabsContent value="unread" className="mt-0">
                <AlertTable data={filteredAlerts} />
              </TabsContent>
              <TabsContent value="critical" className="mt-0">
                <AlertTable data={filteredAlerts} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
};

export default AlertsPage;
