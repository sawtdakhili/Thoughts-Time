import { create } from 'zustand';
import { Item } from '../types';

export type ActionType = 'create' | 'delete' | 'edit' | 'complete' | 'update';

export interface HistoryAction {
  type: ActionType;
  timestamp: Date;
  // For create
  item?: Item;
  originalIndex?: number; // For restoring at original position
  // For delete (need to restore item + all children)
  deletedItems?: Item[];
  deletedIndices?: number[]; // Original indices of deleted items
  // For edit
  itemId?: string;
  oldContent?: string;
  newContent?: string;
  // For complete
  wasCompleted?: boolean;
  // For update
  oldItem?: Item;
  updates?: Partial<Item>;
}

interface HistoryState {
  undoStack: HistoryAction[];
  redoStack: HistoryAction[];
  maxStackSize: number;

  recordAction: (action: HistoryAction) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // These will be implemented by consuming the store functions
  performUndo: (() => void) | null;
  performRedo: (() => void) | null;
  setUndoHandler: (handler: () => void) => void;
  setRedoHandler: (handler: () => void) => void;
}

export const useHistory = create<HistoryState>()((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxStackSize: 20, // Keep last 20 actions

  recordAction: (action: HistoryAction) => {
    set((state) => {
      const newUndoStack = [...state.undoStack, action];

      // Limit stack size
      if (newUndoStack.length > state.maxStackSize) {
        newUndoStack.shift(); // Remove oldest action
      }

      return {
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack when new action is performed
      };
    });
  },

  canUndo: () => get().undoStack.length > 0,

  canRedo: () => get().redoStack.length > 0,

  clearHistory: () => {
    set({ undoStack: [], redoStack: [] });
  },

  performUndo: null,
  performRedo: null,

  setUndoHandler: (handler: () => void) => {
    set({ performUndo: handler });
  },

  setRedoHandler: (handler: () => void) => {
    set({ performRedo: handler });
  },
}));

// Helper to move action from undo to redo stack
export const moveToRedo = () => {
  useHistory.setState((state) => {
    const undoStack = [...state.undoStack];
    const action = undoStack.pop();

    if (!action) return state;

    return {
      undoStack,
      redoStack: [...state.redoStack, action],
    };
  });
};

// Helper to move action from redo to undo stack
export const moveToUndo = () => {
  useHistory.setState((state) => {
    const redoStack = [...state.redoStack];
    const action = redoStack.pop();

    if (!action) return state;

    return {
      redoStack,
      undoStack: [...state.undoStack, action],
    };
  });
};
