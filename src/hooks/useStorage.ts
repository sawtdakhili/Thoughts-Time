/**
 * useStorage hook for accessing storage management functionality.
 *
 * Provides access to the storage manager for:
 * - Checking current storage type
 * - Migrating between storage backends
 * - Getting storage statistics
 */

import { create } from 'zustand';
import {
  StorageType,
  getStorageManager,
  MigrationProgressCallback,
} from '../storage';

interface StorageState {
  /** Current active storage type */
  storageType: StorageType;

  /** Whether a migration is in progress */
  isMigrating: boolean;

  /** Current migration progress */
  migrationProgress: {
    phase: string;
    percent: number;
    message: string;
  } | null;

  /** Whether SQLite is available (WASM support) */
  sqliteAvailable: boolean;

  /** Storage statistics */
  stats: {
    itemCount: number;
    estimatedSize: string;
  } | null;

  /** Whether the storage system is initialized */
  isInitialized: boolean;

  /** Initialize the storage system */
  initialize: () => Promise<void>;

  /** Migrate to a different storage type */
  migrate: (targetType: StorageType) => Promise<{ success: boolean; error?: string }>;

  /** Refresh storage statistics */
  refreshStats: () => Promise<void>;

  /** Check SQLite availability */
  checkSQLiteAvailable: () => Promise<void>;
}

export const useStorage = create<StorageState>()((set, get) => ({
  storageType: 'localStorage',
  isMigrating: false,
  migrationProgress: null,
  sqliteAvailable: false,
  stats: null,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;

    try {
      const manager = getStorageManager();
      await manager.initialize();

      const storageType = manager.getActiveStorageType();
      const stats = await manager.getStats();
      const sqliteAvailable = await manager.isSQLiteAvailable();

      set({
        storageType,
        stats: {
          itemCount: stats.itemCount,
          estimatedSize: stats.estimatedSize,
        },
        sqliteAvailable,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      set({ isInitialized: true }); // Mark as initialized even on error
    }
  },

  migrate: async (targetType: StorageType) => {
    const { storageType, isMigrating } = get();

    if (isMigrating) {
      return { success: false, error: 'Migration already in progress' };
    }

    if (storageType === targetType) {
      return { success: true };
    }

    set({ isMigrating: true, migrationProgress: null });

    const progressCallback: MigrationProgressCallback = (progress) => {
      set({
        migrationProgress: {
          phase: progress.phase,
          percent: progress.percent,
          message: progress.message,
        },
      });
    };

    try {
      const manager = getStorageManager();
      const result = await manager.migrate(targetType, progressCallback);

      if (result.success) {
        const stats = await manager.getStats();
        set({
          storageType: targetType,
          stats: {
            itemCount: stats.itemCount,
            estimatedSize: stats.estimatedSize,
          },
          isMigrating: false,
          migrationProgress: null,
        });
      } else {
        set({
          isMigrating: false,
          migrationProgress: {
            phase: 'error',
            percent: 0,
            message: result.error || 'Migration failed',
          },
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({
        isMigrating: false,
        migrationProgress: {
          phase: 'error',
          percent: 0,
          message: errorMessage,
        },
      });
      return { success: false, error: errorMessage };
    }
  },

  refreshStats: async () => {
    try {
      const manager = getStorageManager();
      const stats = await manager.getStats();
      set({
        stats: {
          itemCount: stats.itemCount,
          estimatedSize: stats.estimatedSize,
        },
      });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  },

  checkSQLiteAvailable: async () => {
    try {
      const manager = getStorageManager();
      const available = await manager.isSQLiteAvailable();
      set({ sqliteAvailable: available });
    } catch {
      set({ sqliteAvailable: false });
    }
  },
}));
