import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useHistory, moveToRedo, moveToUndo } from '../store/useHistory';
import { Item, Todo, Note } from '../types';

/**
 * Hook to setup undo/redo handlers
 * Must be called once in the app root
 */
export function useUndoRedo() {
  const { items, addItemDirect, updateItem, deleteItem, toggleTodoComplete, setSkipHistory } = useStore();
  const { setUndoHandler, setRedoHandler, undoStack, redoStack } = useHistory();

  useEffect(() => {
    // Setup undo handler
    setUndoHandler(() => {
      if (undoStack.length === 0) return;

      const action = undoStack[undoStack.length - 1];

      // Set skipHistory to prevent recording undo operations
      setSkipHistory(true);

      try {
        switch (action.type) {
        case 'create':
          // Undo create: delete the item
          if (action.item) {
            deleteItem(action.item.id);
          }
          break;

        case 'delete':
          // Undo delete: restore all deleted items
          if (action.deletedItems) {
            action.deletedItems.forEach((item) => {
              addItemDirect(item);
            });

            // Restore parent-child relationships
            action.deletedItems.forEach((item) => {
              if (item.parentId) {
                const parent = items.find(i => i.id === item.parentId);
                if (parent) {
                  if (parent.type === 'todo') {
                    const parentTodo = parent as Todo;
                    if (!parentTodo.subtasks.includes(item.id)) {
                      updateItem(parent.id, {
                        subtasks: [...parentTodo.subtasks, item.id],
                      });
                    }
                  } else if (parent.type === 'note') {
                    const parentNote = parent as Note;
                    if (!parentNote.subItems.includes(item.id)) {
                      updateItem(parent.id, {
                        subItems: [...parentNote.subItems, item.id],
                      });
                    }
                  }
                }
              }
            });
          }
          break;

        case 'edit':
          // Undo edit: restore old content
          if (action.itemId && action.oldContent !== undefined) {
            updateItem(action.itemId, { content: action.oldContent });
          }
          break;

        case 'complete':
          // Undo complete: toggle back
          if (action.itemId) {
            toggleTodoComplete(action.itemId);
          }
          break;

        case 'update':
          // Undo update: restore old item state
          if (action.itemId && action.oldItem) {
            // Extract only the fields that were updated
            const revertUpdates: Partial<Item> = {};
            if (action.updates) {
              Object.keys(action.updates).forEach((key) => {
                const k = key as keyof Item;
                (revertUpdates as Record<string, unknown>)[k] = (action.oldItem as Record<string, unknown>)[k];
              });
            }
            updateItem(action.itemId, revertUpdates);
          }
          break;
        }

        // Move action from undo to redo stack
        moveToRedo();
      } finally {
        // Re-enable history recording
        setSkipHistory(false);
      }
    });

    // Setup redo handler
    setRedoHandler(() => {
      if (redoStack.length === 0) return;

      const action = redoStack[redoStack.length - 1];

      // Set skipHistory to prevent recording redo operations
      setSkipHistory(true);

      try {
        switch (action.type) {
        case 'create':
          // Redo create: add the item back
          if (action.item) {
            addItemDirect(action.item);
          }
          break;

        case 'delete':
          // Redo delete: delete the items again
          if (action.deletedItems && action.deletedItems.length > 0) {
            deleteItem(action.deletedItems[0].id);
          }
          break;

        case 'edit':
          // Redo edit: apply new content
          if (action.itemId && action.newContent !== undefined) {
            updateItem(action.itemId, { content: action.newContent });
          }
          break;

        case 'complete':
          // Redo complete: toggle again
          if (action.itemId) {
            toggleTodoComplete(action.itemId);
          }
          break;

        case 'update':
          // Redo update: apply updates again
          if (action.itemId && action.updates) {
            updateItem(action.itemId, action.updates);
          }
          break;
        }

        // Move action from redo to undo stack
        moveToUndo();
      } finally {
        // Re-enable history recording
        setSkipHistory(false);
      }
    });
  }, [
    undoStack,
    redoStack,
    items,
    setUndoHandler,
    setRedoHandler,
    addItemDirect,
    updateItem,
    deleteItem,
    toggleTodoComplete,
    setSkipHistory,
  ]);

  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undo: () => useHistory.getState().performUndo?.(),
    redo: () => useHistory.getState().performRedo?.(),
  };
}
