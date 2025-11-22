import { describe, it, expect, beforeEach } from 'vitest';
import { useHistory, moveToRedo, moveToUndo } from './useHistory';

describe('useHistory', () => {
  beforeEach(() => {
    // Reset state before each test
    useHistory.setState({
      undoStack: [],
      redoStack: [],
      performUndo: null,
      performRedo: null,
    });
  });

  describe('recordAction', () => {
    it('should add action to undo stack', () => {
      const action = {
        type: 'create' as const,
        timestamp: new Date(),
        item: { id: '1', type: 'todo' } as unknown as import('../types').Item,
      };

      useHistory.getState().recordAction(action);

      expect(useHistory.getState().undoStack).toHaveLength(1);
      expect(useHistory.getState().undoStack[0]).toEqual(action);
    });

    it('should clear redo stack when new action is recorded', () => {
      // Add something to redo stack first
      useHistory.setState({
        redoStack: [{ type: 'create', timestamp: new Date() }],
      });

      const action = {
        type: 'delete' as const,
        timestamp: new Date(),
        deletedItems: [],
        deletedIndices: [],
      };

      useHistory.getState().recordAction(action);

      expect(useHistory.getState().redoStack).toHaveLength(0);
    });

    it('should limit stack size to maxStackSize', () => {
      const state = useHistory.getState();

      // Add more actions than maxStackSize
      for (let i = 0; i < 25; i++) {
        state.recordAction({
          type: 'create',
          timestamp: new Date(),
          item: { id: `${i}` } as unknown as import('../types').Item,
        });
      }

      expect(useHistory.getState().undoStack).toHaveLength(20);
      // Should have removed oldest items
      expect(useHistory.getState().undoStack[0].item?.id).toBe('5');
    });
  });

  describe('canUndo', () => {
    it('should return false when undo stack is empty', () => {
      expect(useHistory.getState().canUndo()).toBe(false);
    });

    it('should return true when undo stack has items', () => {
      useHistory.getState().recordAction({
        type: 'create',
        timestamp: new Date(),
      });

      expect(useHistory.getState().canUndo()).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('should return false when redo stack is empty', () => {
      expect(useHistory.getState().canRedo()).toBe(false);
    });

    it('should return true when redo stack has items', () => {
      useHistory.setState({
        redoStack: [{ type: 'create', timestamp: new Date() }],
      });

      expect(useHistory.getState().canRedo()).toBe(true);
    });
  });

  describe('clearHistory', () => {
    it('should clear both stacks', () => {
      useHistory.setState({
        undoStack: [{ type: 'create', timestamp: new Date() }],
        redoStack: [{ type: 'delete', timestamp: new Date() }],
      });

      useHistory.getState().clearHistory();

      expect(useHistory.getState().undoStack).toHaveLength(0);
      expect(useHistory.getState().redoStack).toHaveLength(0);
    });
  });

  describe('setUndoHandler / setRedoHandler', () => {
    it('should set undo handler', () => {
      const handler = () => {};
      useHistory.getState().setUndoHandler(handler);

      expect(useHistory.getState().performUndo).toBe(handler);
    });

    it('should set redo handler', () => {
      const handler = () => {};
      useHistory.getState().setRedoHandler(handler);

      expect(useHistory.getState().performRedo).toBe(handler);
    });
  });

  describe('moveToRedo', () => {
    it('should move last action from undo to redo stack', () => {
      const action = { type: 'create' as const, timestamp: new Date() };
      useHistory.setState({
        undoStack: [action],
        redoStack: [],
      });

      moveToRedo();

      expect(useHistory.getState().undoStack).toHaveLength(0);
      expect(useHistory.getState().redoStack).toHaveLength(1);
      expect(useHistory.getState().redoStack[0]).toEqual(action);
    });

    it('should do nothing if undo stack is empty', () => {
      useHistory.setState({
        undoStack: [],
        redoStack: [],
      });

      moveToRedo();

      expect(useHistory.getState().undoStack).toHaveLength(0);
      expect(useHistory.getState().redoStack).toHaveLength(0);
    });
  });

  describe('moveToUndo', () => {
    it('should move last action from redo to undo stack', () => {
      const action = { type: 'create' as const, timestamp: new Date() };
      useHistory.setState({
        undoStack: [],
        redoStack: [action],
      });

      moveToUndo();

      expect(useHistory.getState().redoStack).toHaveLength(0);
      expect(useHistory.getState().undoStack).toHaveLength(1);
      expect(useHistory.getState().undoStack[0]).toEqual(action);
    });

    it('should do nothing if redo stack is empty', () => {
      useHistory.setState({
        undoStack: [],
        redoStack: [],
      });

      moveToUndo();

      expect(useHistory.getState().undoStack).toHaveLength(0);
      expect(useHistory.getState().redoStack).toHaveLength(0);
    });
  });
});
