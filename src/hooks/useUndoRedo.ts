import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useHistory, moveToRedo, moveToUndo } from '../store/useHistory';
import { Item, Todo, Note } from '../types';

/**
 * Hook to setup undo/redo handlers
 * Must be called once in the app root
 */
export function useUndoRedo() {
  const {
    addItemDirect,
    addItemAtIndex,
    updateItem,
    deleteItem,
    toggleTodoComplete,
    setSkipHistory,
  } = useStore();
  const { setUndoHandler, setRedoHandler, undoStack, redoStack } = useHistory();

  useEffect(() => {
    // Setup undo handler
    setUndoHandler(() => {
      // Get latest state from store (not stale closure values)
      const currentUndoStack = useHistory.getState().undoStack;
      if (currentUndoStack.length === 0) return;

      const action = currentUndoStack[currentUndoStack.length - 1];

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
            // Undo delete: restore all deleted items at their original positions
            if (action.deletedItems && action.deletedIndices) {
              // Restore items in order of their original indices (ascending)
              // to maintain correct positions
              const itemsWithIndices = action.deletedItems.map((item, i) => ({
                item,
                index: action.deletedIndices![i],
              }));
              itemsWithIndices.sort((a, b) => a.index - b.index);

              itemsWithIndices.forEach(({ item, index }) => {
                addItemAtIndex(item, index);
              });

              // Restore parent-child relationships
              action.deletedItems.forEach((item) => {
                if (item.parentId) {
                  // Get latest items from store
                  const currentItems = useStore.getState().items;
                  const parent = currentItems.find((i) => i.id === item.parentId);
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
            } else if (action.deletedItems) {
              // Fallback for old history entries without indices
              action.deletedItems.forEach((item) => {
                addItemDirect(item);
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
                const oldItem = action.oldItem;
                (Object.keys(action.updates) as Array<keyof Item>).forEach((key) => {
                  if (key in oldItem) {
                    (revertUpdates as Record<keyof Item, unknown>)[key] = oldItem[key];
                  }
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
      // Get latest state from store (not stale closure values)
      const currentRedoStack = useHistory.getState().redoStack;
      if (currentRedoStack.length === 0) return;

      const action = currentRedoStack[currentRedoStack.length - 1];

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
    setUndoHandler,
    setRedoHandler,
    addItemDirect,
    addItemAtIndex,
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
