import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storageService } from '@/services/storage/storageService';
import { useAppStore } from '@/store/useAppStore';
import { auditService } from '@/services/audit/auditService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const DataManagement: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { loadData } = useAppStore();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleExport = () => {
    try {
      const data = storageService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stockmaster-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      auditService.log('EXPORT', 'DATA', 'ALL', 'Full data backup exported');
      toast({ title: 'Export réussi' });
    } catch (error) {
      console.error('Export failed:', error);
      toast({ title: 'Erreur lors de l\'export', variant: 'destructive' });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = storageService.importData(content);
        if (success) {
          loadData();
          auditService.log('IMPORT', 'DATA', 'ALL', 'Full data backup imported');
          toast({ title: 'Import réussi' });
        } else {
          toast({ title: 'Erreur d\'import', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Import failed:', error);
        toast({ title: 'Fichier invalide', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const handleReset = () => {
    storageService.resetAll();
    loadData();
    setIsResetDialogOpen(false);
    auditService.log('DELETE', 'DATA', 'ALL', 'All data reset to defaults');
    toast({ title: 'Données réinitialisées' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.backup')}</CardTitle>
          <CardDescription>Sauvegarder ou restaurer vos données</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleExport} variant="outline" className="flex-1">
              <Download className="w-4 h-4 me-2" />
              Exporter les données
            </Button>
            <div className="relative flex-1">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="w-full">
                <Upload className="w-4 h-4 me-2" />
                Importer une sauvegarde
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Zone de danger
          </CardTitle>
          <CardDescription>Actions irréversibles sur vos données</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <RotateCcw className="w-4 h-4 me-2" />
                Réinitialiser toutes les données
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action ne peut pas être annulée. Cela supprimera définitivement toutes vos données
                  (clients, produits, ventes, etc.) et restaurera les paramètres par défaut.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">
                  Oui, tout effacer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};
