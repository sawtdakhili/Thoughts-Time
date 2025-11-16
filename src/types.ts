export type ItemType = 'todo' | 'event' | 'routine' | 'note';

export interface BaseItem {
  id: string;
  userId: string;
  type: ItemType;
  content: string;
  tags: string[];
  createdAt: Date;
  createdDate: string; // YYYY-MM-DD
  updatedAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
}

export interface Todo extends BaseItem {
  type: 'todo';
  scheduledTime: Date | null; // null = unscheduled
  deadline: Date | null;
  hasTime: boolean; // whether scheduledTime has a specific time or just date
  parentId: string | null; // for subtasks
  parentType: 'todo' | 'note' | null;
  depthLevel: number; // 0 = top, 1 = sub, 2 = sub-sub
  subtasks: string[]; // child IDs
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
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // every X days/weeks/months
  daysOfWeek?: number[]; // [0-6] for weekly, 0=Sunday
  dayOfMonth?: number; // 1-31 for monthly
}

export interface Routine extends BaseItem {
  type: 'routine';
  recurrencePattern: RecurrencePattern;
  scheduledTime: string | null; // HH:mm or null
  hasTime: boolean; // whether routine has specific time
  streak: number;
  lastCompleted: Date | null;
  embeddedItems: string[];
  parentId: string | null; // can be sub-item of note
  parentType: 'note' | null;
  depthLevel: number; // 0 = top, 1 = sub, 2 = sub-sub
}

export interface Note extends BaseItem {
  type: 'note';
  linkPreviews: LinkPreview[];
  subItems: string[]; // Can contain ANY item type (notes, todos, events, routines)
  parentId: string | null; // can be sub-item of another note
  parentType: 'note' | null;
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
  tags: string[];
  scheduledTime: Date | null;
  hasTime: boolean;
  deadline: Date | null;
  recurrencePattern: RecurrencePattern | null;
}
