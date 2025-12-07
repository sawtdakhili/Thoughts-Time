/**
 * Zustand storage adapters for custom storage providers.
 *
 * These adapters allow Zustand's persist middleware to use our
 * StorageManager instead of directly accessing localStorage.
 */

import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { getStorageManager } from './StorageManager';
import { StoredItemsState, StoredSettings, STORAGE_KEYS } from './types';

/**
 * Create a Zustand storage adapter for the items store.
 * This adapter synchronizes with the active storage provider.
 */
export function createItemsStorageAdapter<T>(): PersistStorage<T> {
  return {
    getItem: async (name: string): Promise<StorageValue<T> | null> => {
      // For backwards compatibility during initialization, check localStorage first
      if (name === STORAGE_KEYS.ITEMS) {
        try {
          const manager = getStorageManager();
          const provider = manager.getProvider();
          const result = await provider.getItems();

          if (result.success && result.data) {
            return {
              state: result.data as unknown as T,
              version: 0,
            };
          }
        } catch {
          // Fall back to localStorage during initial load
          const stored = localStorage.getItem(name);
          if (stored) {
            return JSON.parse(stored);
          }
        }
      }

      return null;
    },

    setItem: async (name: string, value: StorageValue<T>): Promise<void> => {
      if (name === STORAGE_KEYS.ITEMS) {
        try {
          const manager = getStorageManager();
          const provider = manager.getProvider();
          await provider.setItems(value.state as unknown as StoredItemsState);
        } catch {
          // Fall back to localStorage if provider fails
          localStorage.setItem(name, JSON.stringify(value));
        }
      }
    },

    removeItem: async (name: string): Promise<void> => {
      if (name === STORAGE_KEYS.ITEMS) {
        try {
          const manager = getStorageManager();
          const provider = manager.getProvider();
          await provider.setItems({ items: [], skipHistory: false });
        } catch {
          localStorage.removeItem(name);
        }
      }
    },
  };
}

/**
 * Create a Zustand storage adapter for the settings store.
 * This adapter synchronizes with the active storage provider.
 */
export function createSettingsStorageAdapter<T>(): PersistStorage<T> {
  return {
    getItem: async (name: string): Promise<StorageValue<T> | null> => {
      if (name === STORAGE_KEYS.SETTINGS) {
        try {
          const manager = getStorageManager();
          const provider = manager.getProvider();
          const result = await provider.getSettings();

          if (result.success && result.data) {
            return {
              state: result.data as unknown as T,
              version: 0,
            };
          }
        } catch {
          // Fall back to localStorage during initial load
          const stored = localStorage.getItem(name);
          if (stored) {
            return JSON.parse(stored);
          }
        }
      }

      return null;
    },

    setItem: async (name: string, value: StorageValue<T>): Promise<void> => {
      if (name === STORAGE_KEYS.SETTINGS) {
        try {
          const manager = getStorageManager();
          const provider = manager.getProvider();
          await provider.setSettings(value.state as unknown as StoredSettings);
        } catch {
          // Fall back to localStorage if provider fails
          localStorage.setItem(name, JSON.stringify(value));
        }
      }
    },

    removeItem: async (name: string): Promise<void> => {
      if (name === STORAGE_KEYS.SETTINGS) {
        try {
          const manager = getStorageManager();
          const provider = manager.getProvider();
          await provider.setSettings({
            theme: 'dark',
            viewMode: 'infinite',
            timeFormat: '12h',
            activeMobilePane: 'thoughts',
          });
        } catch {
          localStorage.removeItem(name);
        }
      }
    },
  };
}

/**
 * Synchronous localStorage adapter for fallback during initialization.
 * This is used when the StorageManager hasn't been initialized yet.
 */
export function createSyncStorageAdapter<T>(): PersistStorage<T> {
  return {
    getItem: (name: string): StorageValue<T> | null => {
      const stored = localStorage.getItem(name);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
      return null;
    },

    setItem: (name: string, value: StorageValue<T>): void => {
      localStorage.setItem(name, JSON.stringify(value));
    },

    removeItem: (name: string): void => {
      localStorage.removeItem(name);
    },
  };
}
