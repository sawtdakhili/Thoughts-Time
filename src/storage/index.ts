/**
 * Storage module exports.
 */

export type {
  StorageType,
  StoredSettings,
  StoredItemsState,
  StorageSnapshot,
  StorageResult,
  MigrationProgressCallback,
  StorageProvider,
  StorageMetadata,
} from './types';

export { STORAGE_KEYS, STORAGE_VERSION } from './types';

export { LocalStorageProvider } from './LocalStorageProvider';
export { SQLiteStorageProvider } from './SQLiteStorageProvider';
export { StorageManager, getStorageManager } from './StorageManager';

export {
  createItemsStorageAdapter,
  createSettingsStorageAdapter,
  createSyncStorageAdapter,
} from './zustandAdapter';

export { StorageInitializer } from './StorageInitializer';
