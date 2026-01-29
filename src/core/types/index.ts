// =====================================
// Core Types - Gestion de Stock Maroc
// =====================================

// Base Entity
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Client
export interface Client extends BaseEntity {
  name: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  address?: string;
  addressAr?: string;
  city?: string;
  ice?: string; // Identifiant Commun de l'Entreprise
  debt: number;
  creditLimit?: number;
  notes?: string;
  isActive: boolean;
}

// Supplier (Fournisseur)
export interface Supplier extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  ice?: string;
  if?: string; // Identifiant Fiscal
  rc?: string; // Registre de Commerce
  cnss?: string;
  balance: number;
  notes?: string;
  isActive: boolean;
}

// Category
export interface Category extends BaseEntity {
  name: string;
  nameAr?: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
}

// Product
export interface Product extends BaseEntity {
  sku: string;
  barcode?: string;
  name: string;
  nameAr?: string;
  description?: string;
  categoryId?: string;
  purchasePrice: number;
  salePrice: number;
  tvaRate: number; // TVA percentage (0, 7, 10, 14, 20)
  stockQuantity: number;
  stockMin: number;
  unit: string; // pièce, kg, litre, etc.
  isActive: boolean;
}

// Document Line
export interface DocumentLine {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage
  tvaRate: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

// Document Totals
export interface DocumentTotals {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  totalDiscount: number;
}

// Document Status
export type DocumentStatus = 'draft' | 'validated' | 'cancelled';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type PaymentMethod = 'cash' | 'cheque' | 'virement' | 'carte';

// Purchase (Bon d'Achat - BA)
export interface Purchase extends BaseEntity {
  number: string; // BA-YYYY-0001
  date: string;
  supplierId: string;
  supplierName?: string;
  status: DocumentStatus;
  lines: DocumentLine[];
  totals: DocumentTotals;
  paymentStatus: PaymentStatus;
  notes?: string;
  branch?: string;
}

// Delivery Note (Bon de Livraison - BL)
export interface DeliveryNote extends BaseEntity {
  number: string; // BL-YYYY-0001
  date: string;
  clientId: string;
  clientName?: string;
  status: DocumentStatus;
  lines: DocumentLine[];
  totals: DocumentTotals;
  driverName?: string;
  vehicleInfo?: string;
  notes?: string;
  convertedToInvoice?: boolean;
  invoiceId?: string;
  branch?: string;
}

export interface Quotation extends BaseEntity {
  number: string;
  date: string;
  clientId: string;
  clientName?: string;
  status: DocumentStatus;
  lines: DocumentLine[];
  totals: DocumentTotals;
  validUntil?: string;
  notes?: string;
  branch?: string;
}

// Sale
export interface Sale extends BaseEntity {
  number: string; // VT-YYYY-0001
  date: string;
  clientId: string;
  clientName?: string;
  status: DocumentStatus;
  lines: DocumentLine[];
  totals: DocumentTotals;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAmount?: number;
  isCredit: boolean;
  notes?: string;
  invoiceId?: string;
  deliveryNoteId?: string;
  branch?: string;
}

// Invoice (Facture)
export interface Invoice extends BaseEntity {
  number: string; // FAC-YYYY-0001
  date: string;
  dueDate?: string;
  clientId: string;
  clientName?: string;
  status: DocumentStatus;
  lines: DocumentLine[];
  totals: DocumentTotals;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  notes?: string;
  saleId?: string;
  deliveryNoteId?: string;
  branch?: string;
}

// Payment
export interface Payment extends BaseEntity {
  date: string;
  clientId?: string;
  supplierId?: string;
  invoiceId?: string;
  purchaseId?: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  branch?: string;
}

// Cash Entry (Recette/Caisse)
export type CashEntryType = 'ENTREE' | 'SORTIE';
export type CashEntryCategory = 'VENTE' | 'PAIEMENT_CLIENT' | 'PAIEMENT_FOURNISSEUR' | 'DEPENSE' | 'ACHAT' | 'AUTRE' | 'CHEQUE_DEPOSIT' | 'CHEQUE_WITHDRAWAL';

export interface CashEntry extends BaseEntity {
  dateTime: string;
  type: CashEntryType;
  category: CashEntryCategory;
  amount: number;
  method: PaymentMethod;
  referenceType?: 'SALE' | 'INVOICE' | 'PAYMENT' | 'PURCHASE' | 'CHEQUE';
  referenceId?: string;
  description?: string;
  notes?: string;
  branch?: string;
}

// Stock Movement
export type StockMovementType = 
  | 'PURCHASE_IN' 
  | 'SALE_OUT' 
  | 'DELIVERY_OUT' 
  | 'ADJUSTMENT_IN' 
  | 'ADJUSTMENT_OUT'
  | 'RETURN_IN'
  | 'RETURN_OUT';

export interface StockMovement extends BaseEntity {
  type: StockMovementType;
  productId: string;
  productName?: string;
  quantity: number; // positive for IN, negative for OUT
  previousStock: number;
  newStock: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  branch?: string;
}

// Alert
export type AlertType = 'stock_rupture' | 'client_impaye' | 'system' | 'warning';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Alert extends BaseEntity {
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  isRead: boolean;
  referenceType?: string;
  referenceId?: string;
}

// User
export type UserRole = 'admin' | 'manager' | 'cashier' | 'viewer';

export interface User extends BaseEntity {
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
}

// Audit Log
export interface AuditLog extends BaseEntity {
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}

// Cheque Status
export type ChequeStatus = 'pending' | 'cashed' | 'bounced' | 'cancelled';

// Bank Account
export interface BankAccount extends BaseEntity {
  name: string;
  bankName: string; // e.g. "CIH", "Attijari"
  rib: string;
  balance: number;
  initialBalance: number;
  currency: string;
  isActive: boolean;
  notes?: string;
}

// Cheque
export interface Cheque extends BaseEntity {
  reference: string;
  cashingDate: string; // YYYY-MM-DD
  fullName: string;
  amount: number;
  status: ChequeStatus;
  bankName?: string;
  notes?: string;
  // Link to other entities if necessary, e.g., paymentId, cashEntryId
  paymentId?: string;
  cashEntryId?: string;
  bankAccountId?: string; // The account where this cheque was deposited/cashed
}

export type BankTransferType =
  | 'ESPECE_TO_BANQUE'
  | 'CHEQUE_TO_BANQUE'
  | 'BANQUE_TO_ESPECE'
  | 'BANQUE_TO_BANQUE';

export interface BankTransfer extends BaseEntity {
  dateTime: string;
  type: BankTransferType;
  amount: number;
  notes?: string;
  fromMethod: PaymentMethod;
  toMethod: PaymentMethod;
  cashEntryIds?: string[];
  chequeId?: string;
  fromAccountId?: string;
  toAccountId?: string;
}

// Manual Entry (OD - Opérations Diverses)
export interface ManualEntry extends BaseEntity {
  date: string;
  reference: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  branch?: string;
}

// Account Settings (Plan Comptable Mapping)
export interface AccountSettings {
  salesAccount: string; // e.g. 7111
  purchasesAccount: string; // e.g. 6111
  vatCollectedAccount: string; // e.g. 4455
  vatDeductibleAccount: string; // e.g. 3455
  clientAccount: string; // e.g. 3421
  supplierAccount: string; // e.g. 4411
  cashAccount: string; // e.g. 5161
  bankAccount: string; // e.g. 5141
  expensesAccount?: string; // e.g. 61xx
}

// Company Settings
export interface CompanySettings {
  name: string;
  nameAr?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  ice?: string; // Identifiant Commun de l'Entreprise
  if?: string; // Identifiant Fiscal
  rc?: string; // Registre de Commerce
  cnss?: string;
  logo?: string;
}

// Numbering Settings
export interface NumberingSettings {
  invoicePrefix: string;
  invoiceCounter: number;
  deliveryPrefix: string;
  deliveryCounter: number;
  purchasePrefix: string;
  purchaseCounter: number;
  salePrefix: string;
  saleCounter: number;
  quotationPrefix?: string;
  quotationCounter?: number;
}

// Feature Flags
export interface FeatureFlags {
  clients: boolean;
  suppliers: boolean;
  products: boolean;
  achats: boolean;
  bonAchat: boolean;
  bonLivraison: boolean;
  ventes: boolean;
  facturation: boolean;
  inventaire: boolean;
  alertes: boolean;
  recettes: boolean;
  parametres: boolean;
  accounting: boolean;
  bankOperations?: boolean;
  devis?: boolean;
  // Optional
  promotions: boolean;
  sav: boolean;
  retours: boolean;
  multiEntrepots: boolean;
  pos: boolean;
}

// App Settings
export interface AppSettings {
  company: CompanySettings;
  numbering: NumberingSettings;
  features: FeatureFlags;
  defaultTvaRate: number;
  currency: string;
  language: 'fr' | 'ar';
  theme: 'light' | 'dark' | 'system';
  primaryColor?: 'blue' | 'green' | 'amber' | 'violet' | 'teal' | 'rose' | 'indigo';
  themePreset?: 'corporate' | 'minimal' | 'vibrant' | 'ocean' | 'forest' | 'sunset' | 'aurora' | 'royale' | 'citrus';
  cardBrightness?: 'light' | 'glass' | 'dim';
  backgroundGradient?: boolean;
  backgroundPattern?: boolean;
  navigationTheme?: 'dark' | 'light';
  allowNegativeStock: boolean;
  branches?: string[];
  defaultBranch?: string;
  accountSettings?: AccountSettings;
}

// Local Database Structure
export interface LocalDatabase {
  version: string;
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
  bankTransfers?: BankTransfer[];
  cheques: Cheque[];
  bankAccounts?: BankAccount[];
  manualEntries?: ManualEntry[];
  settings: AppSettings;
}
