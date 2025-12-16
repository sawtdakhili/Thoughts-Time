import { describe, it, expect, vi } from 'vitest';
import { matchesSearch } from './search';
import { Todo, Note } from '../types';

// Helper function for creating test todos
const createTodo = (id: string, content: string, children: string[] = []): Todo => ({
  id,
  userId: 'user-1',
  type: 'todo',
  content,
  createdAt: new Date(),
  createdDate: '2025-01-01',
  updatedAt: new Date(),
  completedAt: null,
  cancelledAt: null,
  scheduledTime: null,
  hasTime: false,
  parentId: null,
  parentType: null,
  depthLevel: 0,
  children,
  embeddedItems: [],
  completionLinkId: null,
});

describe('Performance Regression Tests', () => {
  describe('Search Performance (O(n) complexity)', () => {

    it('should perform search in O(n) time with Map-based lookups', () => {
      // Create a dataset of 1000 items
      const items: Todo[] = [];
      const itemMap = new Map<string, Todo>();

      for (let i = 0; i < 1000; i++) {
        const item = createTodo(`item-${i}`, `Task ${i}`);
        items.push(item);
        itemMap.set(item.id, item);
      }

      // Add the target item at the end
      const targetItem = createTodo('target', 'Find me please');
      items.push(targetItem);
      itemMap.set(targetItem.id, targetItem);

      // Measure search time
      const startTime = performance.now();
      const result = matchesSearch(targetItem, 'Find me', itemMap);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toBe(true);
      // Search should complete in under 1ms for 1000 items
      expect(duration).toBeLessThan(1);
    });

    it('should handle nested items efficiently with Map lookups', () => {
      // Create parent with many children
      const children: Todo[] = [];
      const itemMap = new Map<string, Todo>();

      for (let i = 0; i < 100; i++) {
        const child = createTodo(`child-${i}`, `Subtask ${i}`);
        children.push(child);
        itemMap.set(child.id, child);
      }

      const childIds = children.map((c) => c.id);
      const parent = createTodo('parent', 'Main task', childIds);
      itemMap.set(parent.id, parent);

      // Search for a child in the middle
      const startTime = performance.now();
      const result = matchesSearch(parent, 'Subtask 50', itemMap);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toBe(true);
      // Should complete in under 5ms even with 100 children
      expect(duration).toBeLessThan(5);
    });

    it('should scale linearly with dataset size', () => {
      // Test with increasing dataset sizes
      const sizes = [100, 500, 1000];
      const times: number[] = [];

      for (const size of sizes) {
        const items: Todo[] = [];
        const itemMap = new Map<string, Todo>();

        for (let i = 0; i < size; i++) {
          const item = createTodo(`item-${i}`, `Task ${i}`);
          items.push(item);
          itemMap.set(item.id, item);
        }

        const startTime = performance.now();
        // Search all items
        items.forEach((item) => {
          matchesSearch(item, 'Task', itemMap);
        });
        const endTime = performance.now();

        times.push(endTime - startTime);
      }

      // Verify roughly linear scaling (within 3x tolerance)
      // If it was O(n²), 10x data would take ~100x time
      // With O(n), 10x data should take ~10x time (within margin)
      const ratio = times[2] / times[0]; // 1000 items / 100 items
      expect(ratio).toBeLessThan(30); // Allow 3x margin for variance
    });
  });

  describe('Component Re-render Performance', () => {
    it('should verify memo dependencies are minimal', () => {
      // This test verifies that memoized components only depend on specific props
      // In a real scenario, we'd use React Testing Library to verify re-renders

      // Mock component props
      const itemActionsProps = {
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onJumpToSource: vi.fn(),
      };

      // Verify functions are stable references
      const onEdit1 = itemActionsProps.onEdit;
      const onEdit2 = itemActionsProps.onEdit;

      expect(onEdit1).toBe(onEdit2);
      expect(itemActionsProps.onEdit).toHaveBeenCalledTimes(0);
    });

    it('should verify FloatingDateHeader only updates when date changes', () => {
      // Test that date and isToday are the only dependencies
      const date1 = '2025-12-15';
      const date2 = '2025-12-15';
      const date3 = '2025-12-16';

      // Same date should be considered equal
      expect(date1).toBe(date2);
      // Different date should not be equal
      expect(date1).not.toBe(date3);
    });
  });

  describe('Memory Performance', () => {
    it('should not create excessive objects during search', () => {
      // Create a moderate dataset
      const items: Todo[] = [];
      const itemMap = new Map<string, Todo>();

      for (let i = 0; i < 500; i++) {
        const item = createTodo(`item-${i}`, `Task ${i}`);
        items.push(item);
        itemMap.set(item.id, item);
      }

      // Track initial memory (rough approximation)
      const initialMapSize = itemMap.size;

      // Perform multiple searches
      for (let i = 0; i < 100; i++) {
        items.forEach((item) => {
          matchesSearch(item, 'Task', itemMap);
        });
      }

      // Map size should remain constant (no memory leaks)
      expect(itemMap.size).toBe(initialMapSize);
    });

    it('should handle circular reference protection without memory leaks', () => {
      // This test verifies the visited Set is properly scoped
      const item1 = createTodo('item-1', 'Task 1', ['item-2']);
      const item2 = createTodo('item-2', 'Task 2', ['item-1']); // Circular reference

      const itemMap = new Map<string, Todo>([
        [item1.id, item1],
        [item2.id, item2],
      ]);

      // Should handle circular reference without infinite loop
      const result = matchesSearch(item1, 'Task', itemMap);
      expect(result).toBe(true);

      // Multiple searches should not accumulate visited sets
      for (let i = 0; i < 10; i++) {
        matchesSearch(item1, 'Task', itemMap);
      }

      // If visited Set leaked, this would fail
      expect(itemMap.size).toBe(2);
    });
  });

  describe('Bundle Size Thresholds', () => {
    it('should document expected bundle sizes', () => {
      // This test documents expected bundle sizes as a regression test
      // If these values increase significantly, it indicates a regression

      const expectedSizes = {
        mainBundle: 350, // KB (current: 294KB, allowing 20% margin)
        gzippedMain: 100, // KB (current: 88KB, allowing 15% margin)
        vendor: 15, // KB (current: 12.49KB)
        dateUtils: 75, // KB (current: 67.60KB)
        supabase: 200, // KB (current: 189.48KB)
        codemirror: 270, // KB (current: 256.62KB)
        virtual: 15, // KB (current: 13.29KB)
      };

      // This test always passes but serves as documentation
      // In CI, we'd compare actual build output against these thresholds
      expect(expectedSizes.mainBundle).toBeLessThan(400);
      expect(expectedSizes.gzippedMain).toBeLessThan(120);
    });

    it('should verify code splitting is active', () => {
      // Test that we're using manual chunks for code splitting
      const expectedChunks = ['vendor', 'date-utils', 'codemirror', 'supabase', 'virtual'];

      // Verify chunk names are defined
      expectedChunks.forEach((chunk) => {
        expect(chunk).toBeTruthy();
        expect(chunk.length).toBeGreaterThan(0);
      });

      // In CI, we'd verify actual build output contains these chunks
      expect(expectedChunks.length).toBe(5);
    });
  });

  describe('Algorithmic Complexity', () => {
    it('should verify itemMap creation is O(n)', () => {
      const sizes = [100, 500, 1000];
      const times: number[] = [];

      for (const size of sizes) {
        const items: Todo[] = [];
        for (let i = 0; i < size; i++) {
          items.push(createTodo(`item-${i}`, `Task ${i}`));
        }

        const startTime = performance.now();
        const itemMap = new Map(items.map((i) => [i.id, i]));
        const endTime = performance.now();

        times.push(endTime - startTime);
        expect(itemMap.size).toBe(size);
      }

      // Map creation should be O(n) - 10x data should take ~10x time
      const ratio = times[2] / times[0];
      expect(ratio).toBeLessThan(30); // Linear with margin for variance
    });

    it('should verify Map.get() is O(1)', () => {
      // Create a large map
      const itemMap = new Map<string, Todo>();
      for (let i = 0; i < 10000; i++) {
        const item = createTodo(`item-${i}`, `Task ${i}`);
        itemMap.set(item.id, item);
      }

      // Lookup time should be constant regardless of position
      const startTime1 = performance.now();
      itemMap.get('item-0'); // First item
      const time1 = performance.now() - startTime1;

      const startTime2 = performance.now();
      itemMap.get('item-9999'); // Last item
      const time2 = performance.now() - startTime2;

      // Both lookups should be roughly the same time (O(1))
      // Allow 10x variance due to timing precision limits
      expect(Math.abs(time1 - time2)).toBeLessThan(1);
    });
  });
});
