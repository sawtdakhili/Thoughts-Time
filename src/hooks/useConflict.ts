import { create } from 'zustand';
import { Item } from '../types';

interface ConflictState {
  isOpen: boolean;
  localItem: Item | null;
  serverItem: Item | null;
  onUseLocal: (() => void) | null;
  onUseServer: (() => void) | null;
  showConflict: (
    localItem: Item,
    serverItem: Item,
    onUseLocal: () => void,
    onUseServer: () => void
  ) => void;
  closeConflict: () => void;
}

/**
 * Hook for managing sync conflict dialogs.
 * When a conflict is detected, call showConflict() to display the dialog.
 */
export const useConflict = create<ConflictState>((set) => ({
  isOpen: false,
  localItem: null,
  serverItem: null,
  onUseLocal: null,
  onUseServer: null,

  showConflict: (localItem, serverItem, onUseLocal, onUseServer) => {
    set({
      isOpen: true,
      localItem,
      serverItem,
      onUseLocal,
      onUseServer,
    });
  },

  closeConflict: () => {
    set({
      isOpen: false,
      localItem: null,
      serverItem: null,
      onUseLocal: null,
      onUseServer: null,
    });
  },
}));
