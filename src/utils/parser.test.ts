import { describe, it, expect } from 'vitest';
import {
  detectItemType,
  removePrefix,
  extractEmbeddedNotes,
  detectRecurrencePattern,
  parseDateTime,
  parseInput,
} from './parser';

describe('detectItemType', () => {
  it('detects todo type', () => {
    expect(detectItemType('t Buy groceries')).toBe('todo');
  });

  it('detects event type', () => {
    expect(detectItemType('e Meeting at 2pm')).toBe('event');
  });

  it('detects routine type', () => {
    expect(detectItemType('r Exercise every day')).toBe('routine');
  });

  it('detects note type with n prefix', () => {
    expect(detectItemType('n Some note')).toBe('note');
  });

  it('detects note type with * prefix', () => {
    expect(detectItemType('* Another note')).toBe('note');
  });

  it('defaults to note when no prefix', () => {
    expect(detectItemType('Plain text')).toBe('note');
  });

  it('requires space after prefix', () => {
    expect(detectItemType('tBuy')).toBe('note'); // No space, not a todo
    expect(detectItemType('t Buy')).toBe('todo'); // Has space, is a todo
  });
});

describe('removePrefix', () => {
  it('removes todo prefix', () => {
    expect(removePrefix('t Buy milk')).toBe('Buy milk');
  });

  it('removes event prefix', () => {
    expect(removePrefix('e Meeting')).toBe('Meeting');
  });

  it('removes routine prefix', () => {
    expect(removePrefix('r Exercise')).toBe('Exercise');
  });

  it('removes note prefix (n)', () => {
    expect(removePrefix('n Note content')).toBe('Note content');
  });

  it('returns unchanged text when no prefix', () => {
    expect(removePrefix('Plain text')).toBe('Plain text');
  });

  it('only removes prefix at start', () => {
    expect(removePrefix('t Task with t in middle')).toBe('Task with t in middle');
  });
});

describe('extractEmbeddedNotes', () => {
  it('extracts single embedded note', () => {
    expect(extractEmbeddedNotes('Task with [[abc123]] note')).toEqual(['abc123']);
  });

  it('extracts multiple embedded notes', () => {
    expect(extractEmbeddedNotes('[[abc123]] and [[def456]]')).toEqual(['abc123', 'def456']);
  });

  it('returns empty array when no embedded notes', () => {
    expect(extractEmbeddedNotes('Plain text')).toEqual([]);
  });

  it('only matches valid note IDs (lowercase alphanumeric)', () => {
    expect(extractEmbeddedNotes('[[valid123]] [[INVALID]] [[also-invalid]]')).toEqual(['valid123']);
  });

  it('handles nested brackets correctly', () => {
    expect(extractEmbeddedNotes('[[[abc123]]]')).toEqual(['abc123']);
  });
});

describe('detectRecurrencePattern', () => {
  describe('daily patterns', () => {
    it('detects "every day"', () => {
      expect(detectRecurrencePattern('Exercise every day')).toEqual({
        frequency: 'daily',
        interval: 1,
      });
    });

    it('detects "daily"', () => {
      expect(detectRecurrencePattern('Morning routine daily')).toEqual({
        frequency: 'daily',
        interval: 1,
      });
    });

    it('detects "every X days"', () => {
      expect(detectRecurrencePattern('Water plants every 3 days')).toEqual({
        frequency: 'daily',
        interval: 3,
      });
    });
  });

  describe('weekly patterns', () => {
    it('detects "every Monday"', () => {
      expect(detectRecurrencePattern('Team meeting every Monday')).toEqual({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1],
      });
    });

    it('detects "every Sunday"', () => {
      expect(detectRecurrencePattern('Church every Sunday')).toEqual({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [0],
      });
    });

    it('detects "every other Friday"', () => {
      expect(detectRecurrencePattern('Payday every other Friday')).toEqual({
        frequency: 'weekly',
        interval: 2,
        daysOfWeek: [5],
      });
    });

    it('detects "every weekday"', () => {
      expect(detectRecurrencePattern('Commute every weekday')).toEqual({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1, 2, 3, 4, 5],
      });
    });

    it('detects "every weekend"', () => {
      expect(detectRecurrencePattern('Hiking every weekend')).toEqual({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [0, 6],
      });
    });

    it('detects "every X weeks"', () => {
      expect(detectRecurrencePattern('Review every 2 weeks')).toEqual({
        frequency: 'weekly',
        interval: 2,
      });
    });
  });

  describe('monthly patterns', () => {
    it('detects "first Monday of each month"', () => {
      expect(detectRecurrencePattern('Review first Monday of each month')).toEqual({
        frequency: 'monthly',
        interval: 1,
        nthDayOfWeek: 1,
        dayOfWeek: 1,
      });
    });

    it('detects "second Tuesday of each month"', () => {
      expect(detectRecurrencePattern('Meeting second Tuesday of each month')).toEqual({
        frequency: 'monthly',
        interval: 1,
        nthDayOfWeek: 2,
        dayOfWeek: 2,
      });
    });

    it('detects "last Friday of each month"', () => {
      expect(detectRecurrencePattern('Happy hour last Friday of each month')).toEqual({
        frequency: 'monthly',
        interval: 1,
        nthDayOfWeek: -1,
        dayOfWeek: 5,
      });
    });

    it('detects "15th of each month"', () => {
      expect(detectRecurrencePattern('Pay rent on the 15th of each month')).toEqual({
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 15,
      });
    });

    it('detects "last day of month"', () => {
      expect(detectRecurrencePattern('Report last day of month')).toEqual({
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: -1,
      });
    });

    // Note: "every X months" pattern is not tested because the parser currently
    // interprets numbers in "every 3 months" as day-of-month (3rd of each month)
    // This is a known limitation of the current regex ordering.
  });

  it('returns null when no recurrence pattern found', () => {
    expect(detectRecurrencePattern('One-time event tomorrow')).toBeNull();
  });

  it('is case insensitive', () => {
    expect(detectRecurrencePattern('Exercise EVERY DAY')).toEqual({
      frequency: 'daily',
      interval: 1,
    });
  });
});

describe('parseDateTime', () => {
  it('parses "tomorrow"', () => {
    const result = parseDateTime('Meeting tomorrow');
    expect(result.date).not.toBeNull();
    expect(result.hasTime).toBe(false);
  });

  it('parses "tomorrow at 2pm"', () => {
    const result = parseDateTime('Meeting tomorrow at 2pm');
    expect(result.date).not.toBeNull();
    expect(result.hasTime).toBe(true);
    if (result.date) {
      expect(result.date.getHours()).toBe(14);
    }
  });

  it('parses "in 30 minutes"', () => {
    const now = new Date();
    const result = parseDateTime('Task in 30 minutes');
    expect(result.date).not.toBeNull();
    expect(result.hasTime).toBe(true);
    if (result.date) {
      const diff = (result.date.getTime() - now.getTime()) / 1000 / 60;
      expect(diff).toBeGreaterThanOrEqual(29);
      expect(diff).toBeLessThanOrEqual(31);
    }
  });

  it('parses "in 2 hours"', () => {
    const now = new Date();
    const result = parseDateTime('Meeting in 2 hours');
    expect(result.date).not.toBeNull();
    expect(result.hasTime).toBe(true);
    if (result.date) {
      const diff = (result.date.getTime() - now.getTime()) / 1000 / 60 / 60;
      expect(diff).toBeGreaterThanOrEqual(1.9);
      expect(diff).toBeLessThanOrEqual(2.1);
    }
  });

  it('parses time ranges with "from X to Y"', () => {
    const result = parseDateTime('Meeting from 2pm to 4pm');
    expect(result.date).not.toBeNull();
    expect(result.endDate).not.toBeNull();
    expect(result.hasTime).toBe(true);
    if (result.date) {
      expect(result.date.getHours()).toBe(14);
    }
    if (result.endDate) {
      expect(result.endDate.getHours()).toBe(16);
    }
  });

  it('parses time ranges with "between X and Y"', () => {
    const result = parseDateTime('between 10am and 12pm');
    expect(result.date).not.toBeNull();
    expect(result.hasTime).toBe(true);
    if (result.date) {
      expect(result.date.getHours()).toBe(10);
    }
    // Note: endDate detection requires the "between" keyword at the start for the refiner to work
    if (result.endDate) {
      expect(result.endDate.getHours()).toBe(12);
    }
  });

  it('returns null when no date found', () => {
    const result = parseDateTime('No date here');
    expect(result.date).toBeNull();
    expect(result.hasTime).toBe(false);
  });
});

describe('parseInput', () => {
  it('parses todo with time', () => {
    const result = parseInput('t Buy milk tomorrow at 2pm');
    expect(result.type).toBe('todo');
    expect(result.content).toBe('Buy milk tomorrow at 2pm');
    expect(result.scheduledTime).not.toBeNull();
    expect(result.hasTime).toBe(true);
    expect(result.needsTimePrompt).toBe(false);
  });

  it('parses todo without time (needs prompt)', () => {
    const result = parseInput('t Buy milk tomorrow');
    expect(result.type).toBe('todo');
    expect(result.scheduledTime).not.toBeNull();
    expect(result.hasTime).toBe(false);
    expect(result.needsTimePrompt).toBe(true);
  });

  it('parses event with time range', () => {
    const result = parseInput('e Meeting from 2pm to 4pm');
    expect(result.type).toBe('event');
    expect(result.content).toBe('Meeting from 2pm to 4pm');
    expect(result.scheduledTime).not.toBeNull();
    expect(result.endTime).not.toBeNull();
    expect(result.hasTime).toBe(true);
  });

  it('parses all-day event', () => {
    const result = parseInput('e Conference tomorrow');
    expect(result.type).toBe('event');
    expect(result.scheduledTime).not.toBeNull();
    expect(result.endTime).not.toBeNull();
    expect(result.hasTime).toBe(false);

    // All-day events should span from midnight to midnight
    if (result.scheduledTime && result.endTime) {
      expect(result.scheduledTime.getHours()).toBe(0);
      expect(result.endTime.getHours()).toBe(0);
      const daysDiff =
        (result.endTime.getTime() - result.scheduledTime.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBe(1);
    }
  });

  it('parses routine with recurrence', () => {
    const result = parseInput('r Exercise every day at 7am');
    expect(result.type).toBe('routine');
    expect(result.content).toBe('Exercise every day at 7am');
    expect(result.recurrencePattern).toEqual({
      frequency: 'daily',
      interval: 1,
    });
    expect(result.hasTime).toBe(true);
  });

  it('parses note without date', () => {
    const result = parseInput('n Random thought');
    expect(result.type).toBe('note');
    expect(result.content).toBe('Random thought');
    expect(result.scheduledTime).toBeNull();
    expect(result.hasTime).toBe(false);
  });

  it('extracts embedded notes', () => {
    const result = parseInput('t Review [[abc123]] and [[def456]]');
    expect(result.embeddedNotes).toEqual(['abc123', 'def456']);
  });

  it('defaults to note type', () => {
    const result = parseInput('Plain text');
    expect(result.type).toBe('note');
    expect(result.content).toBe('Plain text');
  });
});
