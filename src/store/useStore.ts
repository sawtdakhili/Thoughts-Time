import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import { Item, Todo, Event, Routine, Note } from '../types';
import { parseInput } from '../utils/parser';

interface AppState {
  // Data
  items: Item[];
  currentDate: Date;

  // Actions
  addItem: (input: string) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  toggleTodoComplete: (id: string) => void;
  setCurrentDate: (date: Date) => void;

  // Computed
  getItemsForDate: (date: string) => Item[];
  getScheduledItemsForDate: (date: string) => Item[];
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      items: [],
      currentDate: new Date(),

      addItem: (input: string) => {
        const parsed = parseInput(input);
        const now = new Date();
        const createdDate = format(now, 'yyyy-MM-dd');

        const baseItem = {
          id: generateId(),
          userId: 'user-1', // For MVP, single user
          content: parsed.content,
          tags: parsed.tags,
          createdAt: now,
          createdDate,
          updatedAt: now,
          completedAt: null,
          cancelledAt: null,
        };

        let newItem: Item;

        switch (parsed.type) {
          case 'todo':
            newItem = {
              ...baseItem,
              type: 'todo',
              scheduledTime: parsed.scheduledTime,
              deadline: parsed.deadline,
              hasTime: parsed.hasTime,
              parentId: null,
              parentType: null,
              depthLevel: 0,
              subtasks: [],
              embeddedItems: [],
              completionLinkId: null,
            } as Todo;
            break;

          case 'event':
            newItem = {
              ...baseItem,
              type: 'event',
              startTime: parsed.scheduledTime || now,
              endTime: parsed.scheduledTime || now,
              hasTime: parsed.hasTime,
              isAllDay: !parsed.hasTime,
              splitStartId: null,
              splitEndId: null,
              embeddedItems: [],
              parentId: null,
              parentType: null,
              depthLevel: 0,
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
              embeddedItems: [],
              parentId: null,
              parentType: null,
              depthLevel: 0,
            } as Routine;
            break;

          case 'note':
          default:
            newItem = {
              ...baseItem,
              type: 'note',
              linkPreviews: [],
              subItems: [],
              parentId: null,
              parentType: null,
              depthLevel: 0,
              orderIndex: 0,
            } as Note;
            break;
        }

        set((state) => ({
          items: [...state.items, newItem],
        }));
      },

      updateItem: (id: string, updates: Partial<Item>) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
          ),
        }));
      },

      deleteItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      toggleTodoComplete: (id: string) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === id && item.type === 'todo') {
              const todo = item as Todo;
              return {
                ...todo,
                completedAt: todo.completedAt ? null : new Date(),
                updatedAt: new Date(),
              };
            }
            return item;
          }),
        }));
      },

      setCurrentDate: (date: Date) => {
        set({ currentDate: date });
      },

      getItemsForDate: (date: string) => {
        return get().items.filter((item) => item.createdDate === date);
      },

      getScheduledItemsForDate: (date: string) => {
        return get().items.filter((item) => {
          if (item.type === 'todo') {
            const todo = item as Todo;
            if (todo.scheduledTime) {
              return format(new Date(todo.scheduledTime), 'yyyy-MM-dd') === date;
            }
          }
          if (item.type === 'event') {
            const event = item as Event;
            return format(new Date(event.startTime), 'yyyy-MM-dd') === date;
          }
          if (item.type === 'routine') {
            // For MVP, just check if routine has a time for today
            // Full implementation would generate occurrences
            return false;
          }
          return false;
        });
      },
    }),
    {
      name: 'thoughts-time-storage',
    }
  )
);
