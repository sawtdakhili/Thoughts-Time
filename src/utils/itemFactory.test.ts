import { describe, it, expect } from 'vitest';
import {
  createTodoItem,
  createEventItem,
  createRoutineItem,
  createNoteItem,
  createItem,
} from './itemFactory';
import { ParsedInput } from '../types';

describe('createTodoItem', () => {
  it('creates a valid todo item', () => {
    const createdAt = new Date('2025-11-19T10:00:00');
    const scheduledTime = new Date('2025-11-20T14:00:00');
    const parsed: ParsedInput = {
      type: 'todo',
      content: 'Buy groceries',
      scheduledTime,
      endTime: null,
      hasTime: true,
      recurrencePattern: null,
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const todo = createTodoItem({
      content: 'Buy groceries',
      createdAt,
      createdDate: '2025-11-19',
      parsed,
    });

    expect(todo.type).toBe('todo');
    expect(todo.content).toBe('Buy groceries');
    expect(todo.createdAt).toBe(createdAt);
    expect(todo.createdDate).toBe('2025-11-19');
    expect(todo.scheduledTime).toBe(scheduledTime);
    expect(todo.hasTime).toBe(true);
    expect(todo.completedAt).toBeNull();
    expect(todo.children).toEqual([]);
    expect(todo.userId).toBe('user-1');
  });

  it('creates todo with embedded notes', () => {
    const parsed: ParsedInput = {
      type: 'todo',
      content: 'Review [[abc123]]',
      scheduledTime: null,
      endTime: null,
      hasTime: false,
      recurrencePattern: null,
      embeddedNotes: ['abc123'],
      needsTimePrompt: false,
    };

    const todo = createTodoItem({
      content: 'Review [[abc123]]',
      createdAt: new Date(),
      createdDate: '2025-11-19',
      parsed,
    });

    expect(todo.embeddedItems).toEqual(['abc123']);
  });

  it('accepts custom userId', () => {
    const parsed: ParsedInput = {
      type: 'todo',
      content: 'Task',
      scheduledTime: null,
      endTime: null,
      hasTime: false,
      recurrencePattern: null,
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const todo = createTodoItem({
      content: 'Task',
      createdAt: new Date(),
      createdDate: '2025-11-19',
      parsed,
      userId: 'custom-user',
    });

    expect(todo.userId).toBe('custom-user');
  });
});

describe('createEventItem', () => {
  it('creates a valid event item with time range', () => {
    const createdAt = new Date('2025-11-19T10:00:00');
    const startTime = new Date('2025-11-20T14:00:00');
    const endTime = new Date('2025-11-20T16:00:00');
    const parsed: ParsedInput = {
      type: 'event',
      content: 'Meeting from 2pm to 4pm',
      scheduledTime: startTime,
      endTime,
      hasTime: true,
      recurrencePattern: null,
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const event = createEventItem({
      content: 'Meeting from 2pm to 4pm',
      createdAt,
      createdDate: '2025-11-19',
      parsed,
    });

    expect(event.type).toBe('event');
    expect(event.startTime).toBe(startTime);
    expect(event.endTime).toBe(endTime);
    expect(event.hasTime).toBe(true);
    expect(event.isAllDay).toBe(false);
  });

  it('creates all-day event', () => {
    const createdAt = new Date('2025-11-19T10:00:00');
    const parsed: ParsedInput = {
      type: 'event',
      content: 'Conference',
      scheduledTime: null,
      endTime: null,
      hasTime: false,
      recurrencePattern: null,
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const event = createEventItem({
      content: 'Conference',
      createdAt,
      createdDate: '2025-11-19',
      parsed,
    });

    expect(event.hasTime).toBe(false);
    expect(event.isAllDay).toBe(true);
    expect(event.startTime).toBe(createdAt);
    expect(event.endTime).toBe(createdAt);
  });

  it('defaults endTime to startTime if not provided', () => {
    const createdAt = new Date('2025-11-19T10:00:00');
    const startTime = new Date('2025-11-20T14:00:00');
    const parsed: ParsedInput = {
      type: 'event',
      content: 'Event',
      scheduledTime: startTime,
      endTime: null,
      hasTime: true,
      recurrencePattern: null,
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const event = createEventItem({
      content: 'Event',
      createdAt,
      createdDate: '2025-11-19',
      parsed,
    });

    expect(event.startTime).toBe(startTime);
    expect(event.endTime).toBe(startTime);
  });
});

describe('createRoutineItem', () => {
  it('creates a valid routine item', () => {
    const createdAt = new Date('2025-11-19T10:00:00');
    const scheduledTime = new Date('2025-11-20T07:00:00');
    const parsed: ParsedInput = {
      type: 'routine',
      content: 'Exercise every day at 7am',
      scheduledTime,
      endTime: null,
      hasTime: true,
      recurrencePattern: { frequency: 'daily', interval: 1 },
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const routine = createRoutineItem({
      content: 'Exercise every day at 7am',
      createdAt,
      createdDate: '2025-11-19',
      parsed,
    });

    expect(routine.type).toBe('routine');
    expect(routine.recurrencePattern).toEqual({ frequency: 'daily', interval: 1 });
    expect(routine.scheduledTime).toBe('07:00');
    expect(routine.hasTime).toBe(true);
    expect(routine.streak).toBe(0);
    expect(routine.lastCompleted).toBeNull();
  });

  it('defaults to daily recurrence when not specified', () => {
    const parsed: ParsedInput = {
      type: 'routine',
      content: 'Morning routine',
      scheduledTime: null,
      endTime: null,
      hasTime: false,
      recurrencePattern: null,
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const routine = createRoutineItem({
      content: 'Morning routine',
      createdAt: new Date(),
      createdDate: '2025-11-19',
      parsed,
    });

    expect(routine.recurrencePattern).toEqual({ frequency: 'daily', interval: 1 });
  });

  it('handles routine without time', () => {
    const parsed: ParsedInput = {
      type: 'routine',
      content: 'Daily review',
      scheduledTime: null,
      endTime: null,
      hasTime: false,
      recurrencePattern: { frequency: 'daily', interval: 1 },
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const routine = createRoutineItem({
      content: 'Daily review',
      createdAt: new Date(),
      createdDate: '2025-11-19',
      parsed,
    });

    expect(routine.scheduledTime).toBeNull();
    expect(routine.hasTime).toBe(false);
  });
});

describe('createNoteItem', () => {
  it('creates a valid note item', () => {
    const createdAt = new Date('2025-11-19T10:00:00');
    const parsed: ParsedInput = {
      type: 'note',
      content: 'Random thought',
      scheduledTime: null,
      endTime: null,
      hasTime: false,
      recurrencePattern: null,
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const note = createNoteItem({
      content: 'Random thought',
      createdAt,
      createdDate: '2025-11-19',
      parsed,
    });

    expect(note.type).toBe('note');
    expect(note.content).toBe('Random thought');
    expect(note.linkPreviews).toEqual([]);
    expect(note.children).toEqual([]);
    expect(note.orderIndex).toBe(0);
  });

  it('initializes with empty arrays', () => {
    const parsed: ParsedInput = {
      type: 'note',
      content: 'Note',
      scheduledTime: null,
      endTime: null,
      hasTime: false,
      recurrencePattern: null,
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const note = createNoteItem({
      content: 'Note',
      createdAt: new Date(),
      createdDate: '2025-11-19',
      parsed,
    });

    expect(note.linkPreviews).toEqual([]);
    expect(note.children).toEqual([]);
  });
});

describe('createItem', () => {
  it('creates todo when type is todo', () => {
    const parsed: ParsedInput = {
      type: 'todo',
      content: 'Task',
      scheduledTime: null,
      endTime: null,
      hasTime: false,
      recurrencePattern: null,
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const item = createItem({
      content: 'Task',
      createdAt: new Date(),
      createdDate: '2025-11-19',
      parsed,
    });

    expect(item.type).toBe('todo');
  });

  it('creates event when type is event', () => {
    const parsed: ParsedInput = {
      type: 'event',
      content: 'Meeting',
      scheduledTime: null,
      endTime: null,
      hasTime: false,
      recurrencePattern: null,
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const item = createItem({
      content: 'Meeting',
      createdAt: new Date(),
      createdDate: '2025-11-19',
      parsed,
    });

    expect(item.type).toBe('event');
  });

  it('creates routine when type is routine', () => {
    const parsed: ParsedInput = {
      type: 'routine',
      content: 'Exercise',
      scheduledTime: null,
      endTime: null,
      hasTime: false,
      recurrencePattern: { frequency: 'daily', interval: 1 },
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const item = createItem({
      content: 'Exercise',
      createdAt: new Date(),
      createdDate: '2025-11-19',
      parsed,
    });

    expect(item.type).toBe('routine');
  });

  it('creates note when type is note', () => {
    const parsed: ParsedInput = {
      type: 'note',
      content: 'Thought',
      scheduledTime: null,
      endTime: null,
      hasTime: false,
      recurrencePattern: null,
      embeddedNotes: [],
      needsTimePrompt: false,
    };

    const item = createItem({
      content: 'Thought',
      createdAt: new Date(),
      createdDate: '2025-11-19',
      parsed,
    });

    expect(item.type).toBe('note');
  });
});
