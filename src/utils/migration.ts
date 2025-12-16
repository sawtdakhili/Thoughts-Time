import { Item } from '../types';
import * as syncService from '../services/syncService';

export interface MigrationProgress {
  total: number;
  completed: number;
  failed: number;
  errors: string[];
}

export interface MigrationResult {
  success: boolean;
  total: number;
  migrated: number;
  failed: number;
  errors: string[];
}

/**
 * Migrate all items from localStorage to Supabase.
 * This is a one-time operation to move from guest mode to authenticated mode.
 *
 * @param items - All items from the local store
 * @param onProgress - Optional callback for progress updates
 * @returns Migration result with success status and statistics
 */
export async function migrateLocalDataToSupabase(
  items: Item[],
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    total: items.length,
    migrated: 0,
    failed: 0,
    errors: [],
  };

  if (items.length === 0) {
    result.success = true;
    return result;
  }

  // Report initial progress
  if (onProgress) {
    onProgress({
      total: items.length,
      completed: 0,
      failed: 0,
      errors: [],
    });
  }

  // Migrate each item
  for (const item of items) {
    try {
      await syncService.createItem(item);
      result.migrated++;

      // Report progress
      if (onProgress) {
        onProgress({
          total: items.length,
          completed: result.migrated,
          failed: result.failed,
          errors: result.errors,
        });
      }
    } catch (error) {
      result.failed++;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Failed to migrate item "${item.content}": ${errorMessage}`);

      console.error('Migration error for item:', item.id, error);

      // Report progress with error
      if (onProgress) {
        onProgress({
          total: items.length,
          completed: result.migrated,
          failed: result.failed,
          errors: result.errors,
        });
      }
    }
  }

  // Migration is successful if at least some items migrated
  result.success = result.migrated > 0;

  return result;
}

/**
 * Check if there are items in localStorage that can be migrated.
 *
 * @param items - All items from the local store
 * @returns Number of items that can be migrated
 */
export function getMigratableItemCount(items: Item[]): number {
  // Items with userId 'guest' are local-only and can be migrated
  return items.filter((item) => item.userId === 'guest').length;
}

/**
 * Verify that all items were successfully migrated by comparing local and remote counts.
 *
 * @param localItems - Items from local store
 * @param remoteItems - Items fetched from Supabase
 * @returns True if counts match (migration complete)
 */
export function verifyMigration(localItems: Item[], remoteItems: Item[]): boolean {
  const localCount = getMigratableItemCount(localItems);
  const remoteCount = remoteItems.length;

  return localCount === remoteCount;
}
