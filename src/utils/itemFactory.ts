import { format } from 'date-fns';
import { Item, Todo, Event, Routine, Note, ParsedInput } from '../types';

/**
 * Factory functions for creating properly typed Item objects
 */

interface CreateItemParams {
  content: string;
  createdAt: Date;
  createdDate: string;
  parsed: ParsedInput;
  userId?: string;
}

export function createTodoItem(params: CreateItemParams): Todo {
  const { content, createdAt, createdDate, parsed, userId = 'user-1' } = params;

  return {
    id: '', // Will be set by caller
    userId,
    type: 'todo',
    content,
    createdAt,
    createdDate,
    updatedAt: createdAt,
    completedAt: null,
    cancelledAt: null,
    scheduledTime: parsed.scheduledTime,
    hasTime: parsed.hasTime,
    parentId: null,
    parentType: null,
    depthLevel: 0,
    subtasks: [],
    embeddedItems: parsed.embeddedNotes,
    completionLinkId: null,
  };
}

export function createEventItem(params: CreateItemParams): Event {
  const { content, createdAt, createdDate, parsed, userId = 'user-1' } = params;

  return {
    id: '', // Will be set by caller
    userId,
    type: 'event',
    content,
    createdAt,
    createdDate,
    updatedAt: createdAt,
    completedAt: null,
    cancelledAt: null,
    startTime: parsed.scheduledTime || createdAt,
    endTime: parsed.endTime || parsed.scheduledTime || createdAt,
    hasTime: parsed.hasTime,
    isAllDay: !parsed.hasTime,
    splitStartId: null,
    splitEndId: null,
    embeddedItems: parsed.embeddedNotes,
    parentId: null,
    parentType: null,
    depthLevel: 0,
  };
}

export function createRoutineItem(params: CreateItemParams): Routine {
  const { content, createdAt, createdDate, parsed, userId = 'user-1' } = params;

  return {
    id: '', // Will be set by caller
    userId,
    type: 'routine',
    content,
    createdAt,
    createdDate,
    updatedAt: createdAt,
    completedAt: null,
    cancelledAt: null,
    recurrencePattern: parsed.recurrencePattern || { frequency: 'daily', interval: 1 },
    scheduledTime: parsed.scheduledTime ? format(parsed.scheduledTime, 'HH:mm') : null,
    hasTime: parsed.hasTime,
    streak: 0,
    lastCompleted: null,
    embeddedItems: parsed.embeddedNotes,
    parentId: null,
    parentType: null,
    depthLevel: 0,
  };
}

export function createNoteItem(params: CreateItemParams): Note {
  const { content, createdAt, createdDate, userId = 'user-1' } = params;

  return {
    id: '', // Will be set by caller
    userId,
    type: 'note',
    content,
    createdAt,
    createdDate,
    updatedAt: createdAt,
    completedAt: null,
    cancelledAt: null,
    linkPreviews: [],
    subItems: [],
    parentId: null,
    parentType: null,
    depthLevel: 0,
    orderIndex: 0,
  };
}

/**
 * Create an item of any type based on ParsedInput
 */
export function createItem(params: CreateItemParams): Item {
  const { parsed } = params;

  switch (parsed.type) {
    case 'todo':
      return createTodoItem(params);
    case 'event':
      return createEventItem(params);
    case 'routine':
      return createRoutineItem(params);
    case 'note':
      return createNoteItem(params);
    default:
      throw new Error(`Unknown item type: ${(parsed as any).type}`);
  }
}
