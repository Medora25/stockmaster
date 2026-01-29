// =====================================
// Audit Logs Page - System Activity
// =====================================

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Clock, User, Activity, Database, Download, Trash2, Calendar, FileText, LayoutList, Users } from 'lucide-react';
import { format, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { fr, arSA } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { auditService } from '@/services/audit/auditService';
import { useAppStore } from '@/store/useAppStore';

const AuditLogsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { settings } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [logs, setLogs] = useState(() => auditService.getAllLogs());

  const dateLocale = i18n.language === 'ar' ? arSA : fr;

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityId?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;

      let matchesDate = true;
      if (startDate || endDate) {
        const logDate = new Date(log.createdAt);
        if (startDate && endDate) {
          matchesDate = isWithinInterval(logDate, {
            start: parseISO(startDate),
            end: endOfDay(parseISO(endDate))
          });
        } else if (startDate) {
          matchesDate = logDate >= parseISO(startDate);
        } else if (endDate) {
          matchesDate = logDate <= endOfDay(parseISO(endDate));
        }
      }

      return matchesSearch && matchesEntity && matchesAction && matchesDate;
    });
  }, [logs, searchQuery, entityFilter, actionFilter, startDate, endDate]);

  const stats = useMemo(() => {
    const total = logs.length;
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = logs.filter(l => l.createdAt.startsWith(today)).length;
    const uniqueUsers = new Set(logs.map(l => l.userName)).size;
    return { total, todayCount, uniqueUsers };
  }, [logs]);

  const handleExportCSV = () => {
    const headers = ['Date', 'User', 'Action', 'Entity', 'Details'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        `"${log.userName}"`,
        `"${log.action}"`,
        `"${log.entityType}"`,
        `"${log.details?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearLogs = () => {
    if (window.confirm(t('common.confirm'))) {
      auditService.clearLogs();
      setLogs([]);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">{action}</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">{action}</Badge>;
      case 'DELETE':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">{action}</Badge>;
      case 'VALIDATE':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">{action}</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const entityTypes = Array.from(new Set(logs.map(l => l.entityType)));
  const actions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="page-title">{t('nav.audit')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 me-2" />
            CSV
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearLogs}>
            <Trash2 className="w-4 h-4 me-2" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Journaux</CardTitle>
            <LayoutList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Enregistrements stockés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCount}</div>
            <p className="text-xs text-muted-foreground">Actions effectuées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Ayant effectué des actions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {t('common.filters')}
          </CardTitle>
          <CardDescription>
            Filtrer les journaux par type d'entité, action, date ou recherche textuelle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9"
                />
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {entityTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {actions.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Période:</span>
              </div>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full md:w-auto"
              />
              <span className="hidden md:inline text-muted-foreground">→</span>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full md:w-auto"
              />
              {(startDate || endDate) && (
                <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>
                  Effacer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="text-primary-foreground w-[180px]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {t('common.date')}
                  </div>
                </TableHead>
                <TableHead className="text-primary-foreground w-[120px]">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Utilisateur
                  </div>
                </TableHead>
                <TableHead className="text-primary-foreground w-[120px]">Action</TableHead>
                <TableHead className="text-primary-foreground w-[150px]">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Entité
                  </div>
                </TableHead>
                <TableHead className="text-primary-foreground">{t('common.details')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun journal d'audit trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm font-medium">
                      {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: dateLocale })}
                    </TableCell>
                    <TableCell className="text-sm">{log.userName}</TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {log.entityType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.details}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsPage;
