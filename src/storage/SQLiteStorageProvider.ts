/**
 * SQLite storage provider using sql.js (SQLite compiled to WebAssembly).
 *
 * The database is stored in memory and persisted to localStorage as a binary blob.
 * This provides the benefits of SQLite's structured storage while still working
 * entirely in the browser without a server.
 */

import initSqlJs, { Database } from 'sql.js';
import {
  StorageProvider,
  StoredSettings,
  StoredItemsState,
  StorageSnapshot,
  StorageResult,
  STORAGE_KEYS,
  STORAGE_VERSION,
} from './types';
import { Item } from '../types';

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

/** SQL.js WASM URL - loaded from CDN */
const SQL_WASM_URL = 'https://sql.js.org/dist/sql-wasm.wasm';

export class SQLiteStorageProvider implements StorageProvider {
  readonly type = 'sqlite' as const;
  private db: Database | null = null;
  private initialized = false;

  async initialize(): Promise<StorageResult<void>> {
    try {
      // Initialize sql.js with WASM
      const SQL = await initSqlJs({
        locateFile: () => SQL_WASM_URL,
      });

      // Try to load existing database from localStorage
      const stored = localStorage.getItem(STORAGE_KEYS.SQLITE_DB);
      if (stored) {
        try {
          const binaryData = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
          this.db = new SQL.Database(binaryData);
        } catch {
          // If loading fails, create a new database
          this.db = new SQL.Database();
          this.createTables();
        }
      } else {
        // Create new database
        this.db = new SQL.Database();
        this.createTables();
      }

      this.initialized = true;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize SQLite: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private createTables(): void {
    if (!this.db) return;

    // Items table - stores each item as JSON
    this.db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Settings table - key-value store for settings
    this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Metadata table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Insert version metadata
    this.db.run(`
      INSERT OR REPLACE INTO metadata (key, value) VALUES ('version', ?)
    `, [String(STORAGE_VERSION)]);

    this.saveToLocalStorage();
  }

  private saveToLocalStorage(): void {
    if (!this.db) return;

    try {
      const data = this.db.export();
      const base64 = btoa(String.fromCharCode(...data));
      localStorage.setItem(STORAGE_KEYS.SQLITE_DB, base64);
    } catch (error) {
      console.error('Failed to save SQLite database to localStorage:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.initialized && this.db !== null;
  }

  async getItems(): Promise<StorageResult<StoredItemsState>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const results = this.db.exec('SELECT data FROM items ORDER BY created_at ASC');

      if (results.length === 0 || results[0].values.length === 0) {
        return { success: true, data: DEFAULT_ITEMS_STATE };
      }

      const items: Item[] = results[0].values.map((row) => {
        const data = JSON.parse(row[0] as string);
        // Parse date strings back to Date objects
        return this.parseItemDates(data);
      });

      return {
        success: true,
        data: {
          items,
          skipHistory: false,
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
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      // Start transaction
      this.db.run('BEGIN TRANSACTION');

      // Clear existing items
      this.db.run('DELETE FROM items');

      // Insert all items
      const stmt = this.db.prepare(`
        INSERT INTO items (id, type, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const item of state.items) {
        const data = JSON.stringify(this.serializeItemDates(item));
        stmt.run([
          item.id,
          item.type,
          data,
          item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
          item.updatedAt instanceof Date ? item.updatedAt.toISOString() : String(item.updatedAt),
        ]);
      }

      stmt.free();

      // Commit transaction
      this.db.run('COMMIT');

      // Save to localStorage
      this.saveToLocalStorage();

      return { success: true };
    } catch (error) {
      // Rollback on error
      try {
        this.db.run('ROLLBACK');
      } catch {
        // Ignore rollback errors
      }

      return {
        success: false,
        error: `Failed to save items: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async getSettings(): Promise<StorageResult<StoredSettings>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const results = this.db.exec('SELECT key, value FROM settings');

      if (results.length === 0 || results[0].values.length === 0) {
        return { success: true, data: DEFAULT_SETTINGS };
      }

      const settings: StoredSettings = { ...DEFAULT_SETTINGS };

      for (const row of results[0].values) {
        const key = row[0] as keyof StoredSettings;
        const value = row[1] as string;

        if (key in settings) {
          (settings as unknown as Record<string, string>)[key] = value;
        }
      }

      return { success: true, data: settings };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read settings: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async setSettings(settings: StoredSettings): Promise<StorageResult<void>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      this.db.run('BEGIN TRANSACTION');

      // Upsert each setting
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
      `);

      for (const [key, value] of Object.entries(settings)) {
        stmt.run([key, String(value)]);
      }

      stmt.free();

      this.db.run('COMMIT');
      this.saveToLocalStorage();

      return { success: true };
    } catch (error) {
      try {
        this.db.run('ROLLBACK');
      } catch {
        // Ignore rollback errors
      }

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
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      this.db.run('DELETE FROM items');
      this.db.run('DELETE FROM settings');
      this.saveToLocalStorage();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear storage: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.saveToLocalStorage();
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  /**
   * Parse date strings back to Date objects in an item.
   */
  private parseItemDates(item: Record<string, unknown>): Item {
    const dateFields = [
      'createdAt',
      'updatedAt',
      'completedAt',
      'cancelledAt',
      'scheduledTime',
      'startTime',
      'endTime',
      'lastCompleted',
    ];

    const parsed = { ...item };

    for (const field of dateFields) {
      if (parsed[field] && typeof parsed[field] === 'string') {
        parsed[field] = new Date(parsed[field] as string);
      }
    }

    return parsed as unknown as Item;
  }

  /**
   * Serialize Date objects to ISO strings for storage.
   */
  private serializeItemDates(item: Item): Record<string, unknown> {
    const serialized: Record<string, unknown> = { ...item };

    for (const [key, value] of Object.entries(serialized)) {
      if (value instanceof Date) {
        serialized[key] = value.toISOString();
      }
    }

    return serialized;
  }
}
