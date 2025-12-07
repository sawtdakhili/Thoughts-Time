/**
 * Storage Manager for Thoughts & Time.
 *
 * Manages switching between storage providers (localStorage and SQLite)
 * and handles data migration between them.
 */

import {
  StorageProvider,
  StorageType,
  StorageMetadata,
  StorageSnapshot,
  MigrationProgressCallback,
  STORAGE_KEYS,
  STORAGE_VERSION,
} from './types';
import { LocalStorageProvider } from './LocalStorageProvider';
import { SQLiteStorageProvider } from './SQLiteStorageProvider';

/** Singleton storage manager instance */
let instance: StorageManager | null = null;

export class StorageManager {
  private currentProvider: StorageProvider | null = null;
  private localStorage: LocalStorageProvider;
  private sqliteStorage: SQLiteStorageProvider;
  private initialized = false;

  private constructor() {
    this.localStorage = new LocalStorageProvider();
    this.sqliteStorage = new SQLiteStorageProvider();
  }

  /**
   * Get the singleton instance of StorageManager.
   */
  static getInstance(): StorageManager {
    if (!instance) {
      instance = new StorageManager();
    }
    return instance;
  }

  /**
   * Initialize the storage manager with the active storage type.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const metadata = this.getMetadata();
    const storageType = metadata.activeStorage;

    // Initialize the appropriate provider
    if (storageType === 'sqlite') {
      const result = await this.sqliteStorage.initialize();
      if (result.success) {
        this.currentProvider = this.sqliteStorage;
      } else {
        // Fall back to localStorage if SQLite fails
        console.warn('SQLite initialization failed, falling back to localStorage:', result.error);
        await this.localStorage.initialize();
        this.currentProvider = this.localStorage;
        this.setMetadata({ ...metadata, activeStorage: 'localStorage' });
      }
    } else {
      await this.localStorage.initialize();
      this.currentProvider = this.localStorage;
    }

    this.initialized = true;
  }

  /**
   * Get the current active storage provider.
   */
  getProvider(): StorageProvider {
    if (!this.currentProvider) {
      throw new Error('StorageManager not initialized. Call initialize() first.');
    }
    return this.currentProvider;
  }

  /**
   * Get the current active storage type.
   */
  getActiveStorageType(): StorageType {
    return this.getMetadata().activeStorage;
  }

  /**
   * Get storage metadata from localStorage.
   */
  private getMetadata(): StorageMetadata {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.METADATA);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }

    // Default metadata
    return {
      activeStorage: 'localStorage',
      version: STORAGE_VERSION,
    };
  }

  /**
   * Set storage metadata in localStorage.
   */
  private setMetadata(metadata: StorageMetadata): void {
    localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
  }

  /**
   * Migrate data from one storage type to another.
   */
  async migrate(
    targetType: StorageType,
    onProgress?: MigrationProgressCallback
  ): Promise<{ success: boolean; error?: string }> {
    const currentType = this.getActiveStorageType();

    if (currentType === targetType) {
      return { success: true };
    }

    const sourceProvider = currentType === 'localStorage' ? this.localStorage : this.sqliteStorage;
    const targetProvider = targetType === 'localStorage' ? this.localStorage : this.sqliteStorage;

    try {
      // Phase 1: Export from source
      onProgress?.({
        phase: 'exporting',
        percent: 10,
        message: `Exporting data from ${currentType}...`,
      });

      const exportResult = await sourceProvider.exportAll();
      if (!exportResult.success || !exportResult.data) {
        throw new Error(exportResult.error || 'Failed to export data');
      }

      const snapshot: StorageSnapshot = exportResult.data;

      onProgress?.({
        phase: 'exporting',
        percent: 30,
        message: `Exported ${snapshot.items.items.length} items`,
      });

      // Phase 2: Initialize target if needed
      if (targetType === 'sqlite' && !(await this.sqliteStorage.isAvailable())) {
        onProgress?.({
          phase: 'importing',
          percent: 40,
          message: 'Initializing SQLite database...',
        });

        const initResult = await this.sqliteStorage.initialize();
        if (!initResult.success) {
          throw new Error(initResult.error || 'Failed to initialize SQLite');
        }
      }

      // Phase 3: Import to target
      onProgress?.({
        phase: 'importing',
        percent: 50,
        message: `Importing data to ${targetType}...`,
      });

      const importResult = await targetProvider.importAll(snapshot);
      if (!importResult.success) {
        throw new Error(importResult.error || 'Failed to import data');
      }

      onProgress?.({
        phase: 'importing',
        percent: 70,
        message: 'Data imported successfully',
      });

      // Phase 4: Validate migration
      onProgress?.({
        phase: 'validating',
        percent: 80,
        message: 'Validating migration...',
      });

      const verifyResult = await targetProvider.exportAll();
      if (!verifyResult.success || !verifyResult.data) {
        throw new Error('Failed to verify migrated data');
      }

      // Verify item count matches
      if (verifyResult.data.items.items.length !== snapshot.items.items.length) {
        throw new Error(
          `Item count mismatch: expected ${snapshot.items.items.length}, got ${verifyResult.data.items.items.length}`
        );
      }

      onProgress?.({
        phase: 'validating',
        percent: 90,
        message: 'Validation successful',
      });

      // Phase 5: Switch active storage
      this.currentProvider = targetProvider;
      this.setMetadata({
        activeStorage: targetType,
        lastMigration: new Date().toISOString(),
        version: STORAGE_VERSION,
      });

      onProgress?.({
        phase: 'complete',
        percent: 100,
        message: `Successfully migrated to ${targetType}`,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      onProgress?.({
        phase: 'error',
        percent: 0,
        message: `Migration failed: ${errorMessage}`,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if SQLite is available (WASM support).
   */
  async isSQLiteAvailable(): Promise<boolean> {
    try {
      // Check for WASM support
      if (typeof WebAssembly === 'undefined') {
        return false;
      }

      // Try to initialize SQLite if not already done
      if (!(await this.sqliteStorage.isAvailable())) {
        const result = await this.sqliteStorage.initialize();
        return result.success;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage statistics.
   */
  async getStats(): Promise<{
    type: StorageType;
    itemCount: number;
    estimatedSize: string;
  }> {
    const provider = this.getProvider();
    const itemsResult = await provider.getItems();

    const itemCount = itemsResult.success ? itemsResult.data?.items.length ?? 0 : 0;

    // Estimate storage size
    let estimatedBytes = 0;

    if (provider.type === 'localStorage') {
      const itemsData = localStorage.getItem(STORAGE_KEYS.ITEMS);
      const settingsData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      estimatedBytes = (itemsData?.length ?? 0) + (settingsData?.length ?? 0);
    } else {
      const sqliteData = localStorage.getItem(STORAGE_KEYS.SQLITE_DB);
      estimatedBytes = sqliteData?.length ?? 0;
    }

    const estimatedSize = this.formatBytes(estimatedBytes);

    return {
      type: provider.type,
      itemCount,
      estimatedSize,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Reset to default storage (localStorage) and clear all data.
   */
  async reset(): Promise<void> {
    await this.localStorage.clear();
    await this.sqliteStorage.clear();

    this.setMetadata({
      activeStorage: 'localStorage',
      version: STORAGE_VERSION,
    });

    await this.localStorage.initialize();
    this.currentProvider = this.localStorage;
  }
}

/** Export singleton getter */
export const getStorageManager = (): StorageManager => StorageManager.getInstance();
