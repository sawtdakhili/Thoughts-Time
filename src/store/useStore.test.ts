import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';
import { Todo, Note } from '../types';

describe('useStore', () => {
  // Clear store before each test
  beforeEach(() => {
    const { items } = useStore.getState();
    items.forEach((item) => {
      useStore.getState().deleteItem(item.id);
    });
  });

  describe('deleteItem', () => {
    it('deletes a single item without children', () => {
      const { addItem, deleteItem } = useStore.getState();

      // Add an item
      const itemId = addItem('t Buy milk tomorrow at 2pm');

      // Verify it was added
      expect(useStore.getState().items.length).toBe(1);
      expect(useStore.getState().items[0].id).toBe(itemId);

      // Delete it
      deleteItem(itemId);

      // Verify it was deleted
      expect(useStore.getState().items.length).toBe(0);
    });

    it('cascade deletes todo with subtasks', () => {
      const { addItem, deleteItem } = useStore.getState();

      // Add a parent todo
      const parentId = addItem('t Parent task tomorrow at 2pm');
      expect(useStore.getState().items.length).toBe(1);

      // Add two subtasks
      const subtask1Id = addItem('t Subtask 1', parentId, 1);
      const subtask2Id = addItem('t Subtask 2', parentId, 1);

      // Verify all items exist
      const stateAfterAdd = useStore.getState();
      expect(stateAfterAdd.items.length).toBe(3);

      const parentTodo = stateAfterAdd.items.find((i) => i.id === parentId) as Todo;
      expect(parentTodo.children).toEqual([subtask1Id, subtask2Id]);

      // Delete parent
      deleteItem(parentId);

      // Verify all items (parent + subtasks) are deleted
      const stateAfterDelete = useStore.getState();
      expect(stateAfterDelete.items.length).toBe(0);
    });

    it('cascade deletes note with sub-items', () => {
      const { addItem, deleteItem } = useStore.getState();

      // Add a parent note
      const parentId = addItem('n Parent note');
      expect(useStore.getState().items.length).toBe(1);

      // Add two sub-items
      const subItem1Id = addItem('n Sub-note 1', parentId, 1);
      const subItem2Id = addItem('t Sub-task', parentId, 1);

      // Verify all items exist
      const stateAfterAdd = useStore.getState();
      expect(stateAfterAdd.items.length).toBe(3);

      const parentNote = stateAfterAdd.items.find((i) => i.id === parentId) as Note;
      expect(parentNote.children).toEqual([subItem1Id, subItem2Id]);

      // Delete parent
      deleteItem(parentId);

      // Verify all items (parent + sub-items) are deleted
      const stateAfterDelete = useStore.getState();
      expect(stateAfterDelete.items.length).toBe(0);
    });

    it('cascade deletes deeply nested items', () => {
      const { addItem, deleteItem } = useStore.getState();

      // Add a parent note
      const parentId = addItem('n Parent note');

      // Add level 1 sub-item
      const level1Id = addItem('n Level 1', parentId, 1);

      // Add level 2 sub-item
      addItem('n Level 2', level1Id, 2);

      // Verify all items exist
      expect(useStore.getState().items.length).toBe(3);

      // Delete parent
      deleteItem(parentId);

      // Verify all items are deleted
      expect(useStore.getState().items.length).toBe(0);
    });

    it('cleans up parent references when deleting children', () => {
      const { addItem, deleteItem } = useStore.getState();

      // Add parent and children
      const parentId = addItem('t Parent');
      const child1Id = addItem('t Child 1', parentId, 1);
      const child2Id = addItem('t Child 2', parentId, 1);

      // Verify parent has children
      const parent1 = useStore.getState().items.find((i) => i.id === parentId) as Todo;
      expect(parent1.children).toEqual([child1Id, child2Id]);

      // Delete one child
      deleteItem(child1Id);

      // Verify parent's children array is cleaned up
      const parent2 = useStore.getState().items.find((i) => i.id === parentId) as Todo;
      expect(parent2.children).toEqual([child2Id]);
    });

    it('does nothing when deleting non-existent item', () => {
      const { addItem, deleteItem } = useStore.getState();

      // Add an item
      addItem('t Task');
      expect(useStore.getState().items.length).toBe(1);

      // Try to delete non-existent item
      deleteItem('non-existent-id');

      // Verify nothing changed
      expect(useStore.getState().items.length).toBe(1);
    });
  });

  describe('toggleTodoComplete', () => {
    it('marks todo as completed', () => {
      const { addItem, toggleTodoComplete } = useStore.getState();

      // Add a todo
      const todoId = addItem('t Buy milk tomorrow at 2pm');

      // Verify it's not completed
      const todo1 = useStore.getState().items.find((i) => i.id === todoId) as Todo;
      expect(todo1.completedAt).toBeNull();

      // Complete it
      toggleTodoComplete(todoId);

      // Verify it's completed
      const todo2 = useStore.getState().items.find((i) => i.id === todoId) as Todo;
      expect(todo2.completedAt).not.toBeNull();
      expect(todo2.completedAt).toBeInstanceOf(Date);
    });

    it('marks completed todo as incomplete', () => {
      const { addItem, toggleTodoComplete } = useStore.getState();

      // Add and complete a todo
      const todoId = addItem('t Task');
      toggleTodoComplete(todoId);

      const todo1 = useStore.getState().items.find((i) => i.id === todoId) as Todo;
      expect(todo1.completedAt).not.toBeNull();

      // Uncomplete it
      toggleTodoComplete(todoId);

      // Verify it's incomplete
      const todo2 = useStore.getState().items.find((i) => i.id === todoId) as Todo;
      expect(todo2.completedAt).toBeNull();
    });

    it('completes parent and all subtasks together', () => {
      const { addItem, toggleTodoComplete } = useStore.getState();

      // Add parent and subtasks
      const parentId = addItem('t Parent');
      const child1Id = addItem('t Child 1', parentId, 1);
      const child2Id = addItem('t Child 2', parentId, 1);

      // Complete parent
      toggleTodoComplete(parentId);

      // Verify parent and all children are completed
      const state = useStore.getState();
      const parent = state.items.find((i) => i.id === parentId) as Todo;
      const child1 = state.items.find((i) => i.id === child1Id) as Todo;
      const child2 = state.items.find((i) => i.id === child2Id) as Todo;

      expect(parent.completedAt).not.toBeNull();
      expect(child1.completedAt).not.toBeNull();
      expect(child2.completedAt).not.toBeNull();
    });

    it('uncompletes parent and all subtasks together', () => {
      const { addItem, toggleTodoComplete } = useStore.getState();

      // Add parent and subtasks
      const parentId = addItem('t Parent');
      const child1Id = addItem('t Child 1', parentId, 1);
      const child2Id = addItem('t Child 2', parentId, 1);

      // Complete then uncomplete
      toggleTodoComplete(parentId);
      toggleTodoComplete(parentId);

      // Verify parent and all children are uncompleted
      const state = useStore.getState();
      const parent = state.items.find((i) => i.id === parentId) as Todo;
      const child1 = state.items.find((i) => i.id === child1Id) as Todo;
      const child2 = state.items.find((i) => i.id === child2Id) as Todo;

      expect(parent.completedAt).toBeNull();
      expect(child1.completedAt).toBeNull();
      expect(child2.completedAt).toBeNull();
    });

    it('updates updatedAt timestamp', () => {
      const { addItem, toggleTodoComplete } = useStore.getState();

      const todoId = addItem('t Task');
      const originalUpdatedAt = useStore.getState().items.find((i) => i.id === todoId)!.updatedAt;

      // Wait a tiny bit to ensure timestamp difference
      const before = Date.now();
      toggleTodoComplete(todoId);
      const after = Date.now();

      const newUpdatedAt = useStore.getState().items.find((i) => i.id === todoId)!.updatedAt;
      const newTimestamp = newUpdatedAt.getTime();

      expect(newTimestamp).toBeGreaterThanOrEqual(before);
      expect(newTimestamp).toBeLessThanOrEqual(after);
      expect(newUpdatedAt).not.toBe(originalUpdatedAt);
    });

    it('does nothing when toggling non-existent item', () => {
      const { addItem, toggleTodoComplete } = useStore.getState();

      addItem('t Task');
      const originalLength = useStore.getState().items.length;

      // Try to toggle non-existent item
      toggleTodoComplete('non-existent-id');

      // Verify nothing changed
      expect(useStore.getState().items.length).toBe(originalLength);
    });

    it('does nothing when toggling non-todo item', () => {
      const { addItem, toggleTodoComplete } = useStore.getState();

      const noteId = addItem('* Note');
      const originalNote = useStore.getState().items.find((i) => i.id === noteId);

      // Try to toggle note (not a todo)
      toggleTodoComplete(noteId);

      // Verify nothing changed
      const newNote = useStore.getState().items.find((i) => i.id === noteId);
      expect(newNote).toEqual(originalNote);
    });
  });
});
