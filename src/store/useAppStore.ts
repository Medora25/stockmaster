// =====================================
// Global App Store - Zustand
// =====================================

import { create } from 'zustand';
import { storageService } from '@/services/storage/storageService';
import { 
  LocalDatabase, 
  Client, 
  Supplier, 
  Product, 
  Category,
  Quotation,
  Purchase,
  DeliveryNote,
  Sale,
  Invoice,
  Payment,
  CashEntry,
  StockMovement,
  Alert,
  User,
  AuditLog,
  AppSettings,
  FeatureFlags,
  BankAccount,
  Cheque,
  BankTransfer,
  ManualEntry,
  AccountSettings
} from '@/core/types';
import { generateId, defaultSettings } from '@/mock/seedData';

interface AppState {
  // Data
  clients: Client[];
  suppliers: Supplier[];
  products: Product[];
  categories: Category[];
  quotations: Quotation[];
  purchases: Purchase[];
  deliveries: DeliveryNote[];
  sales: Sale[];
  invoices: Invoice[];
  payments: Payment[];
  recettes: CashEntry[];
  stockMovements: StockMovement[];
  alerts: Alert[];
  users: User[];
  auditLogs: AuditLog[];
  settings: AppSettings;
  bankAccounts: BankAccount[];
  cheques: Cheque[];
  bankTransfers: BankTransfer[];
  manualEntries: ManualEntry[];

  // UI State
  sidebarOpen: boolean;
  currentUser: User | null;

  // Actions - Data
  loadData: () => void;
  saveData: () => void;

  // Actions - Clients
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Actions - Suppliers
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Actions - Products
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateStock: (
    productId: string,
    quantity: number,
    type: StockMovement['type'],
    referenceId?: string,
    metadata?: { referenceType?: string; notes?: string; branch?: string }
  ) => void;

  // Actions - Categories
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Actions - Purchases
  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => void;
  savePurchaseDocument: (purchase: Purchase) => void;
  validatePurchase: (id: string) => void;
  cancelPurchase: (id: string) => void;

  // Actions - Quotations
  addQuotation: (quotation: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateQuotation: (id: string, quotation: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;

  // Actions - Deliveries
  addDelivery: (delivery: Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDelivery: (id: string, delivery: Partial<DeliveryNote>) => void;
  saveDeliveryDocument: (delivery: DeliveryNote) => void;
  validateDelivery: (id: string) => void;
  cancelDelivery: (id: string) => void;
  convertDeliveryToInvoice: (deliveryId: string) => Invoice | null;

  // Actions - Sales
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSale: (id: string, sale: Partial<Sale>) => void;
  deleteSale: (id: string) => void;
  saveSaleDocument: (sale: Sale) => void;

  // Actions - Quotations conversion
  convertQuotationToDelivery: (quotationId: string) => DeliveryNote | null;
  convertQuotationToInvoice: (quotationId: string) => Invoice | null;

  // Actions - Invoices
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  saveInvoiceDocument: (invoice: Invoice) => void;

  // Actions - Payments
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => void;

  // Actions - Cash Entries
  addCashEntry: (entry: Omit<CashEntry, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateCashEntry: (id: string, entry: Partial<CashEntry>) => void;
  deleteCashEntry: (id: string) => void;

  // Actions - Bank Operations
  addBankAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateBankAccount: (id: string, account: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  
  addCheque: (cheque: Omit<Cheque, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateCheque: (id: string, cheque: Partial<Cheque>) => void;
  deleteCheque: (id: string) => void;
  
  addBankTransfer: (transfer: Omit<BankTransfer, 'id' | 'createdAt' | 'updatedAt'>) => string;

  // Actions - Accounting Manual Entries
  addManualEntry: (entry: Omit<ManualEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateManualEntry: (id: string, entry: Partial<ManualEntry>) => void;
  deleteManualEntry: (id: string) => void;

  // Actions - Alerts
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  deleteAlert: (id: string) => void;
  clearAllAlerts: () => void;
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>) => void;

  // Actions - Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateFeatures: (features: Partial<FeatureFlags>) => void;

  // Actions - UI
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Actions - Audit
  addAuditLog: (action: string, entityType: string, entityId?: string, details?: string) => void;

  // Helpers
  getNextNumber: (type: 'invoice' | 'delivery' | 'purchase' | 'sale' | 'quotation') => string;
}

export const useAppStore = create<AppState>()(
  (set, get) => ({
      // Initial State
      clients: [],
      suppliers: [],
      products: [],
      categories: [],
      quotations: [],
      purchases: [],
      deliveries: [],
      sales: [],
      invoices: [],
      payments: [],
      recettes: [],
      stockMovements: [],
      alerts: [],
      users: [],
      auditLogs: [],
      bankAccounts: [],
      cheques: [],
      bankTransfers: [],
      manualEntries: [],
      settings: defaultSettings,
      sidebarOpen: true,
      currentUser: null,

      // Load data from storage
      loadData: () => {
        const db = storageService.load();
        set({
          clients: db.clients || [],
          suppliers: db.suppliers || [],
          products: db.products || [],
          categories: db.categories || [],
          quotations: db.quotations || [],
          purchases: db.purchases || [],
          deliveries: db.deliveries || [],
          sales: db.sales || [],
          invoices: db.invoices || [],
          payments: db.payments || [],
          recettes: db.recettes || [],
          stockMovements: db.stockMovements || [],
          alerts: db.alerts || [],
          users: db.users || [],
          auditLogs: db.auditLogs || [],
          bankAccounts: db.bankAccounts || [],
          cheques: db.cheques || [],
          bankTransfers: db.bankTransfers || [],
          manualEntries: db.manualEntries || [],
          settings: db.settings ? { ...defaultSettings, ...db.settings } : defaultSettings,
        });
      },

      // Save data to storage
      saveData: () => {
        const state = get();
        const db: LocalDatabase = {
          version: '1.0.0',
          clients: state.clients,
          suppliers: state.suppliers,
          products: state.products,
          categories: state.categories,
          quotations: state.quotations,
          purchases: state.purchases,
          deliveries: state.deliveries,
          sales: state.sales,
          invoices: state.invoices,
          payments: state.payments,
          recettes: state.recettes,
          stockMovements: state.stockMovements,
          alerts: state.alerts,
          users: state.users,
          auditLogs: state.auditLogs,
          bankAccounts: state.bankAccounts,
          cheques: state.cheques,
          bankTransfers: state.bankTransfers,
          manualEntries: state.manualEntries,
          settings: state.settings,
        };
        storageService.save(db);
      },

      // Client Actions
      addClient: (client) => {
        const now = new Date().toISOString();
        const newClient: Client = {
          ...client,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ clients: [...state.clients, newClient] }));
        get().saveData();
        get().addAuditLog('CREATE', 'client', newClient.id, `Client créé: ${newClient.name}`);
      },

      updateClient: (id, client) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...client, updatedAt: new Date().toISOString() } : c
          ),
        }));
        get().saveData();
        get().addAuditLog('UPDATE', 'client', id);
      },

      deleteClient: (id) => {
        set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
        get().saveData();
        get().addAuditLog('DELETE', 'client', id);
      },

      // Supplier Actions
      addSupplier: (supplier) => {
        const now = new Date().toISOString();
        const newSupplier: Supplier = {
          ...supplier,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ suppliers: [...state.suppliers, newSupplier] }));
        get().saveData();
        get().addAuditLog('CREATE', 'supplier', newSupplier.id, `Fournisseur créé: ${newSupplier.name}`);
      },

      updateSupplier: (id, supplier) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...supplier, updatedAt: new Date().toISOString() } : s
          ),
        }));
        get().saveData();
        get().addAuditLog('UPDATE', 'supplier', id, `Fournisseur mis à jour`);
      },

      deleteSupplier: (id) => {
        set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));
        get().saveData();
        get().addAuditLog('DELETE', 'supplier', id, `Fournisseur supprimé`);
      },

      // Product Actions
      addProduct: (product) => {
        const now = new Date().toISOString();
        const newProduct: Product = {
          ...product,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ products: [...state.products, newProduct] }));
        get().saveData();
        get().addAuditLog('CREATE', 'product', newProduct.id, `Produit créé: ${newProduct.name}`);
      },

      updateProduct: (id, product) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...product, updatedAt: new Date().toISOString() } : p
          ),
        }));
        get().saveData();
        get().addAuditLog('UPDATE', 'product', id, `Produit mis à jour`);
      },

      deleteProduct: (id) => {
        set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
        get().saveData();
        get().addAuditLog('DELETE', 'product', id, `Produit supprimé`);
      },

      updateStock: (productId, quantity, type, referenceId, metadata) => {
        const product = get().products.find((p) => p.id === productId);
        if (!product) return;

        const previousStock = product.stockQuantity;
        const newStock = previousStock + quantity;

        // Create stock movement
        const movement: StockMovement = {
          id: generateId(),
          type,
          productId,
          productName: product.name,
          quantity,
          previousStock,
          newStock,
          referenceType: metadata?.referenceType,
          referenceId,
          notes: metadata?.notes,
          branch: metadata?.branch,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, stockQuantity: newStock, updatedAt: new Date().toISOString() } : p
          ),
          stockMovements: [...state.stockMovements, movement],
        }));

        // Check for low stock alert
        if (newStock <= product.stockMin) {
          get().addAlert({
            type: 'stock_rupture',
            priority: newStock <= 0 ? 'critical' : 'high',
            title: 'Stock faible',
            message: `Le produit "${product.name}" est en dessous du stock minimum (${newStock}/${product.stockMin})`,
            isRead: false,
            referenceType: 'product',
            referenceId: productId,
          });
        }

        get().saveData();
      },

      // Category Actions
      addCategory: (category) => {
        const now = new Date().toISOString();
        const newCategory: Category = {
          ...category,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ categories: [...state.categories, newCategory] }));
        get().saveData();
      },

      updateCategory: (id, category) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...category, updatedAt: new Date().toISOString() } : c
          ),
        }));
        get().saveData();
      },

      deleteCategory: (id) => {
        set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
        get().saveData();
      },

      // Purchase Actions
      addPurchase: (purchase) => {
        const now = new Date().toISOString();
        const newPurchase: Purchase = {
          ...purchase,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ purchases: [...state.purchases, newPurchase] }));
        get().saveData();
      },

      // Quotation Actions
      addQuotation: (quotation) => {
        const now = new Date().toISOString();
        const newQuotation: Quotation = {
          ...quotation,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ quotations: [...state.quotations, newQuotation] }));
        get().saveData();
        get().addAuditLog('CREATE', 'quotation', newQuotation.id, `Devis créé: ${newQuotation.number}`);
      },

      updateQuotation: (id, quotation) => {
        set((state) => ({
          quotations: state.quotations.map((q) =>
            q.id === id ? { ...q, ...quotation, updatedAt: new Date().toISOString() } : q
          ),
        }));
        get().saveData();
        get().addAuditLog('UPDATE', 'quotation', id, `Devis mis à jour`);
      },

      deleteQuotation: (id) => {
        set((state) => ({ quotations: state.quotations.filter((q) => q.id !== id) }));
        get().saveData();
        get().addAuditLog('DELETE', 'quotation', id);
      },

      updatePurchase: (id, purchase) => {
        set((state) => ({
          purchases: state.purchases.map((p) =>
            p.id === id ? { ...p, ...purchase, updatedAt: new Date().toISOString() } : p
          ),
        }));
        get().saveData();
      },

      savePurchaseDocument: (purchase) => {
        const exists = get().purchases.some((item) => item.id === purchase.id);
        set((state) => ({
          purchases: exists
            ? state.purchases.map((item) => (item.id === purchase.id ? purchase : item))
            : [...state.purchases, purchase],
          settings: exists
            ? state.settings
            : {
                ...state.settings,
                numbering: {
                  ...state.settings.numbering,
                  purchaseCounter: state.settings.numbering.purchaseCounter + 1,
                },
              },
        }));
        get().saveData();
      },

      validatePurchase: (id) => {
        const purchase = get().purchases.find((p) => p.id === id);
        if (!purchase || purchase.status !== 'draft') return;

        // Add stock for each line
        purchase.lines.forEach((line) => {
          get().updateStock(line.productId, line.quantity, 'PURCHASE_IN', id);
        });

        set((state) => ({
          purchases: state.purchases.map((p) =>
            p.id === id ? { ...p, status: 'validated', updatedAt: new Date().toISOString() } : p
          ),
        }));
        get().saveData();
        get().addAuditLog('VALIDATE', 'purchase', id, `Bon d'achat validé: ${purchase.number}`);
      },

      cancelPurchase: (id) => {
        const purchase = get().purchases.find((p) => p.id === id);
        if (!purchase || purchase.status === 'cancelled') return;

        // Rollback stock if was validated
        if (purchase.status === 'validated') {
          purchase.lines.forEach((line) => {
            get().updateStock(line.productId, -line.quantity, 'ADJUSTMENT_OUT', id);
          });
        }

        set((state) => ({
          purchases: state.purchases.map((p) =>
            p.id === id ? { ...p, status: 'cancelled', updatedAt: new Date().toISOString() } : p
          ),
        }));
        get().saveData();
      },

      // Delivery Actions
      addDelivery: (delivery) => {
        const now = new Date().toISOString();
        const newDelivery: DeliveryNote = {
          ...delivery,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ deliveries: [...state.deliveries, newDelivery] }));
        get().saveData();
      },

      updateDelivery: (id, delivery) => {
        set((state) => ({
          deliveries: state.deliveries.map((d) =>
            d.id === id ? { ...d, ...delivery, updatedAt: new Date().toISOString() } : d
          ),
        }));
        get().saveData();
      },

      saveDeliveryDocument: (delivery) => {
        const exists = get().deliveries.some((item) => item.id === delivery.id);
        set((state) => ({
          deliveries: exists
            ? state.deliveries.map((item) => (item.id === delivery.id ? delivery : item))
            : [...state.deliveries, delivery],
          settings: exists
            ? state.settings
            : {
                ...state.settings,
                numbering: {
                  ...state.settings.numbering,
                  deliveryCounter: state.settings.numbering.deliveryCounter + 1,
                },
              },
        }));
        get().saveData();
      },

      validateDelivery: (id) => {
        const delivery = get().deliveries.find((d) => d.id === id);
        if (!delivery || delivery.status !== 'draft') return;

        // Check stock availability
        const settings = get().settings;
        if (!settings.allowNegativeStock) {
          for (const line of delivery.lines) {
            const product = get().products.find((p) => p.id === line.productId);
            if (product && product.stockQuantity < line.quantity) {
              get().addAlert({
                type: 'system',
                priority: 'high',
                title: 'Stock insuffisant',
                message: `Stock insuffisant pour "${product.name}" (disponible: ${product.stockQuantity}, demandé: ${line.quantity})`,
                isRead: false,
              });
              return;
            }
          }
        }

        // Deduct stock for each line
        delivery.lines.forEach((line) => {
          get().updateStock(line.productId, -line.quantity, 'DELIVERY_OUT', id);
        });

        set((state) => ({
          deliveries: state.deliveries.map((d) =>
            d.id === id ? { ...d, status: 'validated', updatedAt: new Date().toISOString() } : d
          ),
        }));
        get().saveData();
        get().addAuditLog('VALIDATE', 'delivery', id, `Bon de livraison validé: ${delivery.number}`);
      },

      cancelDelivery: (id) => {
        const delivery = get().deliveries.find((d) => d.id === id);
        if (!delivery || delivery.status === 'cancelled') return;

        // Rollback stock if was validated
        if (delivery.status === 'validated') {
          delivery.lines.forEach((line) => {
            get().updateStock(line.productId, line.quantity, 'ADJUSTMENT_IN', id);
          });
        }

        set((state) => ({
          deliveries: state.deliveries.map((d) =>
            d.id === id ? { ...d, status: 'cancelled', updatedAt: new Date().toISOString() } : d
          ),
        }));
        get().saveData();
      },

      convertDeliveryToInvoice: (deliveryId) => {
        const delivery = get().deliveries.find((d) => d.id === deliveryId);
        if (!delivery || delivery.status !== 'validated' || delivery.convertedToInvoice) return null;

        const invoiceNumber = get().getNextNumber('invoice');
        const now = new Date().toISOString();

        const invoice: Invoice = {
          id: generateId(),
          number: invoiceNumber,
          date: now,
          clientId: delivery.clientId,
          clientName: delivery.clientName,
          status: 'validated',
          lines: delivery.lines,
          totals: delivery.totals,
          paymentStatus: 'unpaid',
          paidAmount: 0,
          deliveryNoteId: deliveryId,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          invoices: [...state.invoices, invoice],
          deliveries: state.deliveries.map((d) =>
            d.id === deliveryId ? { ...d, convertedToInvoice: true, invoiceId: invoice.id, updatedAt: now } : d
          ),
          settings: {
            ...state.settings,
            numbering: {
              ...state.settings.numbering,
              invoiceCounter: state.settings.numbering.invoiceCounter + 1,
            },
          },
        }));
        get().saveData();
        return invoice;
      },

      convertQuotationToDelivery: (quotationId) => {
        const quotation = get().quotations.find((q) => q.id === quotationId);
        if (!quotation) return null;
        const number = get().getNextNumber('delivery');
        const now = new Date().toISOString();
        const delivery: DeliveryNote = {
          id: generateId(),
          number,
          date: now,
          clientId: quotation.clientId,
          clientName: quotation.clientName,
          status: 'draft',
          lines: quotation.lines,
          totals: quotation.totals,
          branch: quotation.branch,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          deliveries: [...state.deliveries, delivery],
          settings: {
            ...state.settings,
            numbering: {
              ...state.settings.numbering,
              deliveryCounter: state.settings.numbering.deliveryCounter + 1,
            },
          },
        }));
        get().saveData();
        get().validateDelivery(delivery.id);
        return delivery;
      },

      convertQuotationToInvoice: (quotationId) => {
        const quotation = get().quotations.find((q) => q.id === quotationId);
        if (!quotation) return null;
        const number = get().getNextNumber('invoice');
        const now = new Date().toISOString();
        const invoice: Invoice = {
          id: generateId(),
          number,
          date: now,
          clientId: quotation.clientId,
          clientName: quotation.clientName,
          status: 'validated',
          lines: quotation.lines,
          totals: quotation.totals,
          paymentStatus: 'unpaid',
          paidAmount: 0,
          branch: quotation.branch,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          invoices: [...state.invoices, invoice],
          settings: {
            ...state.settings,
            numbering: {
              ...state.settings.numbering,
              invoiceCounter: state.settings.numbering.invoiceCounter + 1,
            },
          },
        }));
        get().saveData();
        return invoice;
      },

      // Sale Actions
      addSale: (sale) => {
        const now = new Date().toISOString();
        const newSale: Sale = {
          ...sale,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ sales: [...state.sales, newSale] }));

        // If credit sale, increase client debt
        if (sale.isCredit && sale.clientId) {
          const client = get().clients.find((c) => c.id === sale.clientId);
          if (client) {
            get().updateClient(sale.clientId, { debt: client.debt + sale.totals.totalTTC });
          }
        }

        // If cash sale, create cash entry
        if (!sale.isCredit && sale.paymentMethod === 'cash') {
          get().addCashEntry({
            dateTime: now,
            type: 'ENTREE',
            category: 'VENTE',
            amount: sale.totals.totalTTC,
            method: 'cash',
            referenceType: 'SALE',
            referenceId: newSale.id,
            description: `Vente ${sale.number}`,
          });
        }

        get().saveData();
      },

      updateSale: (id, sale) => {
        set((state) => ({
          sales: state.sales.map((s) =>
            s.id === id ? { ...s, ...sale, updatedAt: new Date().toISOString() } : s
          ),
        }));
        get().saveData();
      },

      deleteSale: (id) => {
        set((state) => ({ sales: state.sales.filter((sale) => sale.id !== id) }));
        get().saveData();
      },

      saveSaleDocument: (sale) => {
        const exists = get().sales.some((item) => item.id === sale.id);
        set((state) => ({
          sales: exists
            ? state.sales.map((item) => (item.id === sale.id ? sale : item))
            : [...state.sales, sale],
          settings: exists
            ? state.settings
            : {
                ...state.settings,
                numbering: {
                  ...state.settings.numbering,
                  saleCounter: state.settings.numbering.saleCounter + 1,
                },
              },
        }));
        get().saveData();
      },

      // Invoice Actions
      addInvoice: (invoice) => {
        const now = new Date().toISOString();
        const newInvoice: Invoice = {
          ...invoice,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ invoices: [...state.invoices, newInvoice] }));
        get().saveData();
      },

      updateInvoice: (id, invoice) => {
        set((state) => ({
          invoices: state.invoices.map((i) =>
            i.id === id ? { ...i, ...invoice, updatedAt: new Date().toISOString() } : i
          ),
        }));
        get().saveData();
      },

      saveInvoiceDocument: (invoice) => {
        const exists = get().invoices.some((item) => item.id === invoice.id);
        set((state) => ({
          invoices: exists
            ? state.invoices.map((item) => (item.id === invoice.id ? invoice : item))
            : [...state.invoices, invoice],
          settings: exists
            ? state.settings
            : {
                ...state.settings,
                numbering: {
                  ...state.settings.numbering,
                  invoiceCounter: state.settings.numbering.invoiceCounter + 1,
                },
              },
        }));
        get().saveData();
      },

      // Payment Actions
      addPayment: (payment) => {
        const now = new Date().toISOString();
        const newPayment: Payment = {
          ...payment,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ payments: [...state.payments, newPayment] }));

        // Update client debt
        if (payment.clientId) {
          const client = get().clients.find((c) => c.id === payment.clientId);
          if (client) {
            get().updateClient(payment.clientId, { debt: Math.max(0, client.debt - payment.amount) });
          }
          get().addCashEntry({
            dateTime: now,
            type: 'ENTREE',
            category: 'PAIEMENT_CLIENT',
            amount: payment.amount,
            method: payment.method,
            branch: payment.branch,
            referenceType: 'PAYMENT',
            referenceId: newPayment.id,
            description: `Paiement client`,
          });
        }

        // Update supplier balance and add cashbook entry
        if (payment.supplierId) {
          const supplier = get().suppliers.find((s) => s.id === payment.supplierId);
          if (supplier) {
            const nextBalance = Math.max(0, (supplier.balance || 0) - payment.amount);
            get().updateSupplier(payment.supplierId, { balance: nextBalance });
          }
          get().addCashEntry({
            dateTime: now,
            type: 'SORTIE',
            category: 'PAIEMENT_FOURNISSEUR',
            amount: payment.amount,
            method: payment.method,
            branch: payment.branch,
            referenceType: 'PAYMENT',
            referenceId: newPayment.id,
            description: payment.purchaseId 
              ? (() => {
                  const purchase = get().purchases.find(p => p.id === payment.purchaseId);
                  return purchase ? `Paiement fournisseur BA ${purchase.number}` : `Paiement fournisseur`;
                })()
              : `Paiement fournisseur`,
          });
        }

        // If linked to a purchase, update purchase payment status
        if (payment.purchaseId) {
          const purchase = get().purchases.find(p => p.id === payment.purchaseId);
          if (purchase) {
            const paymentsForPurchase = [...get().payments, newPayment].filter(pm => pm.purchaseId === payment.purchaseId);
            const totalPaid = paymentsForPurchase.reduce((sum, pm) => sum + pm.amount, 0);
            const totalDue = purchase.totals.totalTTC;
            const nextStatus: PaymentStatus = totalPaid >= totalDue ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
            get().updatePurchase(purchase.id, { paymentStatus: nextStatus });
          }
        }

        get().saveData();
      },

      // Cash Entry Actions
      addCashEntry: (entry) => {
        const now = new Date().toISOString();
        const newEntry: CashEntry = {
          ...entry,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ recettes: [...state.recettes, newEntry] }));
        get().saveData();
      },

      updateCashEntry: (id, entry) => {
        set((state) => ({
          recettes: state.recettes.map((r) =>
            r.id === id ? { ...r, ...entry, updatedAt: new Date().toISOString() } : r
          ),
        }));
        get().saveData();
      },

      deleteCashEntry: (id) => {
        set((state) => ({ recettes: state.recettes.filter((r) => r.id !== id) }));
        get().saveData();
      },

      // Bank Actions
      addBankAccount: (account) => {
        const now = new Date().toISOString();
        const newAccount: BankAccount = {
          ...account,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ bankAccounts: [...state.bankAccounts, newAccount] }));
        get().saveData();
        get().addAuditLog('CREATE', 'bank_account', newAccount.id, `Compte bancaire ajouté: ${newAccount.name}`);
      },

      updateBankAccount: (id, account) => {
        set((state) => ({
          bankAccounts: state.bankAccounts.map((a) =>
            a.id === id ? { ...a, ...account, updatedAt: new Date().toISOString() } : a
          ),
        }));
        get().saveData();
        get().addAuditLog('UPDATE', 'bank_account', id);
      },

      deleteBankAccount: (id) => {
        set((state) => ({ bankAccounts: state.bankAccounts.filter((a) => a.id !== id) }));
        get().saveData();
        get().addAuditLog('DELETE', 'bank_account', id);
      },

      addCheque: (cheque) => {
        const now = new Date().toISOString();
        const newCheque: Cheque = {
          ...cheque,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ cheques: [...state.cheques, newCheque] }));
        get().saveData();
        get().addAuditLog('CREATE', 'cheque', newCheque.id, `Chèque ajouté: ${newCheque.reference}`);
      },

      updateCheque: (id, cheque) => {
        set((state) => ({
          cheques: state.cheques.map((c) =>
            c.id === id ? { ...c, ...cheque, updatedAt: new Date().toISOString() } : c
          ),
        }));
        get().saveData();
        get().addAuditLog('UPDATE', 'cheque', id);
      },

      deleteCheque: (id) => {
        set((state) => ({ cheques: state.cheques.filter((c) => c.id !== id) }));
        get().saveData();
        get().addAuditLog('DELETE', 'cheque', id);
      },

      addBankTransfer: (transfer) => {
        const now = new Date().toISOString();
        const newTransfer: BankTransfer = {
          ...transfer,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ bankTransfers: [...state.bankTransfers, newTransfer] }));
        get().saveData();
        get().addAuditLog('CREATE', 'bank_transfer', newTransfer.id);
      },

      // Actions - Accounting Manual Entries
      addManualEntry: (entry) => {
        const now = new Date().toISOString();
        const newEntry: ManualEntry = {
          ...entry,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ manualEntries: [...state.manualEntries, newEntry] }));
        get().saveData();
        get().addAuditLog('CREATE', 'manual_entry', newEntry.id, `OD créée: ${newEntry.description}`);
      },

      updateManualEntry: (id, entry) => {
        set((state) => ({
          manualEntries: state.manualEntries.map((e) =>
            e.id === id ? { ...e, ...entry, updatedAt: new Date().toISOString() } : e
          ),
        }));
        get().saveData();
        get().addAuditLog('UPDATE', 'manual_entry', id);
      },

      deleteManualEntry: (id) => {
        set((state) => ({ manualEntries: state.manualEntries.filter((e) => e.id !== id) }));
        get().saveData();
        get().addAuditLog('DELETE', 'manual_entry', id);
      },

      // Alert Actions
      markAlertRead: (id) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, isRead: true, updatedAt: new Date().toISOString() } : a
          ),
        }));
        get().saveData();
      },

      markAllAlertsRead: () => {
        const now = new Date().toISOString();
        set((state) => ({
          alerts: state.alerts.map((a) => ({ ...a, isRead: true, updatedAt: now })),
        }));
        get().saveData();
      },

      deleteAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        }));
        get().saveData();
      },

      clearAllAlerts: () => {
        set({ alerts: [] });
        get().saveData();
      },

      addAlert: (alert) => {
        const now = new Date().toISOString();
        const newAlert: Alert = {
          ...alert,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ alerts: [...state.alerts, newAlert] }));
        get().saveData();
      },

      // Settings Actions
      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
        get().saveData();
      },

      updateFeatures: (features) => {
        set((state) => ({
          settings: {
            ...state.settings,
            features: { ...state.settings.features, ...features },
          },
        }));
        get().saveData();
      },

      // UI Actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Audit Log
      addAuditLog: (action, entityType, entityId, details) => {
        const now = new Date().toISOString();
        const log: AuditLog = {
          id: generateId(),
          action,
          entityType,
          entityId,
          details,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ auditLogs: [...state.auditLogs, log] }));
        // Don't save immediately to avoid too many writes
      },

      // Get next document number
      getNextNumber: (type) => {
        const state = get();
        const year = new Date().getFullYear();
        let prefix = '';
        let counter = 0;

        switch (type) {
          case 'invoice':
            prefix = state.settings.numbering?.invoicePrefix || 'FAC';
            counter = state.settings.numbering?.invoiceCounter || 1;
            break;
          case 'delivery':
            prefix = state.settings.numbering?.deliveryPrefix || 'BL';
            counter = state.settings.numbering?.deliveryCounter || 1;
            break;
          case 'purchase':
            prefix = state.settings.numbering?.purchasePrefix || 'BA';
            counter = state.settings.numbering?.purchaseCounter || 1;
            break;
          case 'sale':
            prefix = state.settings.numbering?.salePrefix || 'VT';
            counter = state.settings.numbering?.saleCounter || 1;
            break;
          case 'quotation':
            prefix = state.settings.numbering?.quotationPrefix || 'DV';
            counter = state.settings.numbering?.quotationCounter || 1;
            break;
        }

        return `${prefix}-${year}-${String(counter).padStart(4, '0')}`;
      },
    })
);
