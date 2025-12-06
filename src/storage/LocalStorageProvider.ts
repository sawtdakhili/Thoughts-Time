/**
 * localStorage storage provider.
 *
 * Wraps the browser's localStorage API to conform to the StorageProvider interface.
 */

import {
  StorageProvider,
  StoredSettings,
  StoredItemsState,
  StorageSnapshot,
  StorageResult,
  STORAGE_KEYS,
  STORAGE_VERSION,
} from './types';

/** Default settings when none are stored */
const DEFAULT_SETTINGS: StoredSettings = {
  theme: 'dark',
  viewMode: 'infinite',
  timeFormat: '12h',
  activeMobilePane: 'thoughts',
};

/** Default items state when none are stored */
const DEFAULT_ITEMS_STATE: StoredItemsState = {
  items: [],
  skipHistory: false,
};

export class LocalStorageProvider implements StorageProvider {
  readonly type = 'localStorage' as const;

  async initialize(): Promise<StorageResult<void>> {
    try {
      // Test localStorage is available
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'localStorage is not available',
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  async getItems(): Promise<StorageResult<StoredItemsState>> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (!stored) {
        return { success: true, data: DEFAULT_ITEMS_STATE };
      }

      const parsed = JSON.parse(stored);
      // Zustand persist stores data with { state: ..., version: ... } wrapper
      const state = parsed.state || parsed;

      return {
        success: true,
        data: {
          items: state.items || [],
          skipHistory: state.skipHistory || false,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read items: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async setItems(state: StoredItemsState): Promise<StorageResult<void>> {
    try {
      // Store in Zustand persist format for compatibility
      const data = {
        state: {
          items: state.items,
          skipHistory: state.skipHistory,
        },
        version: 0,
      };
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save items: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async getSettings(): Promise<StorageResult<StoredSettings>> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!stored) {
        return { success: true, data: DEFAULT_SETTINGS };
      }

      const parsed = JSON.parse(stored);
      // Zustand persist stores data with { state: ..., version: ... } wrapper
      const state = parsed.state || parsed;

      return {
        success: true,
        data: {
          theme: state.theme || DEFAULT_SETTINGS.theme,
          viewMode: state.viewMode || DEFAULT_SETTINGS.viewMode,
          timeFormat: state.timeFormat || DEFAULT_SETTINGS.timeFormat,
          activeMobilePane: state.activeMobilePane || DEFAULT_SETTINGS.activeMobilePane,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read settings: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async setSettings(settings: StoredSettings): Promise<StorageResult<void>> {
    try {
      // Store in Zustand persist format for compatibility
      const data = {
        state: settings,
        version: 0,
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save settings: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async exportAll(): Promise<StorageResult<StorageSnapshot>> {
    try {
      const itemsResult = await this.getItems();
      if (!itemsResult.success || !itemsResult.data) {
        return { success: false, error: itemsResult.error || 'Failed to export items' };
      }

      const settingsResult = await this.getSettings();
      if (!settingsResult.success || !settingsResult.data) {
        return { success: false, error: settingsResult.error || 'Failed to export settings' };
      }

      const snapshot: StorageSnapshot = {
        items: itemsResult.data,
        settings: settingsResult.data,
        timestamp: new Date().toISOString(),
        version: STORAGE_VERSION,
      };

      return { success: true, data: snapshot };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export data: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async importAll(snapshot: StorageSnapshot): Promise<StorageResult<void>> {
    try {
      const itemsResult = await this.setItems(snapshot.items);
      if (!itemsResult.success) {
        return itemsResult;
      }

      const settingsResult = await this.setSettings(snapshot.settings);
      if (!settingsResult.success) {
        return settingsResult;
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import data: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async clear(): Promise<StorageResult<void>> {
    try {
      localStorage.removeItem(STORAGE_KEYS.ITEMS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear storage: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async close(): Promise<void> {
    // Nothing to close for localStorage
  }
}
