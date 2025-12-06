import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageProvider } from './LocalStorageProvider';
import { STORAGE_KEYS } from './types';
import { Item } from '../types';

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    provider = new LocalStorageProvider();
    mockStorage = {};

    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStorage[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockStorage[key] = value;
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete mockStorage[key];
    });
  });

  describe('initialize', () => {
    it('should initialize successfully when localStorage is available', async () => {
      const result = await provider.initialize();
      expect(result.success).toBe(true);
    });
  });

  describe('isAvailable', () => {
    it('should return true when localStorage is available', async () => {
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });
  });

  describe('getItems', () => {
    it('should return default state when no items are stored', async () => {
      const result = await provider.getItems();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ items: [], skipHistory: false });
    });

    it('should return stored items', async () => {
      const testItems = [{ id: 'test-1', type: 'note', content: 'Test' }];
      mockStorage[STORAGE_KEYS.ITEMS] = JSON.stringify({
        state: { items: testItems, skipHistory: false },
        version: 0,
      });

      const result = await provider.getItems();
      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(1);
      expect(result.data?.items[0].id).toBe('test-1');
    });
  });

  describe('setItems', () => {
    it('should store items in Zustand format', async () => {
      const testState = {
        items: [{ id: 'test-1', type: 'note', content: 'Test' }] as unknown as Item[],
        skipHistory: false,
      };

      const result = await provider.setItems(testState);
      expect(result.success).toBe(true);

      const stored = JSON.parse(mockStorage[STORAGE_KEYS.ITEMS]);
      expect(stored.state.items).toHaveLength(1);
    });
  });

  describe('getSettings', () => {
    it('should return default settings when none are stored', async () => {
      const result = await provider.getSettings();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        theme: 'dark',
        viewMode: 'infinite',
        timeFormat: '12h',
        activeMobilePane: 'thoughts',
      });
    });

    it('should return stored settings', async () => {
      mockStorage[STORAGE_KEYS.SETTINGS] = JSON.stringify({
        state: { theme: 'light', viewMode: 'book', timeFormat: '24h', activeMobilePane: 'time' },
        version: 0,
      });

      const result = await provider.getSettings();
      expect(result.success).toBe(true);
      expect(result.data?.theme).toBe('light');
      expect(result.data?.viewMode).toBe('book');
    });
  });

  describe('setSettings', () => {
    it('should store settings in Zustand format', async () => {
      const settings = {
        theme: 'light' as const,
        viewMode: 'book' as const,
        timeFormat: '24h' as const,
        activeMobilePane: 'time' as const,
      };

      const result = await provider.setSettings(settings);
      expect(result.success).toBe(true);

      const stored = JSON.parse(mockStorage[STORAGE_KEYS.SETTINGS]);
      expect(stored.state.theme).toBe('light');
    });
  });

  describe('exportAll', () => {
    it('should export all data as a snapshot', async () => {
      mockStorage[STORAGE_KEYS.ITEMS] = JSON.stringify({
        state: { items: [{ id: 'test-1' }], skipHistory: false },
        version: 0,
      });
      mockStorage[STORAGE_KEYS.SETTINGS] = JSON.stringify({
        state: { theme: 'dark', viewMode: 'infinite', timeFormat: '12h', activeMobilePane: 'thoughts' },
        version: 0,
      });

      const result = await provider.exportAll();
      expect(result.success).toBe(true);
      expect(result.data?.items.items).toHaveLength(1);
      expect(result.data?.settings.theme).toBe('dark');
      expect(result.data?.timestamp).toBeDefined();
    });
  });

  describe('importAll', () => {
    it('should import a snapshot', async () => {
      const snapshot = {
        items: { items: [{ id: 'imported-1' }] as unknown as Item[], skipHistory: false },
        settings: {
          theme: 'light' as const,
          viewMode: 'book' as const,
          timeFormat: '24h' as const,
          activeMobilePane: 'time' as const,
        },
        timestamp: new Date().toISOString(),
        version: 1,
      };

      const result = await provider.importAll(snapshot);
      expect(result.success).toBe(true);

      const itemsStored = JSON.parse(mockStorage[STORAGE_KEYS.ITEMS]);
      expect(itemsStored.state.items[0].id).toBe('imported-1');

      const settingsStored = JSON.parse(mockStorage[STORAGE_KEYS.SETTINGS]);
      expect(settingsStored.state.theme).toBe('light');
    });
  });

  describe('clear', () => {
    it('should clear all stored data', async () => {
      mockStorage[STORAGE_KEYS.ITEMS] = 'some data';
      mockStorage[STORAGE_KEYS.SETTINGS] = 'some settings';

      const result = await provider.clear();
      expect(result.success).toBe(true);
      expect(mockStorage[STORAGE_KEYS.ITEMS]).toBeUndefined();
      expect(mockStorage[STORAGE_KEYS.SETTINGS]).toBeUndefined();
    });
  });
});
