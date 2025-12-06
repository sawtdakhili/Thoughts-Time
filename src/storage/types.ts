/**
 * Storage system types for Thoughts & Time
 *
 * Supports both localStorage and SQLite backends with migration capabilities.
 */

import { Item } from '../types';

/** Storage backend type */
export type StorageType = 'localStorage' | 'sqlite';

/** Settings stored in the storage system */
export interface StoredSettings {
  theme: 'dark' | 'light';
  viewMode: 'infinite' | 'book';
  timeFormat: '12h' | '24h';
  activeMobilePane: 'thoughts' | 'time';
}

/** Items state stored in the storage system */
export interface StoredItemsState {
  items: Item[];
  skipHistory: boolean;
}

/** Complete data snapshot for migration */
export interface StorageSnapshot {
  items: StoredItemsState;
  settings: StoredSettings;
  timestamp: string;
  version: number;
}

/** Result of a storage operation */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Migration progress callback */
export type MigrationProgressCallback = (progress: {
  phase: 'exporting' | 'importing' | 'validating' | 'complete' | 'error';
  percent: number;
  message: string;
}) => void;

/**
 * Storage provider interface.
 * Both localStorage and SQLite implementations must conform to this interface.
 */
export interface StorageProvider {
  /** Provider type identifier */
  readonly type: StorageType;

  /** Initialize the storage (e.g., create tables for SQLite) */
  initialize(): Promise<StorageResult<void>>;

  /** Check if storage is available and working */
  isAvailable(): Promise<boolean>;

  /** Get the items state */
  getItems(): Promise<StorageResult<StoredItemsState>>;

  /** Set the items state */
  setItems(state: StoredItemsState): Promise<StorageResult<void>>;

  /** Get settings */
  getSettings(): Promise<StorageResult<StoredSettings>>;

  /** Set settings */
  setSettings(settings: StoredSettings): Promise<StorageResult<void>>;

  /** Get a complete snapshot of all data */
  exportAll(): Promise<StorageResult<StorageSnapshot>>;

  /** Import a complete snapshot of all data */
  importAll(snapshot: StorageSnapshot): Promise<StorageResult<void>>;

  /** Clear all stored data */
  clear(): Promise<StorageResult<void>>;

  /** Close the storage connection (for SQLite) */
  close(): Promise<void>;
}

/** Storage metadata stored separately to track which storage is active */
export interface StorageMetadata {
  activeStorage: StorageType;
  lastMigration?: string;
  version: number;
}

/** Storage keys used in localStorage */
export const STORAGE_KEYS = {
  ITEMS: 'thoughts-time-storage',
  SETTINGS: 'thoughts-time-settings',
  METADATA: 'thoughts-time-metadata',
  SQLITE_DB: 'thoughts-time-sqlite-db',
} as const;

/** Current storage version for migrations */
export const STORAGE_VERSION = 1;
