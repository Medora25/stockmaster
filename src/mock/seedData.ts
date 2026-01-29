// =====================================
// Seed Data - Initial Data for First Launch
// =====================================

import { 
  LocalDatabase, 
  AppSettings, 
  Client, 
  Supplier, 
  Product, 
  Category,
  User,
  FeatureFlags,
  Purchase,
  Sale,
  DeliveryNote,
  CashEntry,
  DocumentLine,
} from '@/core/types';

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get current timestamp
const now = () => new Date().toISOString();

// Default Feature Flags
const defaultFeatures: FeatureFlags = {
  clients: true,
  suppliers: true,
  products: true,
  achats: true,
  bonAchat: true,
  bonLivraison: true,
  ventes: true,
  facturation: true,
  inventaire: true,
  alertes: true,
  recettes: true,
  parametres: true,
  accounting: true,
  bankOperations: true,
  devis: true,
  promotions: false,
  sav: false,
  retours: false,
  multiEntrepots: false,
  pos: false,
};

// Default App Settings
export const defaultSettings: AppSettings = {
  company: {
    name: 'Mon Entreprise SARL',
    nameAr: 'شركتي ش.م.م',
    address: '123 Rue Mohammed V',
    city: 'Casablanca',
    phone: '+212 5 22 00 00 00',
    email: 'contact@monentreprise.ma',
    ice: '001234567000012',
    if: '12345678',
    rc: 'RC12345',
    cnss: '1234567',
  },
  numbering: {
    invoicePrefix: 'FAC',
    invoiceCounter: 1,
    deliveryPrefix: 'BL',
    deliveryCounter: 1,
    purchasePrefix: 'BA',
    purchaseCounter: 1,
    salePrefix: 'VT',
    saleCounter: 1,
    quotationPrefix: 'DV',
    quotationCounter: 1,
  },
  features: defaultFeatures,
  defaultTvaRate: 20,
  currency: 'MAD',
  language: 'fr',
  theme: 'light',
  primaryColor: 'blue',
  themePreset: 'ocean',
  cardBrightness: 'glass',
  backgroundGradient: true,
  backgroundPattern: false,
  allowNegativeStock: false,
  branches: ['Siège'],
  defaultBranch: 'Siège',
};

// Seed Categories
const seedCategories: Category[] = [
  { id: generateId(), name: 'Électronique', nameAr: 'إلكترونيات', description: 'Produits électroniques', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Alimentaire', nameAr: 'مواد غذائية', description: 'Produits alimentaires', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Textile', nameAr: 'نسيج', description: 'Vêtements et tissus', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Cosmétique', nameAr: 'مستحضرات التجميل', description: 'Produits de beauté', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Ménager', nameAr: 'أدوات منزلية', description: 'Articles ménagers', isActive: true, createdAt: now(), updatedAt: now() },
];

// Seed Clients
const seedClients: Client[] = [
  { id: generateId(), name: 'Ahmed Benali', email: 'ahmed@example.com', phone: '+212 6 12 34 56 78', address: '45 Rue Hassan II', city: 'Rabat', ice: '001234567000001', debt: 2500, creditLimit: 10000, isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Fatima Zahra', email: 'fatima@example.com', phone: '+212 6 98 76 54 32', address: '78 Bd Zerktouni', city: 'Casablanca', debt: 0, creditLimit: 5000, isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Société Atlas SARL', email: 'contact@atlas.ma', phone: '+212 5 22 11 22 33', address: '12 Zone Industrielle', city: 'Tanger', ice: '001234567000002', debt: 15000, creditLimit: 50000, isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Mohamed El Fassi', email: 'mfassi@example.com', phone: '+212 6 55 44 33 22', address: '90 Rue Fès', city: 'Fès', debt: 800, creditLimit: 3000, isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Karim Tazi', phone: '+212 6 11 22 33 44', city: 'Marrakech', debt: 0, isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Entreprise Maghreb SA', email: 'info@maghreb-sa.ma', phone: '+212 5 37 00 11 22', address: '5 Av Mohammed VI', city: 'Rabat', ice: '001234567000003', debt: 45000, creditLimit: 100000, isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Youssef Alami', email: 'yalami@gmail.com', phone: '+212 6 77 88 99 00', city: 'Agadir', debt: 1200, isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Nadia Chraibi', phone: '+212 6 22 33 44 55', address: '34 Rue Anfa', city: 'Casablanca', debt: 0, isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Société Delta Import', email: 'delta@import.ma', phone: '+212 5 28 00 00 00', address: '100 Zone Franche', city: 'Tanger', ice: '001234567000004', debt: 8500, creditLimit: 25000, isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Hassan Bennani', email: 'hbennani@example.com', phone: '+212 6 44 55 66 77', city: 'Oujda', debt: 350, isActive: false, createdAt: now(), updatedAt: now() },
];

// Seed Suppliers
const seedSuppliers: Supplier[] = [
  { id: generateId(), name: 'Fournisseur Alpha SARL', email: 'alpha@supplier.ma', phone: '+212 5 22 55 66 77', address: '15 Zone Industrielle Ain Sebaa', city: 'Casablanca', ice: '002345678000001', rc: '12345', if: '9876543', cnss: '11223344', balance: 0, isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Import Global SA', email: 'contact@importglobal.ma', phone: '+212 5 37 88 99 00', address: '45 Port Tanger Med', city: 'Tanger', ice: '002345678000002', balance: 12000, isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Distribution Omega', email: 'omega@dist.ma', phone: '+212 5 24 11 22 33', city: 'Marrakech', balance: 5500, isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Société Beta Trading', phone: '+212 5 39 44 55 66', address: '78 Rue Commerce', city: 'Fès', ice: '002345678000003', balance: 0, isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), name: 'Grossiste National', email: 'grossiste@nat.ma', phone: '+212 5 22 77 88 99', city: 'Casablanca', balance: 28000, isActive: true, createdAt: now(), updatedAt: now() },
];

// Seed Products
const seedProducts: Product[] = [
  { id: generateId(), sku: 'ELEC-001', barcode: '6111234567890', name: 'Téléphone Smartphone X', nameAr: 'هاتف ذكي X', categoryId: seedCategories[0].id, purchasePrice: 2500, salePrice: 3200, tvaRate: 20, stockQuantity: 25, stockMin: 5, unit: 'pièce', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), sku: 'ELEC-002', barcode: '6111234567891', name: 'Tablette Pro 10"', nameAr: 'لوحة برو 10"', categoryId: seedCategories[0].id, purchasePrice: 1800, salePrice: 2400, tvaRate: 20, stockQuantity: 15, stockMin: 3, unit: 'pièce', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), sku: 'ELEC-003', name: 'Écouteurs Bluetooth', nameAr: 'سماعات بلوتوث', categoryId: seedCategories[0].id, purchasePrice: 150, salePrice: 250, tvaRate: 20, stockQuantity: 50, stockMin: 10, unit: 'pièce', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), sku: 'ALIM-001', barcode: '6111234567892', name: 'Huile d\'olive 1L', nameAr: 'زيت الزيتون 1 لتر', categoryId: seedCategories[1].id, purchasePrice: 45, salePrice: 65, tvaRate: 0, stockQuantity: 100, stockMin: 20, unit: 'litre', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), sku: 'ALIM-002', name: 'Thé vert premium 250g', nameAr: 'شاي أخضر ممتاز 250غ', categoryId: seedCategories[1].id, purchasePrice: 35, salePrice: 55, tvaRate: 0, stockQuantity: 80, stockMin: 15, unit: 'pièce', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), sku: 'TEXT-001', name: 'T-shirt coton XL', nameAr: 'تي شيرت قطن XL', categoryId: seedCategories[2].id, purchasePrice: 40, salePrice: 80, tvaRate: 20, stockQuantity: 200, stockMin: 30, unit: 'pièce', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), sku: 'TEXT-002', name: 'Jean slim homme', nameAr: 'جينز رجالي', categoryId: seedCategories[2].id, purchasePrice: 120, salePrice: 220, tvaRate: 20, stockQuantity: 75, stockMin: 10, unit: 'pièce', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), sku: 'COSM-001', barcode: '6111234567893', name: 'Crème hydratante 50ml', nameAr: 'كريم مرطب 50مل', categoryId: seedCategories[3].id, purchasePrice: 60, salePrice: 120, tvaRate: 20, stockQuantity: 40, stockMin: 8, unit: 'pièce', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), sku: 'COSM-002', name: 'Parfum 100ml', nameAr: 'عطر 100مل', categoryId: seedCategories[3].id, purchasePrice: 200, salePrice: 380, tvaRate: 20, stockQuantity: 3, stockMin: 5, unit: 'pièce', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), sku: 'MENA-001', name: 'Aspirateur 2000W', nameAr: 'مكنسة كهربائية 2000 واط', categoryId: seedCategories[4].id, purchasePrice: 800, salePrice: 1200, tvaRate: 20, stockQuantity: 12, stockMin: 3, unit: 'pièce', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), sku: 'MENA-002', name: 'Mixeur électrique', nameAr: 'خلاط كهربائي', categoryId: seedCategories[4].id, purchasePrice: 350, salePrice: 550, tvaRate: 20, stockQuantity: 20, stockMin: 5, unit: 'pièce', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), sku: 'ELEC-004', name: 'Chargeur rapide USB-C', nameAr: 'شاحن سريع USB-C', categoryId: seedCategories[0].id, purchasePrice: 80, salePrice: 150, tvaRate: 20, stockQuantity: 60, stockMin: 15, unit: 'pièce', isActive: true, createdAt: now(), updatedAt: now() },
];

// Seed Users
const seedUsers: User[] = [
  { id: generateId(), username: 'admin', name: 'Administrateur', email: 'admin@example.com', role: 'admin', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), username: 'manager', name: 'Responsable Stock', email: 'manager@example.com', role: 'manager', isActive: true, createdAt: now(), updatedAt: now() },
  { id: generateId(), username: 'caissier', name: 'Caissier', role: 'cashier', isActive: true, createdAt: now(), updatedAt: now() },
];

// Seed Purchases
const seedPurchases: Purchase[] = [
  {
    id: generateId(),
    number: 'BA-2026-001',
    date: now(),
    supplierId: seedSuppliers[0].id,
    supplierName: seedSuppliers[0].name,
    status: 'VALIDATED',
    paymentStatus: 'PAID',
    branch: 'Siège',
    lines: [
      { id: generateId(), productId: seedProducts[0].id, productName: seedProducts[0].name, quantity: 10, unitPrice: 2500, tvaRate: 20, totalHT: 25000, totalTVA: 5000, totalTTC: 30000 },
      { id: generateId(), productId: seedProducts[1].id, productName: seedProducts[1].name, quantity: 5, unitPrice: 1800, tvaRate: 20, totalHT: 9000, totalTVA: 1800, totalTTC: 10800 },
    ],
    totals: { totalHT: 34000, totalTVA: 6800, totalTTC: 40800, totalDiscount: 0 },
    createdAt: now(),
    updatedAt: now(),
  },
];

// Seed Sales
const seedSales: Sale[] = [
  {
    id: generateId(),
    number: 'VT-2026-001',
    date: now(),
    clientId: seedClients[0].id,
    clientName: seedClients[0].name,
    status: 'VALIDATED',
    paymentStatus: 'PAID',
    branch: 'Siège',
    lines: [
      { id: generateId(), productId: seedProducts[0].id, productName: seedProducts[0].name, quantity: 1, unitPrice: 3200, tvaRate: 20, totalHT: 3200, totalTVA: 640, totalTTC: 3840 },
    ],
    totals: { totalHT: 3200, totalTVA: 640, totalTTC: 3840, totalDiscount: 0 },
    createdAt: now(),
    updatedAt: now(),
  },
];

// Seed Deliveries
const seedDeliveries: DeliveryNote[] = [
  {
    id: generateId(),
    number: 'BL-2026-001',
    date: now(),
    clientId: seedClients[1].id,
    clientName: seedClients[1].name,
    status: 'validated',
    branch: 'Siège',
    lines: [
      { id: generateId(), productId: seedProducts[2].id, productName: seedProducts[2].name, quantity: 2, unitPrice: 250, tvaRate: 20, totalHT: 500, totalTVA: 100, totalTTC: 600 },
      { id: generateId(), productId: seedProducts[4].id, productName: seedProducts[4].name, quantity: 3, unitPrice: 55, tvaRate: 0, totalHT: 165, totalTVA: 0, totalTTC: 165 },
    ],
    totals: { totalHT: 665, totalTVA: 100, totalTTC: 765, totalDiscount: 0 },
    createdAt: now(),
    updatedAt: now(),
    driverName: 'Transporteur A',
    vehicleInfo: 'Camion 12-AB-3456',
  },
];

// Seed Cashbook (Recettes)
const seedRecettes: CashEntry[] = [
  {
    id: generateId(),
    dateTime: now(),
    type: 'ENTREE',
    category: 'VENTE',
    amount: 3840,
    method: 'cash',
    referenceType: 'SALE',
    referenceId: seedSales[0].id,
    description: 'Paiement comptant vente VT-2026-001',
    notes: 'Client a payé en espèces',
    branch: 'Siège',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: generateId(),
    dateTime: now(),
    type: 'SORTIE',
    category: 'DEPENSE',
    amount: 120.5,
    method: 'cash',
    description: 'Achat fournitures bureau',
    notes: 'Papeterie et petits matériels',
    branch: 'Siège',
    createdAt: now(),
    updatedAt: now(),
  },
];

// Get default empty database structure
export const getDefaultDatabase = (): LocalDatabase => ({
  version: '1.0.0',
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
  users: seedUsers,
  auditLogs: [],
  bankTransfers: [],
  cheques: [],
  settings: defaultSettings,
});

// Get database with seed data
export const getSeedData = (): LocalDatabase => ({
  version: '1.0.0',
  clients: seedClients,
  suppliers: seedSuppliers,
  products: seedProducts,
  categories: seedCategories,
  quotations: [],
  purchases: seedPurchases,
  deliveries: seedDeliveries,
  sales: seedSales,
  invoices: [],
  payments: [],
  recettes: seedRecettes,
  stockMovements: [],
  alerts: [
    { 
      id: generateId(), 
      type: 'stock_rupture', 
      priority: 'high', 
      title: 'Stock faible', 
      message: 'Le produit "Parfum 100ml" est en dessous du stock minimum (3/5)', 
      isRead: false, 
      referenceType: 'product', 
      referenceId: seedProducts[8].id, 
      createdAt: now(), 
      updatedAt: now() 
    },
    { 
      id: generateId(), 
      type: 'client_impaye', 
      priority: 'medium', 
      title: 'Client avec dette élevée', 
      message: 'Entreprise Maghreb SA a une dette de 45,000 MAD', 
      isRead: false, 
      referenceType: 'client', 
      referenceId: seedClients[5].id, 
      createdAt: now(), 
      updatedAt: now() 
    },
  ],
  users: seedUsers,
  auditLogs: [],
  bankTransfers: [],
  cheques: [],
  settings: defaultSettings,
});
