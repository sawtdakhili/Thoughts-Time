import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import { Item, Todo, Event, Routine, Note } from '../types';
import { parseInput, hasExplicitNotePrefix } from '../utils/parser';

interface AppState {
  // Data
  items: Item[];

  // Actions
  addItem: (input: string, parentId?: string | null, depthLevel?: number) => string;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  toggleTodoComplete: (id: string) => void;

  // Computed - get items grouped by date
  getItemsByDate: () => Map<string, Item[]>;
  getScheduledItemsByDate: () => Map<string, Item[]>;
  getAllDatesWithItems: () => string[];
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (input: string, parentId: string | null = null, depthLevel: number = 0) => {
        const parsed = parseInput(input);
        const now = new Date();
        const createdDate = format(now, 'yyyy-MM-dd');

        const newId = generateId();

        // Get parent item if exists
        const parentItem = parentId ? get().items.find(i => i.id === parentId) : null;
        const parentType = parentItem?.type as 'todo' | 'note' | null;

        // VALIDATION: Depth constraints
        if (parentType === 'todo' && depthLevel > 1) {
          console.error('Todo subtasks: maximum depth is 1 level');
          throw new Error('Todo subtasks: maximum depth is 1 level');
        }
        if (parentType === 'note' && depthLevel > 2) {
          console.error('Note sub-items: maximum depth is 2 levels');
          throw new Error('Note sub-items: maximum depth is 2 levels');
        }

        // RULE: If parent is todo, child defaults to todo UNLESS explicit note prefix (* or n)
        // RULE: If parent is note, child can be ANY type (via prefix: * t e r)
        let itemType = parsed.type;
        if (parentType === 'todo') {
          // Check if user explicitly wanted a note (used * or n prefix)
          const explicitNote = hasExplicitNotePrefix(input);

          if (parsed.type !== 'todo' && parsed.type !== 'note') {
            console.error('Todo subtasks can only be todos or notes');
            throw new Error('Todo subtasks can only be todos or notes');
          }

          // If explicit note prefix, keep as note; otherwise default to todo
          if (explicitNote) {
            itemType = 'note';
          } else {
            itemType = 'todo';
          }
        }
        // For notes: itemType remains as parsed.type (any type allowed via prefix)

        const baseItem = {
          id: newId,
          userId: 'user-1',
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
              subtasks: [],
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
              parentId,
              parentType,
              depthLevel,
            } as Routine;
            break;

          case 'note':
          default:
            newItem = {
              ...baseItem,
              type: 'note',
              linkPreviews: [],
              subItems: [],
              parentId,
              parentType,
              depthLevel,
              orderIndex: 0,
            } as Note;
            break;
        }

        // Update parent item to include this sub-item
        if (parentId) {
          set((state) => ({
            items: [
              ...state.items.map(item => {
                if (item.id === parentId) {
                  if (item.type === 'note') {
                    return { ...item, subItems: [...item.subItems, newId] };
                  } else if (item.type === 'todo') {
                    return { ...item, subtasks: [...item.subtasks, newId] };
                  }
                }
                return item;
              }),
              newItem
            ],
          }));
        } else {
          set((state) => ({
            items: [...state.items, newItem],
          }));
        }

        return newId;
      },

      updateItem: (id: string, updates: Partial<Item>) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date() } as Item : item
          ),
        }));
      },

      deleteItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      toggleTodoComplete: (id: string) => {
        set((state) => {
          const todo = state.items.find(i => i.id === id && i.type === 'todo') as Todo | undefined;
          if (!todo) return state;

          const isCompleting = !todo.completedAt; // Will be marked complete
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
