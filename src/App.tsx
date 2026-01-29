import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import '@/i18n';

import AppLayout from "./app/layout/AppLayout";
import DashboardPage from "./features/dashboard/DashboardPage";
import ClientsPage from "./features/clients/ClientsPage";
import ProductsPage from "./features/products/ProductsPage";
import CategoriesPage from "./features/categories/CategoriesPage";
import SettingsPage from "./features/settings/SettingsPage";
import PurchasesPage from "./features/purchases/PurchasesPage";
import PurchaseForm from "./features/purchases/PurchaseForm";
import PurchaseDetails from "./features/purchases/PurchaseDetails";
import DeliveriesPage from "./features/deliveries/DeliveriesPage";
import DeliveryForm from "./features/deliveries/DeliveryForm";
import DeliveryDetails from "./features/deliveries/DeliveryDetails";
import RecettesPage from "./features/recettes/RecettesPage";
import RecetteForm from "./features/recettes/RecetteForm";
import RecetteReport from "./features/recettes/RecetteReport";
import SalesPage from "./features/sales/SalesPage";
import SaleForm from "./features/sales/SaleForm";
import AuditLogsPage from "./features/audit/AuditLogsPage";
import SuppliersPage from "./features/suppliers/SuppliersPage";
import InvoicesPage from "./features/invoices/InvoicesPage";
import InvoiceDetails from "./features/invoices/InvoiceDetails";
import InvoiceForm from "./features/invoices/InvoiceForm";
import InventoryPage from "./features/inventory/InventoryPage";
import AlertsPage from "./features/alerts/AlertsPage";
import FeatureFlagGuard from "./components/feature-flag-guard";
import NotFound from "./pages/NotFound";
import AccountingPage from "./features/accounting/AccountingPage";
import QuotationsPage from "./features/quotations/QuotationsPage";
import QuotationForm from "./features/quotations/QuotationForm";
import BankOperationsPage from "./features/bankOperations/BankOperationsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route element={<FeatureFlagGuard featureKey="clients" />}>
              <Route path="/clients" element={<ClientsPage />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="suppliers" />}>
              <Route path="/suppliers" element={<SuppliersPage />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="products" />}>
              <Route path="/products" element={<ProductsPage />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="products" />}>
              <Route path="/categories" element={<CategoriesPage />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="bonAchat" />}>
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/purchases/new" element={<PurchaseForm />} />
              <Route path="/purchases/:id" element={<PurchaseDetails />} />
              <Route path="/purchases/edit/:id" element={<PurchaseForm />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="bonLivraison" />}>
              <Route path="/deliveries" element={<DeliveriesPage />} />
              <Route path="/deliveries/new" element={<DeliveryForm />} />
              <Route path="/deliveries/:id" element={<DeliveryDetails />} />
              <Route path="/deliveries/edit/:id" element={<DeliveryForm />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="ventes" />}>
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/sales/new" element={<SaleForm />} />
              <Route path="/sales/edit/:id" element={<SaleForm />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="devis" />}>
              <Route path="/quotations" element={<QuotationsPage />} />
              <Route path="/quotations/new" element={<QuotationForm />} />
              <Route path="/quotations/edit/:id" element={<QuotationForm />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="facturation" />}>
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoices/new" element={<InvoiceForm />} />
              <Route path="/invoices/:id" element={<InvoiceDetails />} />
              <Route path="/invoices/edit/:id" element={<InvoiceForm />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="inventaire" />}>
              <Route path="/inventory" element={<InventoryPage />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="alertes" />}>
              <Route path="/alerts" element={<AlertsPage />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="recettes" />}>
              <Route path="/cashbook" element={<RecettesPage />} />
              <Route path="/cashbook/new" element={<RecetteForm />} />
              <Route path="/cashbook/report" element={<RecetteReport />} />
              <Route path="/cashbook/edit/:id" element={<RecetteForm />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="accounting" />}>
              <Route path="/accounting" element={<AccountingPage />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="parametres" />}>
              <Route path="/audit" element={<AuditLogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route element={<FeatureFlagGuard featureKey="bankOperations" />}>
              <Route path="/bank-operations" element={<BankOperationsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
