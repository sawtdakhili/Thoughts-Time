import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import { Item, Todo, Event, Routine, Note, ParsedLine } from '../types';
import { parseInput, parseMultiLine } from '../utils/parser';
import { useHistory } from './useHistory';
import { useToast } from '../hooks/useToast';
import {
  generateId,
  validateDepth,
  validateChildType,
  collectDescendantIds,
  getDeletedItemsWithIndices,
  VALIDATION_MESSAGES,
} from './itemHelpers';
import * as syncService from '../services/syncService';

/**
 * Main application state interface for Thoughts & Time.
 *
 * Manages all items (todos, events, routines, notes) with CRUD operations,
 * history tracking for undo/redo, and computed getters for date-based views.
 */
interface AppState {
  /** All items in the store */
  items: Item[];
  /** Flag to prevent recording history during undo/redo operations */
  skipHistory: boolean;

  /**
   * Add a new item by parsing user input.
   * @param input - Raw user input with prefix (t, e, r, n)
   * @param parentId - Optional parent item ID for nesting
   * @param depthLevel - Nesting depth (0=top, 1=sub, 2=sub-sub)
   * @returns The generated item ID
   */
  addItem: (input: string, parentId?: string | null, depthLevel?: number) => string;

  /**
   * Add multiple items from multi-line input with hierarchy.
   * @param input - Multi-line input with prefixes and Tab indentation
   * @param rootParentId - Optional parent ID for all top-level items (for editing)
   * @param depthOffset - Optional depth offset to add to all levels (for editing)
   * @returns Object with created item IDs and any errors
   */
  addItems: (
    input: string,
    rootParentId?: string | null,
    depthOffset?: number
  ) => { ids: string[]; errors: string[]; needsTimePrompt: ParsedLine[] };

  /**
   * Add a pre-constructed item directly (used by undo/redo).
   * @param item - Complete item object to add
   */
  addItemDirect: (item: Item) => void;

  /**
   * Add a pre-constructed item at a specific index (used by undo to restore position).
   * @param item - Complete item object to add
   * @param index - Position to insert at
   */
  addItemAtIndex: (item: Item, index: number) => void;

  /**
   * Update an existing item's properties.
   * @param id - Item ID to update
   * @param updates - Partial item properties to merge
   */
  updateItem: (id: string, updates: Partial<Item>) => void;

  /**
   * Delete an item and all its children (cascade delete).
   * @param id - Item ID to delete
   */
  deleteItem: (id: string) => void;

  /**
   * Toggle a todo's completion state. Cascades to subtasks.
   * @param id - Todo item ID
   */
  toggleTodoComplete: (id: string) => void;

  /**
   * Set the skipHistory flag (used during undo/redo).
   * @param skip - Whether to skip history recording
   */
  setSkipHistory: (skip: boolean) => void;

  /**
   * Get all items grouped by creation date.
   * @returns Map of date strings to item arrays
   */
  getItemsByDate: () => Map<string, Item[]>;

  /**
   * Get scheduled items grouped by scheduled date.
   * @returns Map of date strings to scheduled item arrays
   */
  getScheduledItemsByDate: () => Map<string, Item[]>;

  /**
   * Get all dates that have items (created or scheduled).
   * @returns Sorted array of date strings
   */
  getAllDatesWithItems: () => string[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      items: [],
      skipHistory: false,

      setSkipHistory: (skip: boolean) => {
        set({ skipHistory: skip });
      },

      addItem: (input: string, parentId: string | null = null, depthLevel: number = 0) => {
        const parsed = parseInput(input);
        const now = new Date();
        const createdDate = format(now, 'yyyy-MM-dd');

        const newId = generateId();

        // Get parent item if exists
        const parentItem = parentId ? get().items.find((i) => i.id === parentId) : null;
        const parentType = parentItem?.type as 'todo' | 'note' | null;

        // VALIDATION: Depth constraints
        const depthError = validateDepth(parentType, depthLevel);
        if (depthError) {
          const message = VALIDATION_MESSAGES[depthError];
          useToast.getState().addToast(message, 'error');
          throw new Error(message);
        }

        // RULE: Sub-items follow the same parsing rules as top-level items
        // No prefix = note (default), t = todo, e = event, r = routine
        // VALIDATION: Todo sub-items can only be todos or notes
        const itemType = parsed.type;
        const childTypeError = validateChildType(parentType, parsed.type);
        if (childTypeError) {
          const message = VALIDATION_MESSAGES[childTypeError];
          useToast.getState().addToast(message, 'error');
          throw new Error(message);
        }
        // For notes: itemType remains as parsed.type (any type allowed via prefix)

        const baseItem = {
          id: newId,
          userId: 'guest', // Always use 'guest' - will be transformed on sync
          content: parsed.content,
          createdAt: now,
          createdDate,
          updatedAt: now,
          completedAt: null,
          cancelledAt: null,
        };

        let newItem: Item;

        switch (itemType) {
          case 'todo':
            newItem = {
              ...baseItem,
              type: 'todo',
              scheduledTime: parsed.scheduledTime,
              hasTime: parsed.hasTime,
              parentId,
              parentType,
              depthLevel,
              children: [],
              embeddedItems: parsed.embeddedNotes,
              completionLinkId: null,
            } as Todo;
            break;

          case 'event':
            newItem = {
              ...baseItem,
              type: 'event',
              startTime: parsed.scheduledTime || now,
              endTime: parsed.endTime || parsed.scheduledTime || now,
              hasTime: parsed.hasTime,
              isAllDay: !parsed.hasTime,
              splitStartId: null,
              splitEndId: null,
              embeddedItems: parsed.embeddedNotes,
              parentId,
              parentType,
              depthLevel,
              children: [],
            } as Event;
            break;

          case 'routine':
            newItem = {
              ...baseItem,
              type: 'routine',
              recurrencePattern: parsed.recurrencePattern || { frequency: 'daily', interval: 1 },
              scheduledTime: parsed.scheduledTime ? format(parsed.scheduledTime, 'HH:mm') : null,
              hasTime: parsed.hasTime,
              streak: 0,
              lastCompleted: null,
              embeddedItems: parsed.embeddedNotes,
              parentId: null,
              parentType: null,
              depthLevel: 0,
              children: [],
            } as Routine;
            break;

          case 'note':
          default:
            newItem = {
              ...baseItem,
              type: 'note',
              linkPreviews: [],
              children: [],
              parentId,
              parentType,
              depthLevel,
              orderIndex: 0,
            } as Note;
            break;
        }

        // Update parent item to include this child
        if (parentId) {
          set((state) => ({
            items: [
              ...state.items.map((item) => {
                if (item.id === parentId) {
                  // All types now use 'children' field
                  if ('children' in item) {
                    return { ...item, children: [...item.children, newId] };
                  }
                }
                return item;
              }),
              newItem,
            ],
          }));
        } else {
          set((state) => ({
            items: [...state.items, newItem],
          }));
        }

        // Sync to Supabase (syncService will check if authenticated)
        syncService.createItem(newItem).catch(console.error);

        return newId;
      },

      addItems: (input: string, rootParentId?: string | null, depthOffset: number = 0) => {
        const { lines, errors } = parseMultiLine(input);

        if (errors.length > 0 || lines.length === 0) {
          return { ids: [], errors, needsTimePrompt: [] };
        }

        const now = new Date();
        const createdDate = format(now, 'yyyy-MM-dd');
        const ids: string[] = [];
        const newItems: Item[] = [];
        const needsTimePrompt: ParsedLine[] = [];

        // Get root parent info if provided
        const { items } = get();
        const rootParent = rootParentId ? items.find((i) => i.id === rootParentId) : null;

        // Track parent at each level
        const parentStack: { id: string; level: number }[] = [];

        for (const line of lines) {
          const newId = generateId();
          ids.push(newId);

          // Adjust level with offset
          const adjustedLevel = line.level + depthOffset + (rootParentId ? 1 : 0);

          // Find parent based on level
          let parentId: string | null = null;
          let parentType: Item['type'] | null = null;

          if (line.level === 0 && rootParentId) {
            // First level items belong to the root parent
            parentId = rootParentId;
            parentType = rootParent?.type || null;
          } else if (line.level > 0) {
            // Pop items from stack until we find one at the correct parent level
            while (
              parentStack.length > 0 &&
              parentStack[parentStack.length - 1].level >= line.level
            ) {
              parentStack.pop();
            }
            if (parentStack.length > 0) {
              const parentInfo = parentStack[parentStack.length - 1];
              parentId = parentInfo.id;
              const parentItem = newItems.find((i) => i.id === parentId);
              parentType = parentItem?.type || null;
            } else if (rootParentId) {
              // Fall back to root parent if stack is empty
              parentId = rootParentId;
              parentType = rootParent?.type || null;
            }
          }

          // Check if this item needs time prompt
          if (line.needsTimePrompt) {
            needsTimePrompt.push(line);
          }

          const baseItem = {
            id: newId,
            userId: 'guest', // Always use 'guest' - will be transformed on sync
            content: line.content,
            createdAt: now,
            createdDate,
            updatedAt: now,
            completedAt: null,
            cancelledAt: null,
          };

          let newItem: Item;

          switch (line.type) {
            case 'todo':
              newItem = {
                ...baseItem,
                type: 'todo',
                scheduledTime: line.scheduledTime,
                hasTime: line.hasTime,
                parentId,
                parentType: parentType as 'todo' | 'note' | 'event' | null,
                depthLevel: adjustedLevel,
                children: [],
                embeddedItems: line.embeddedNotes,
                completionLinkId: null,
              } as Todo;
              break;

            case 'event':
              newItem = {
                ...baseItem,
                type: 'event',
                startTime: line.scheduledTime || now,
                endTime: line.endTime || line.scheduledTime || now,
                hasTime: line.hasTime,
                isAllDay: !line.hasTime,
                splitStartId: null,
                splitEndId: null,
                embeddedItems: line.embeddedNotes,
                parentId,
                parentType: parentType as 'note' | null,
                depthLevel: adjustedLevel,
                children: [],
              } as Event;
              break;

            case 'routine':
              newItem = {
                ...baseItem,
                type: 'routine',
                recurrencePattern: line.recurrencePattern || { frequency: 'daily', interval: 1 },
                scheduledTime: line.scheduledTime ? format(line.scheduledTime, 'HH:mm') : null,
                hasTime: line.hasTime,
                streak: 0,
                lastCompleted: null,
                embeddedItems: line.embeddedNotes,
                parentId: null,
                parentType: null,
                depthLevel: 0,
                children: [],
              } as Routine;
              break;

            case 'note':
            default:
              newItem = {
                ...baseItem,
                type: 'note',
                linkPreviews: [],
                children: [],
                parentId,
                parentType: parentType as 'todo' | 'note' | 'event' | 'routine' | null,
                depthLevel: adjustedLevel,
                orderIndex: 0,
              } as Note;
              break;
          }

          newItems.push(newItem);

          // Update parent's children array
          if (parentId) {
            const parentItem = newItems.find((i) => i.id === parentId);
            if (parentItem && 'children' in parentItem) {
              parentItem.children.push(newId);
            }
          }

          // Add to parent stack for potential children
          parentStack.push({ id: newId, level: line.level });
        }

        // Add all items to store
        const { skipHistory } = get();

        // Record history for all items
        if (!skipHistory) {
          for (const item of newItems) {
            useHistory.getState().recordAction({
              type: 'create',
              timestamp: new Date(),
              item,
            });
          }
        }

        // Collect IDs of direct children of the root parent
        const rootChildIds = rootParentId
          ? newItems.filter((item) => item.parentId === rootParentId).map((item) => item.id)
          : [];

        set((state) => {
          let updatedItems = [...state.items, ...newItems];

          // Update root parent's children array if needed
          if (rootParentId && rootChildIds.length > 0) {
            updatedItems = updatedItems.map((item) => {
              if (item.id === rootParentId && 'children' in item) {
                return {
                  ...item,
                  children: [...(item as { children: string[] }).children, ...rootChildIds],
                };
              }
              return item;
            });
          }

          return { items: updatedItems };
        });

        // Sync all new items to Supabase (syncService will check if authenticated)
        for (const item of newItems) {
          syncService.createItem(item).catch(console.error);
        }

        return { ids, errors: [], needsTimePrompt };
      },

      addItemDirect: (item: Item) => {
        const { skipHistory } = get();

        // Record history before adding
        if (!skipHistory) {
          useHistory.getState().recordAction({
            type: 'create',
            timestamp: new Date(),
            item,
          });
        }

        set((state) => ({
          items: [...state.items, item],
        }));

        // Sync to Supabase (syncService will check if authenticated)
        syncService.createItem(item).catch(console.error);
      },

      addItemAtIndex: (item: Item, index: number) => {
        set((state) => {
          const newItems = [...state.items];
          // Clamp index to valid range
          const insertIndex = Math.max(0, Math.min(index, newItems.length));
          newItems.splice(insertIndex, 0, item);
          return { items: newItems };
        });

        // Sync to Supabase (syncService will check if authenticated)
        syncService.createItem(item).catch(console.error);
      },

      updateItem: (id: string, updates: Partial<Item>) => {
        const { skipHistory, items } = get();
        const oldItem = items.find((i) => i.id === id);

        // Record history before updating (only for content changes, not internal updates)
        if (
          !skipHistory &&
          oldItem &&
          updates.content !== undefined &&
          updates.content !== oldItem.content
        ) {
          useHistory.getState().recordAction({
            type: 'edit',
            timestamp: new Date(),
            itemId: id,
            oldContent: oldItem.content,
            newContent: updates.content,
          });
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? ({ ...item, ...updates, updatedAt: new Date() } as Item) : item
          ),
        }));

        // Sync to Supabase (syncService will check if authenticated)
        if (oldItem) {
          const updatedItem = { ...oldItem, ...updates, updatedAt: new Date() } as Item;
          syncService.updateItem(updatedItem).catch(console.error);
        }
      },

      deleteItem: (id: string) => {
        const { skipHistory, items } = get();

        // Collect all items that will be deleted (for undo)
        const itemToDelete = items.find((i) => i.id === id);
        if (!itemToDelete) return;

        const idsToDelete = collectDescendantIds(id, items);
        const { deletedItems, deletedIndices } = getDeletedItemsWithIndices(idsToDelete, items);

        // Record history before deletion
        if (!skipHistory) {
          useHistory.getState().recordAction({
            type: 'delete',
            timestamp: new Date(),
            deletedItems,
            deletedIndices,
          });
        }

        set((state) => {
          // Remove all collected items and clean up parent references
          return {
            items: state.items
              .filter((item) => !idsToDelete.has(item.id))
              .map((item) => {
                // Clean up children references for all types
                if ('children' in item && item.children.length > 0) {
                  const cleanedChildren = item.children.filter((cid) => !idsToDelete.has(cid));
                  if (cleanedChildren.length !== item.children.length) {
                    return { ...item, children: cleanedChildren };
                  }
                }
                return item;
              }),
          };
        });

        // Sync deletions to Supabase (syncService will check if authenticated)
        for (const itemId of idsToDelete) {
          syncService.deleteItem(itemId).catch(console.error);
        }
      },

      toggleTodoComplete: (id: string) => {
        const { skipHistory, items } = get();
        const todo = items.find((i) => i.id === id && i.type === 'todo') as Todo | undefined;
        if (!todo) return;

        const wasCompleted = !!todo.completedAt;

        // Record history before toggling
        if (!skipHistory) {
          useHistory.getState().recordAction({
            type: 'complete',
            timestamp: new Date(),
            itemId: id,
            wasCompleted,
          });
        }

        set((state) => {
          const isCompleting = !wasCompleted; // Will be marked complete
          const now = new Date();

          return {
            items: state.items.map((item) => {
              // Mark the parent todo
              if (item.id === id && item.type === 'todo') {
                return {
                  ...item,
                  completedAt: isCompleting ? now : null,
                  updatedAt: now,
                };
              }

              // If completing parent, also complete all subtasks
              if (isCompleting && item.type === 'todo' && item.parentId === id) {
                return {
                  ...item,
                  completedAt: now,
                  updatedAt: now,
                };
              }

              // If uncompleting parent, also uncomplete subtasks
              if (!isCompleting && item.type === 'todo' && item.parentId === id) {
                return {
                  ...item,
                  completedAt: null,
                  updatedAt: now,
                };
              }

              return item;
            }),
          };
        });

        // Sync to Supabase (syncService will check if authenticated)
        // Get updated items from the state
        const updatedItems = get().items;
        const parentTodo = updatedItems.find((i) => i.id === id);
        if (parentTodo) {
          syncService.updateItem(parentTodo).catch(console.error);

          // Also sync all affected subtasks
          const subtasks = updatedItems.filter(
            (item) => item.type === 'todo' && item.parentId === id
          );
          for (const subtask of subtasks) {
            syncService.updateItem(subtask).catch(console.error);
          }
        }
      },

      getItemsByDate: () => {
        const itemsByDate = new Map<string, Item[]>();
        const items = get().items;

        items.forEach((item) => {
          const date = item.createdDate;
          if (!itemsByDate.has(date)) {
            itemsByDate.set(date, []);
          }
          itemsByDate.get(date)!.push(item);
        });

        return itemsByDate;
      },

      getScheduledItemsByDate: () => {
        const itemsByDate = new Map<string, Item[]>();
        const items = get().items;

        items.forEach((item) => {
          let dateKey: string | null = null;

          if (item.type === 'todo') {
            const todo = item as Todo;
            if (todo.scheduledTime) {
              dateKey = format(new Date(todo.scheduledTime), 'yyyy-MM-dd');
            }
          } else if (item.type === 'event') {
            const event = item as Event;
            dateKey = format(new Date(event.startTime), 'yyyy-MM-dd');
          }

          if (dateKey) {
            if (!itemsByDate.has(dateKey)) {
              itemsByDate.set(dateKey, []);
            }
            itemsByDate.get(dateKey)!.push(item);
          }
        });

        return itemsByDate;
      },

      getAllDatesWithItems: () => {
        const dates = new Set<string>();
        const items = get().items;

        // Get all created dates
        items.forEach((item) => {
          dates.add(item.createdDate);
        });

        // Get all scheduled dates
        items.forEach((item) => {
          if (item.type === 'todo') {
            const todo = item as Todo;
            if (todo.scheduledTime) {
              dates.add(format(new Date(todo.scheduledTime), 'yyyy-MM-dd'));
            }
          } else if (item.type === 'event') {
            const event = item as Event;
            dates.add(format(new Date(event.startTime), 'yyyy-MM-dd'));
          }
        });

        return Array.from(dates).sort();
      },
    }),
    {
      name: 'thoughts-time-storage',
    }
  )
);
