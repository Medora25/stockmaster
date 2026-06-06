// =====================================
// Storage Service - Supabase multi-table sync
// =====================================

import { LocalDatabase } from '@/core/types';
import { getDefaultDatabase, getSeedData } from '@/mock/seedData';
import { supabase } from '@/lib/supabase';

const LEGACY_DB_KEY = 'gst:v1:db';
const CURRENT_VERSION = '1.0.0';
const SETTINGS_ROW_ID = 'default';

const COLLECTION_TABLES = {
  clients: 'clients',
  suppliers: 'suppliers',
  products: 'products',
  categories: 'categories',
  quotations: 'quotations',
  purchases: 'purchases',
  deliveries: 'deliveries',
  sales: 'sales',
  invoices: 'invoices',
  payments: 'payments',
  recettes: 'cash_entries',
  stockMovements: 'stock_movements',
  alerts: 'alerts',
  users: 'app_users',
  auditLogs: 'audit_logs',
  bankAccounts: 'bank_accounts',
  cheques: 'cheques',
  bankTransfers: 'bank_transfers',
  manualEntries: 'manual_entries',
} as const;

type CollectionKey = keyof typeof COLLECTION_TABLES;

type EntityRow = {
  id: string;
  payload: unknown;
  user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SettingsRow = {
  id: string;
  payload: LocalDatabase['settings'];
  user_id?: string | null;
};

class StorageService {
  private cache: LocalDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private saveQueue: Promise<void> = Promise.resolve();
  private ownershipSupport: boolean | null = null;
  private ownershipCheckPromise: Promise<boolean> | null = null;

  async initialize(): Promise<void> {
    if (this.cache) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.bootstrap().finally(() => {
      this.initPromise = null;
    });

    return this.initPromise;
  }

  load(): LocalDatabase {
    if (this.cache) return this.cache;

    const fallbackDb = this.normalizeDatabase(this.loadLegacyLocalDatabase() ?? getDefaultDatabase());
    this.cache = fallbackDb;
    return fallbackDb;
  }

  save(db: LocalDatabase): void {
    const previousDb = this.cache;
    const nextDb = this.normalizeDatabase(db);
    this.cache = nextDb;

    const changedCollections = this.getChangedCollections(previousDb, nextDb);
    const settingsChanged = this.didValueChange(previousDb?.settings, nextDb.settings);

    this.queueRemoteSync(async () => {
      await this.syncCollections(changedCollections, nextDb);
      if (settingsChanged) {
        await this.syncSettings(nextDb.settings);
      }
    });
  }

  loadCollection<K extends keyof LocalDatabase>(key: K): LocalDatabase[K] {
    return this.load()[key];
  }

  saveCollection<K extends keyof LocalDatabase>(key: K, data: LocalDatabase[K]): void {
    const db = this.load();
    db[key] = data;
    this.cache = this.normalizeDatabase(db);

    if (key === 'settings') {
      this.queueRemoteSync(() => this.syncSettings(this.cache!.settings));
      return;
    }

    if (this.isCollectionKey(key)) {
      this.queueRemoteSync(() => this.syncCollection(key, this.cache![key]));
    }
  }

  remove<K extends keyof LocalDatabase>(
    collectionKey: K,
    predicate: (item: LocalDatabase[K] extends Array<infer E> ? E : never) => boolean
  ): void {
    const db = this.load();
    const collection = db[collectionKey];

    if (Array.isArray(collection)) {
      type Element = LocalDatabase[K] extends Array<infer E> ? E : never;
      const filtered = (collection as Element[]).filter((item) => !predicate(item));
      (db[collectionKey] as Element[]) = filtered;
      this.save(db);
    }
  }

  resetAll(): void {
    const seedDb = this.normalizeDatabase(getSeedData());
    this.clearLegacyLocalDatabase();
    this.cache = seedDb;

    this.queueRemoteSync(async () => {
      await this.syncAll(seedDb);
    });
  }

  exportData(): string {
    return JSON.stringify(this.load(), null, 2);
  }

  importData(jsonString: string): boolean {
    try {
      const db = JSON.parse(jsonString) as LocalDatabase;
      this.save(this.normalizeDatabase(db));
      return true;
    } catch (error) {
      console.error('Error importing database:', error);
      return false;
    }
  }

  getSize(): number {
    return new Blob([JSON.stringify(this.load())]).size / 1024;
  }

  clearCache(): void {
    this.cache = null;
  }

  private async bootstrap(): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        this.cache = this.normalizeDatabase(this.loadLegacyLocalDatabase() ?? getDefaultDatabase());
        return;
      }

      const remoteDb = await this.loadRemoteDatabase();

      if (remoteDb) {
        this.cache = remoteDb;
        this.clearLegacyLocalDatabase();
        return;
      }

      const fallbackDb = this.normalizeDatabase(this.loadLegacyLocalDatabase() ?? getSeedData());
      this.cache = fallbackDb;
      await this.syncAll(fallbackDb);
      this.clearLegacyLocalDatabase();
    } catch (error) {
      console.error('Error initializing Supabase storage:', error);
      this.cache = this.normalizeDatabase(this.loadLegacyLocalDatabase() ?? getDefaultDatabase());
    }
  }

  private async loadRemoteDatabase(): Promise<LocalDatabase | null> {
    const db = this.normalizeDatabase(getDefaultDatabase());
    let hasRemoteData = false;
    const ownershipEnabled = await this.hasOwnershipSupport();

    await Promise.all(
      (Object.entries(COLLECTION_TABLES) as [CollectionKey, string][]).map(async ([key, table]) => {
        const { data, error } = await supabase
          .from(table)
          .select(
            ownershipEnabled
              ? 'id,user_id,payload,created_at,updated_at'
              : 'id,payload,created_at,updated_at'
          )
          .order('created_at', { ascending: true });

        if (error) throw error;

        const rows = (data || []) as EntityRow[];
        if (rows.length > 0) {
          hasRemoteData = true;
        }

        db[key] = rows.map((row) => row.payload) as LocalDatabase[CollectionKey];
      })
    );

    const { data: settingsRow, error: settingsError } = await supabase
      .from('app_settings')
      .select(ownershipEnabled ? 'id,user_id,payload' : 'id,payload')
      .eq('id', SETTINGS_ROW_ID)
      .maybeSingle();

    if (settingsError) throw settingsError;

    if (settingsRow) {
      hasRemoteData = true;
      db.settings = (settingsRow as SettingsRow).payload;
    }

    return hasRemoteData ? this.normalizeDatabase(db) : null;
  }

  private async syncAll(db: LocalDatabase): Promise<void> {
    await this.syncCollections(Object.keys(COLLECTION_TABLES) as CollectionKey[], db);
    await this.syncSettings(db.settings);
  }

  private async syncCollections(keys: CollectionKey[], db: LocalDatabase): Promise<void> {
    for (const key of keys) {
      await this.syncCollection(key, db[key]);
    }
  }

  private async syncCollection<K extends CollectionKey>(key: K, value: LocalDatabase[K]): Promise<void> {
    const table = COLLECTION_TABLES[key];
    const items = Array.isArray(value) ? value : [];
    const ownershipEnabled = await this.hasOwnershipSupport();
    const userId = ownershipEnabled ? await this.getAuthenticatedUserId() : null;

    let deleteQuery = supabase.from(table).delete();
    deleteQuery = ownershipEnabled && userId
      ? deleteQuery.eq('user_id', userId)
      : deleteQuery.not('id', 'is', null);

    const { error: deleteError } = await deleteQuery;
    if (deleteError) throw deleteError;

    if (items.length === 0) return;

    const rows = items.map((item) => ({
      id: item.id,
      ...(ownershipEnabled && userId ? { user_id: userId } : {}),
      payload: item,
      created_at: item.createdAt ?? new Date().toISOString(),
      updated_at: item.updatedAt ?? new Date().toISOString(),
    }));

    const { error: insertError } = await supabase.from(table).insert(rows);
    if (insertError) throw insertError;
  }

  private async syncSettings(settings: LocalDatabase['settings']): Promise<void> {
    const ownershipEnabled = await this.hasOwnershipSupport();
    const userId = ownershipEnabled ? await this.getAuthenticatedUserId() : null;
    const payload = {
      id: SETTINGS_ROW_ID,
      ...(ownershipEnabled && userId ? { user_id: userId } : {}),
      payload: settings,
    };

    const { error } = await supabase
      .from('app_settings')
      .upsert(payload, ownershipEnabled ? { onConflict: 'user_id,id' } : undefined);

    if (error) throw error;
  }

  private queueRemoteSync(task: () => Promise<void>): void {
    this.saveQueue = this.saveQueue
      .catch(() => undefined)
      .then(task)
      .catch((error) => {
        console.error('Failed to sync data with Supabase:', error);
      });
  }

  private getChangedCollections(
    previousDb: LocalDatabase | null,
    nextDb: LocalDatabase
  ): CollectionKey[] {
    if (!previousDb) {
      return Object.keys(COLLECTION_TABLES) as CollectionKey[];
    }

    return (Object.keys(COLLECTION_TABLES) as CollectionKey[]).filter((key) =>
      this.didValueChange(previousDb[key], nextDb[key])
    );
  }

  private didValueChange(previousValue: unknown, nextValue: unknown): boolean {
    return JSON.stringify(previousValue ?? null) !== JSON.stringify(nextValue ?? null);
  }

  private loadLegacyLocalDatabase(): LocalDatabase | null {
    try {
      const data = localStorage.getItem(LEGACY_DB_KEY);
      if (!data) return null;
      return JSON.parse(data) as LocalDatabase;
    } catch (error) {
      console.error('Error loading legacy local database:', error);
      return null;
    }
  }

  private clearLegacyLocalDatabase(): void {
    try {
      localStorage.removeItem(LEGACY_DB_KEY);
    } catch (error) {
      console.error('Error clearing legacy local database:', error);
    }
  }

  private isCollectionKey(key: keyof LocalDatabase): key is CollectionKey {
    return key in COLLECTION_TABLES;
  }

  private async hasOwnershipSupport(): Promise<boolean> {
    if (this.ownershipSupport !== null) {
      return this.ownershipSupport;
    }

    if (this.ownershipCheckPromise) {
      return this.ownershipCheckPromise;
    }

    this.ownershipCheckPromise = (async () => {
      const { error } = await supabase.from('app_settings').select('user_id').limit(1);

      if (error) {
        const message = error.message.toLowerCase();
        const missingColumn =
          message.includes('column') && message.includes('user_id') && message.includes('does not exist');

        this.ownershipSupport = !missingColumn;
      } else {
        this.ownershipSupport = true;
      }

      this.ownershipCheckPromise = null;
      return this.ownershipSupport;
    })();

    return this.ownershipCheckPromise;
  }

  private async getAuthenticatedUserId(): Promise<string | null> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return user?.id ?? null;
  }

  private needsMigration(version: string): boolean {
    if (!version) return true;
    const [major, minor] = version.split('.').map(Number);
    const [currentMajor, currentMinor] = CURRENT_VERSION.split('.').map(Number);
    return major < currentMajor || (major === currentMajor && minor < currentMinor);
  }

  private migrateSchema(db: LocalDatabase): LocalDatabase {
    const defaultDb = getDefaultDatabase();

    return {
      ...defaultDb,
      ...db,
      version: CURRENT_VERSION,
      settings: {
        ...defaultDb.settings,
        ...db.settings,
      },
    };
  }

  private normalizeDatabase(db: LocalDatabase): LocalDatabase {
    const defaultDb = getDefaultDatabase();
    const normalizedDb = this.needsMigration(db.version) ? this.migrateSchema(db) : db;

    return {
      ...defaultDb,
      ...normalizedDb,
      version: CURRENT_VERSION,
      settings: {
        ...defaultDb.settings,
        ...normalizedDb.settings,
      },
      bankAccounts: normalizedDb.bankAccounts || [],
      bankTransfers: normalizedDb.bankTransfers || [],
      manualEntries: normalizedDb.manualEntries || [],
    };
  }
}

export const storageService = new StorageService();
export default storageService;
