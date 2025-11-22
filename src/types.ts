// Export ItemType as both type and const for compatibility
export type ItemType = 'todo' | 'event' | 'routine' | 'note';
export const ItemTypes = ['todo', 'event', 'routine', 'note'] as const;

export interface BaseItem {
  id: string;
  userId: string;
  type: ItemType;
  content: string;
  createdAt: Date;
  createdDate: string; // YYYY-MM-DD
  updatedAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
}

export interface Todo extends BaseItem {
  type: 'todo';
  scheduledTime: Date | null; // null = unscheduled
  hasTime: boolean; // whether scheduledTime has a specific time or just date
  parentId: string | null; // for subtasks
  parentType: 'todo' | 'note' | 'event' | null;
  depthLevel: number; // 0 = top, 1 = sub, 2 = sub-sub
  children: string[]; // child IDs (notes, todos)
  embeddedItems: string[]; // note IDs
  completionLinkId: string | null;
}

export interface Event extends BaseItem {
  type: 'event';
  startTime: Date;
  endTime: Date;
  hasTime: boolean; // whether event has specific time or just date
  isAllDay: boolean;
  splitStartId: string | null;
  splitEndId: string | null;
  embeddedItems: string[];
  parentId: string | null; // can be sub-item of note
  parentType: 'note' | null;
  depthLevel: number; // 0 = top, 1 = sub, 2 = sub-sub
  children: string[]; // child IDs (notes, todos)
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // every X days/weeks/months
  daysOfWeek?: number[]; // [0-6] for weekly, 0=Sunday
  dayOfMonth?: number; // 1-31 for monthly, -1 for last day
  nthDayOfWeek?: number; // 1-5 for "first/second/third/fourth/fifth", -1 for "last"
  dayOfWeek?: number; // 0-6 for "second Tuesday", only used with nthDayOfWeek
}

export interface Routine extends BaseItem {
  type: 'routine';
  recurrencePattern: RecurrencePattern;
  scheduledTime: string | null; // HH:mm or null
  hasTime: boolean; // whether routine has specific time
  streak: number;
  lastCompleted: Date | null;
  embeddedItems: string[];
  parentId: string | null; // routines are always top-level
  parentType: null; // routines cannot be children
  depthLevel: number; // always 0 for routines
  children: string[]; // child IDs (notes only)
}

export interface Note extends BaseItem {
  type: 'note';
  linkPreviews: LinkPreview[];
  children: string[]; // child IDs (todos, notes, events)
  parentId: string | null; // can be sub-item of todo, note, event, or routine
  parentType: 'todo' | 'note' | 'event' | 'routine' | null;
  depthLevel: number; // 0 = top, 1 = sub, 2 = sub-sub (max 2 levels)
  orderIndex: number; // For ordering sub-items
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  domain: string;
}

export type Item = Todo | Event | Routine | Note;

export interface ParsedInput {
  type: ItemType;
  content: string;
  scheduledTime: Date | null;
  endTime?: Date | null;
  hasTime: boolean;
  recurrencePattern: RecurrencePattern | null;
  embeddedNotes: string[]; // IDs of notes to embed
  needsTimePrompt: boolean; // True if date exists but no specific time
}

export interface ParsedLine {
  type: ItemType;
  content: string;
  level: number; // 0 = top, 1 = child, 2 = grandchild
  scheduledTime: Date | null;
  endTime?: Date | null;
  hasTime: boolean;
  recurrencePattern: RecurrencePattern | null;
  embeddedNotes: string[];
  needsTimePrompt: boolean;
}

export interface MultiLineParseResult {
  lines: ParsedLine[];
  errors: string[];
}
