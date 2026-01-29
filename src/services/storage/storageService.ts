// =====================================
// Storage Service - LocalStorage Manager
// =====================================

import { LocalDatabase } from '@/core/types';
import { getDefaultDatabase, getSeedData } from '@/mock/seedData';

const DB_KEY = 'gst:v1:db';
const CURRENT_VERSION = '1.0.0';

class StorageService {
  private cache: LocalDatabase | null = null;

  // Load entire database
  load(): LocalDatabase {
    if (this.cache) return this.cache;

    try {
      const data = localStorage.getItem(DB_KEY);
      if (!data) {
        // First launch - initialize with seed data
        const seedDb = getSeedData();
        this.save(seedDb);
        return seedDb;
      }

      const db = JSON.parse(data) as LocalDatabase;
      
      // Check for migration
      if (this.needsMigration(db.version)) {
        const migratedDb = this.migrateSchema(db);
        this.save(migratedDb);
        return migratedDb;
      }

      this.cache = db;
      return db;
    } catch (error) {
      console.error('Error loading database:', error);
      const defaultDb = getDefaultDatabase();
      this.save(defaultDb);
      return defaultDb;
    }
  }

  // Save entire database
  save(db: LocalDatabase): void {
    try {
      db.version = CURRENT_VERSION;
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      this.cache = db;
    } catch (error) {
      console.error('Error saving database:', error);
      throw new Error('Failed to save data');
    }
  }

  // Load specific collection
  loadCollection<K extends keyof LocalDatabase>(key: K): LocalDatabase[K] {
    const db = this.load();
    return db[key];
  }

  // Save specific collection
  saveCollection<K extends keyof LocalDatabase>(key: K, data: LocalDatabase[K]): void {
    const db = this.load();
    db[key] = data;
    this.save(db);
  }

  // Remove specific item from collection
  remove<K extends keyof LocalDatabase>(
    collectionKey: K, 
    predicate: (item: LocalDatabase[K] extends Array<infer E> ? E : never) => boolean
  ): void {
    const db = this.load();
    const collection = db[collectionKey];
    if (Array.isArray(collection)) {
      type Element = LocalDatabase[K] extends Array<infer E> ? E : never;
      const array = collection as Element[];
      const filtered = array.filter((item) => !predicate(item));
      (db[collectionKey] as Element[]) = filtered;
      this.save(db);
    }
  }

  // Reset all data
  resetAll(): void {
    try {
      localStorage.removeItem(DB_KEY);
      this.cache = null;
      // Reinitialize with seed data
      const seedDb = getSeedData();
      this.save(seedDb);
    } catch (error) {
      console.error('Error resetting database:', error);
    }
  }

  // Check if migration is needed
  private needsMigration(version: string): boolean {
    if (!version) return true;
    const [major, minor] = version.split('.').map(Number);
    const [currentMajor, currentMinor] = CURRENT_VERSION.split('.').map(Number);
    return major < currentMajor || (major === currentMajor && minor < currentMinor);
  }

  // Migrate schema to new version
  private migrateSchema(db: LocalDatabase): LocalDatabase {
    const version = db.version || '0.0.0';
    console.log(`Migrating from version ${version} to ${CURRENT_VERSION}`);

    // Add migration logic here as needed
    // Example: if (version < '1.0.0') { ... }

    // Ensure all collections exist
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

  // Export database as JSON
  exportData(): string {
    const db = this.load();
    return JSON.stringify(db, null, 2);
  }

  // Import database from JSON
  importData(jsonString: string): boolean {
    try {
      const db = JSON.parse(jsonString) as LocalDatabase;
      this.save(db);
      return true;
    } catch (error) {
      console.error('Error importing database:', error);
      return false;
    }
  }

  // Get database size in KB
  getSize(): number {
    const data = localStorage.getItem(DB_KEY);
    if (!data) return 0;
    return new Blob([data]).size / 1024;
  }

  // Clear cache
  clearCache(): void {
    this.cache = null;
  }
}

export const storageService = new StorageService();
export default storageService;
