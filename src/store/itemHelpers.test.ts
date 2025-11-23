import { describe, it, expect } from 'vitest';
import {
  generateId,
  validateDepth,
  validateChildType,
  collectDescendantIds,
  getDeletedItemsWithIndices,
  VALIDATION_MESSAGES,
} from './itemHelpers';
import { Item, Todo, Note } from '../types';

describe('itemHelpers', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });

    it('should generate string IDs', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('validateDepth', () => {
    it('should return null for valid todo depth', () => {
      expect(validateDepth('todo', 0)).toBeNull();
      expect(validateDepth('todo', 1)).toBeNull();
    });

    it('should return error for todo depth > 1', () => {
      expect(validateDepth('todo', 2)).toBe('TODO_MAX_DEPTH');
      expect(validateDepth('todo', 3)).toBe('TODO_MAX_DEPTH');
    });

    it('should return null for valid note depth', () => {
      expect(validateDepth('note', 0)).toBeNull();
      expect(validateDepth('note', 1)).toBeNull();
      expect(validateDepth('note', 2)).toBeNull();
    });

    it('should return error for note depth > 2', () => {
      expect(validateDepth('note', 3)).toBe('NOTE_MAX_DEPTH');
      expect(validateDepth('note', 4)).toBe('NOTE_MAX_DEPTH');
    });

    it('should return null for null parent type', () => {
      expect(validateDepth(null, 0)).toBeNull();
      expect(validateDepth(null, 5)).toBeNull();
    });
  });

  describe('validateChildType', () => {
    it('should return null for valid todo children', () => {
      expect(validateChildType('todo', 'todo')).toBeNull();
      expect(validateChildType('todo', 'note')).toBeNull();
    });

    it('should return error for invalid todo children', () => {
      expect(validateChildType('todo', 'event')).toBe('TODO_INVALID_CHILD_TYPE');
      expect(validateChildType('todo', 'routine')).toBe('TODO_INVALID_CHILD_TYPE');
    });

    it('should return null for note children (any type allowed)', () => {
      expect(validateChildType('note', 'todo')).toBeNull();
      expect(validateChildType('note', 'note')).toBeNull();
      expect(validateChildType('note', 'event')).toBeNull();
      expect(validateChildType('note', 'routine')).toBeNull();
    });

    it('should return null for null parent type', () => {
      expect(validateChildType(null, 'todo')).toBeNull();
      expect(validateChildType(null, 'event')).toBeNull();
    });
  });

  describe('VALIDATION_MESSAGES', () => {
    it('should have messages for all error types', () => {
      expect(VALIDATION_MESSAGES.TODO_MAX_DEPTH).toBeDefined();
      expect(VALIDATION_MESSAGES.NOTE_MAX_DEPTH).toBeDefined();
      expect(VALIDATION_MESSAGES.TODO_INVALID_CHILD_TYPE).toBeDefined();
    });
  });

  describe('collectDescendantIds', () => {
    const createTestItems = (): Item[] => {
      const now = new Date();
      const baseItem = {
        userId: 'user-1',
        createdAt: now,
        createdDate: '2024-01-01',
        updatedAt: now,
        completedAt: null,
        cancelledAt: null,
      };

      return [
        {
          ...baseItem,
          id: 'parent',
          type: 'todo',
          content: 'Parent',
          scheduledTime: null,
          hasTime: false,
          parentId: null,
          parentType: null,
          depthLevel: 0,
          children: ['child1', 'child2'],
          embeddedItems: [],
          completionLinkId: null,
        } as Todo,
        {
          ...baseItem,
          id: 'child1',
          type: 'todo',
          content: 'Child 1',
          scheduledTime: null,
          hasTime: false,
          parentId: 'parent',
          parentType: 'todo',
          depthLevel: 1,
          children: [],
          embeddedItems: [],
          completionLinkId: null,
        } as Todo,
        {
          ...baseItem,
          id: 'child2',
          type: 'note',
          content: 'Child 2',
          linkPreviews: [],
          children: ['grandchild'],
          parentId: 'parent',
          parentType: 'todo',
          depthLevel: 1,
          orderIndex: 0,
        } as Note,
        {
          ...baseItem,
          id: 'grandchild',
          type: 'note',
          content: 'Grandchild',
          linkPreviews: [],
          children: [],
          parentId: 'child2',
          parentType: 'note',
          depthLevel: 2,
          orderIndex: 0,
        } as Note,
        {
          ...baseItem,
          id: 'unrelated',
          type: 'note',
          content: 'Unrelated',
          linkPreviews: [],
          children: [],
          parentId: null,
          parentType: null,
          depthLevel: 0,
          orderIndex: 0,
        } as Note,
      ];
    };

    it('should collect single item when no children', () => {
      const items = createTestItems();
      const ids = collectDescendantIds('unrelated', items);

      expect(ids.size).toBe(1);
      expect(ids.has('unrelated')).toBe(true);
    });

    it('should collect item and all descendants', () => {
      const items = createTestItems();
      const ids = collectDescendantIds('parent', items);

      expect(ids.size).toBe(4);
      expect(ids.has('parent')).toBe(true);
      expect(ids.has('child1')).toBe(true);
      expect(ids.has('child2')).toBe(true);
      expect(ids.has('grandchild')).toBe(true);
      expect(ids.has('unrelated')).toBe(false);
    });

    it('should collect partial tree', () => {
      const items = createTestItems();
      const ids = collectDescendantIds('child2', items);

      expect(ids.size).toBe(2);
      expect(ids.has('child2')).toBe(true);
      expect(ids.has('grandchild')).toBe(true);
    });

    it('should handle non-existent id', () => {
      const items = createTestItems();
      const ids = collectDescendantIds('nonexistent', items);

      expect(ids.size).toBe(1);
      expect(ids.has('nonexistent')).toBe(true);
    });
  });

  describe('getDeletedItemsWithIndices', () => {
    it('should return items and indices for deletion', () => {
      const now = new Date();
      const items: Item[] = [
        {
          id: 'a',
          userId: 'user-1',
          type: 'note',
          content: 'A',
          createdAt: now,
          createdDate: '2024-01-01',
          updatedAt: now,
          completedAt: null,
          cancelledAt: null,
          linkPreviews: [],
          children: [],
          parentId: null,
          parentType: null,
          depthLevel: 0,
          orderIndex: 0,
        } as Note,
        {
          id: 'b',
          userId: 'user-1',
          type: 'note',
          content: 'B',
          createdAt: now,
          createdDate: '2024-01-01',
          updatedAt: now,
          completedAt: null,
          cancelledAt: null,
          linkPreviews: [],
          children: [],
          parentId: null,
          parentType: null,
          depthLevel: 0,
          orderIndex: 0,
        } as Note,
        {
          id: 'c',
          userId: 'user-1',
          type: 'note',
          content: 'C',
          createdAt: now,
          createdDate: '2024-01-01',
          updatedAt: now,
          completedAt: null,
          cancelledAt: null,
          linkPreviews: [],
          children: [],
          parentId: null,
          parentType: null,
          depthLevel: 0,
          orderIndex: 0,
        } as Note,
      ];

      const idsToDelete = new Set(['a', 'c']);
      const result = getDeletedItemsWithIndices(idsToDelete, items);

      expect(result.deletedItems).toHaveLength(2);
      expect(result.deletedItems[0].id).toBe('a');
      expect(result.deletedItems[1].id).toBe('c');
      expect(result.deletedIndices).toEqual([0, 2]);
    });

    it('should return empty arrays when no matches', () => {
      const items: Item[] = [];
      const idsToDelete = new Set(['nonexistent']);
      const result = getDeletedItemsWithIndices(idsToDelete, items);

      expect(result.deletedItems).toHaveLength(0);
      expect(result.deletedIndices).toHaveLength(0);
    });
  });
});
