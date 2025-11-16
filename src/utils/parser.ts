import * as chrono from 'chrono-node';
import { format } from 'date-fns';
import { ItemType, ParsedInput, RecurrencePattern } from '../types';

/**
 * Detect item type from prefix
 * CRITICAL: Prefix MUST include space (e.g., "t " not "t")
 */
export function detectItemType(input: string): ItemType {
  if (input.startsWith('t ')) return 'todo';
  if (input.startsWith('e ')) return 'event';
  if (input.startsWith('r ')) return 'routine';
  if (input.startsWith('n ')) return 'note';
  return 'note'; // Default to note
}

/**
 * Remove prefix from content
 */
export function removePrefix(input: string): string {
  const prefixes = ['t ', 'e ', 'r ', 'n '];
  for (const prefix of prefixes) {
    if (input.startsWith(prefix)) {
      return input.slice(2);
    }
  }
  return input;
}

/**
 * Extract tags from content
 * Pattern: # followed by alphanumeric characters
 */
export function extractTags(content: string): string[] {
  const tagPattern = /#(\w+)/g;
  const matches = content.matchAll(tagPattern);
  return Array.from(matches, (m) => m[1]);
}

/**
 * Detect recurrence pattern from text
 * Supports: "every day", "every Monday", "every other Friday", "second Tuesday of each month"
 */
export function detectRecurrencePattern(content: string): RecurrencePattern | null {
  const lowerContent = content.toLowerCase();

  // Daily patterns
  if (lowerContent.includes('every day') || lowerContent.includes('daily')) {
    return { frequency: 'daily', interval: 1 };
  }

  // Every X days
  const everyXDaysMatch = lowerContent.match(/every (\d+) days?/);
  if (everyXDaysMatch) {
    return { frequency: 'daily', interval: parseInt(everyXDaysMatch[1]) };
  }

  // Weekly patterns
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    if (lowerContent.includes(`every ${dayNames[i]}`)) {
      return { frequency: 'weekly', interval: 1, daysOfWeek: [i] };
    }
  }

  // Every other week pattern
  if (lowerContent.includes('every other')) {
    for (let i = 0; i < dayNames.length; i++) {
      if (lowerContent.includes(dayNames[i])) {
        return { frequency: 'weekly', interval: 2, daysOfWeek: [i] };
      }
    }
  }

  // Weekdays
  if (lowerContent.includes('weekday') || lowerContent.includes('every weekday')) {
    return { frequency: 'weekly', interval: 1, daysOfWeek: [1, 2, 3, 4, 5] };
  }

  // Monthly patterns - "second Tuesday of each month"
  const ordinals = ['first', 'second', 'third', 'fourth', 'last'];
  for (const ordinal of ordinals) {
    for (let i = 0; i < dayNames.length; i++) {
      if (lowerContent.includes(`${ordinal} ${dayNames[i]}`)) {
        // For MVP, we'll store this as monthly with a note
        // Full implementation would need more complex logic
        return { frequency: 'monthly', interval: 1, dayOfMonth: 1 };
      }
    }
  }

  // Last day of month
  if (lowerContent.includes('last day of') && lowerContent.includes('month')) {
    return { frequency: 'monthly', interval: 1, dayOfMonth: -1 };
  }

  return null;
}

/**
 * Parse natural language date/time using Chrono
 */
export function parseDateTime(content: string): { date: Date | null; hasTime: boolean; refText: string } {
  const results = chrono.parse(content);

  if (results.length === 0) {
    return { date: null, hasTime: false, refText: '' };
  }

  const result = results[0];
  const date = result.start.date();

  // Check if time component was specified
  const hasTime = result.start.isCertain('hour') && result.start.isCertain('minute');

  return {
    date,
    hasTime,
    refText: result.text,
  };
}

/**
 * Detect deadline keywords (by, due, deadline)
 */
export function parseDeadline(content: string): Date | null {
  const lowerContent = content.toLowerCase();

  // Check for deadline keywords
  if (!lowerContent.includes('by ') && !lowerContent.includes('due ') && !lowerContent.includes('deadline ')) {
    return null;
  }

  // Use Chrono to parse the date after the keyword
  const byMatch = content.match(/by\s+(.+?)(?:\.|$|#)/i);
  const dueMatch = content.match(/due\s+(.+?)(?:\.|$|#)/i);
  const deadlineMatch = content.match(/deadline\s+(.+?)(?:\.|$|#)/i);

  const matchText = byMatch?.[1] || dueMatch?.[1] || deadlineMatch?.[1];

  if (matchText) {
    const results = chrono.parse(matchText);
    if (results.length > 0) {
      return results[0].start.date();
    }
  }

  return null;
}

/**
 * Main parsing function
 */
export function parseInput(input: string): ParsedInput {
  const type = detectItemType(input);
  const content = removePrefix(input);
  const tags = extractTags(content);

  let scheduledTime: Date | null = null;
  let hasTime = false;
  let deadline: Date | null = null;
  let recurrencePattern: RecurrencePattern | null = null;

  // Parse based on type
  if (type === 'event' || type === 'todo') {
    const parsed = parseDateTime(content);
    scheduledTime = parsed.date;
    hasTime = parsed.hasTime;

    // For todos, also check for deadline
    if (type === 'todo') {
      deadline = parseDeadline(content);
      // If deadline but no scheduled time, deadline takes precedence
      if (deadline && !scheduledTime) {
        scheduledTime = deadline;
        hasTime = false;
      }
    }
  }

  if (type === 'routine') {
    recurrencePattern = detectRecurrencePattern(content);
    const parsed = parseDateTime(content);
    scheduledTime = parsed.date;
    hasTime = parsed.hasTime;
  }

  return {
    type,
    content,
    tags,
    scheduledTime,
    hasTime,
    deadline,
    recurrencePattern,
  };
}
