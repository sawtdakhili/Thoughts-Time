import { Item } from '../types';

/**
 * Generate a unique ID for items
 */
export const generateId = () => Math.random().toString(36).substring(2, 11);

/**
 * Validation error types for item operations
 */
export type ValidationError = 'TODO_MAX_DEPTH' | 'NOTE_MAX_DEPTH' | 'TODO_INVALID_CHILD_TYPE';

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES: Record<ValidationError, string> = {
  TODO_MAX_DEPTH: 'Todo subtasks: maximum depth is 1 level',
  NOTE_MAX_DEPTH: 'Note sub-items: maximum depth is 2 levels',
  TODO_INVALID_CHILD_TYPE: 'Todo subtasks can only be todos or notes',
};

/**
 * Validate depth constraints for parent-child relationships
 */
export function validateDepth(
  parentType: 'todo' | 'note' | null,
  depthLevel: number
): ValidationError | null {
  if (parentType === 'todo' && depthLevel > 1) {
    return 'TODO_MAX_DEPTH';
  }
  if (parentType === 'note' && depthLevel > 2) {
    return 'NOTE_MAX_DEPTH';
  }
  return null;
}

/**
 * Validate child type constraints for parent items
 */
export function validateChildType(
  parentType: 'todo' | 'note' | null,
  childType: string
): ValidationError | null {
  if (parentType === 'todo') {
    if (childType !== 'todo' && childType !== 'note') {
      return 'TODO_INVALID_CHILD_TYPE';
    }
  }
  return null;
}

/**
 * Collect all descendant IDs of an item (for cascade operations)
 */
export function collectDescendantIds(itemId: string, items: Item[]): Set<string> {
  const ids = new Set<string>();

  const collect = (id: string) => {
    ids.add(id);
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if ('children' in item && item.children.length > 0) {
      item.children.forEach((childId) => collect(childId));
    }
  };

  collect(itemId);
  return ids;
}

/**
 * Get deleted items with their original indices (for undo)
 */
export function getDeletedItemsWithIndices(
  idsToDelete: Set<string>,
  items: Item[]
): { deletedItems: Item[]; deletedIndices: number[] } {
  const deletedItems: Item[] = [];
  const deletedIndices: number[] = [];

  items.forEach((item, index) => {
    if (idsToDelete.has(item.id)) {
      deletedItems.push(item);
      deletedIndices.push(index);
    }
  });

  return { deletedItems, deletedIndices };
}
