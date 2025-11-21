import * as chrono from 'chrono-node';
import { addMinutes, addHours } from 'date-fns';
import { ItemType, ParsedInput, RecurrencePattern } from '../types';

// Create custom Chrono instance with enhanced parsing
const customChrono = chrono.casual.clone();

// Custom refiner for "in X hours/minutes" patterns
customChrono.refiners.push({
  refine: (context, results) => {
    results.forEach((result) => {
      const text = context.text.substring(result.index);

      // Handle "in X minutes" or "in X hours"
      const inTimeMatch = text.match(/^in\s+(\d+)\s+(minute|minutes|hour|hours|min|mins|hr|hrs)/i);
      if (inTimeMatch) {
        const amount = parseInt(inTimeMatch[1]);
        const unit = inTimeMatch[2].toLowerCase();
        const now = context.refDate || new Date();

        let targetDate = now;
        if (unit.startsWith('hour') || unit.startsWith('hr')) {
          targetDate = addHours(now, amount);
        } else if (unit.startsWith('min')) {
          targetDate = addMinutes(now, amount);
        }

        result.start.assign('hour', targetDate.getHours());
        result.start.assign('minute', targetDate.getMinutes());
        result.start.assign('day', targetDate.getDate());
        result.start.assign('month', targetDate.getMonth() + 1);
        result.start.assign('year', targetDate.getFullYear());
      }
    });

    return results;
  }
});

// Add patterns for "in X minutes/hours" that Chrono might miss
customChrono.parsers.push({
  pattern: () => /\bin\s+(\d+)\s+(minute|minutes|hour|hours|min|mins|hr|hrs)\b/i,
  extract: (context, match) => {
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const now = context.refDate || new Date();

    let targetDate = now;
    if (unit.startsWith('hour') || unit.startsWith('hr')) {
      targetDate = addHours(now, amount);
    } else if (unit.startsWith('min')) {
      targetDate = addMinutes(now, amount);
    }

    return {
      year: targetDate.getFullYear(),
      month: targetDate.getMonth() + 1,
      day: targetDate.getDate(),
      hour: targetDate.getHours(),
      minute: targetDate.getMinutes(),
    };
  }
});

// Add refiner for 24-hour time format like "at 13:55" or "at 09:30"
// This runs after parsing and marks hour/minute as certain
customChrono.refiners.push({
  refine: (context, results) => {
    // Check if the text contains "at HH:MM" pattern
    const timeMatch = context.text.match(/\bat\s+(\d{1,2}):(\d{2})\b/i);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2]);

      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        // If no results yet, create one
        if (results.length === 0) {
          const now = context.refDate || new Date();
          const result = new chrono.ParsingResult(
            context.refDate,
            timeMatch.index!,
            timeMatch[0]
          );
          result.start.assign('year', now.getFullYear());
          result.start.assign('month', now.getMonth() + 1);
          result.start.assign('day', now.getDate());
          result.start.assign('hour', hour);
          result.start.assign('minute', minute);
          results.push(result);
        } else {
          // Update existing result to mark time as certain
          results.forEach((result) => {
            result.start.assign('hour', hour);
            result.start.assign('minute', minute);
          });
        }
      }
    }
    return results;
  }
});

// Custom refiner for "between X and Y" to properly parse both start and end times
customChrono.refiners.push({
  refine: (context, results) => {
    results.forEach((result) => {
      const text = context.text.substring(result.index);
      const betweenMatch = text.match(/^between\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+and\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);

      if (betweenMatch) {
        const startHour = parseInt(betweenMatch[1]);
        const startMin = betweenMatch[2] ? parseInt(betweenMatch[2]) : 0;
        const startMeridiem = betweenMatch[3] || betweenMatch[6];
        const endHour = parseInt(betweenMatch[4]);
        const endMin = betweenMatch[5] ? parseInt(betweenMatch[5]) : 0;
        const endMeridiem = betweenMatch[6];

        // Adjust start hour
        let adjustedStartHour = startHour;
        if (startMeridiem && startMeridiem.toLowerCase() === 'pm' && startHour !== 12) {
          adjustedStartHour += 12;
        } else if (startMeridiem && startMeridiem.toLowerCase() === 'am' && startHour === 12) {
          adjustedStartHour = 0;
        }

        // Adjust end hour
        let adjustedEndHour = endHour;
        if (endMeridiem.toLowerCase() === 'pm' && endHour !== 12) {
          adjustedEndHour += 12;
        } else if (endMeridiem.toLowerCase() === 'am' && endHour === 12) {
          adjustedEndHour = 0;
        }

        // Fix common mistake: "10 to 12am" probably means "10am to 12pm" (noon)
        // If end time is before start time, assume they meant PM for the end
        if (adjustedEndHour < adjustedStartHour || (adjustedEndHour === adjustedStartHour && endMin <= startMin)) {
          if (endHour === 12 && endMeridiem.toLowerCase() === 'am') {
            // They probably meant 12pm (noon), not 12am (midnight)
            adjustedEndHour = 12;
          } else {
            // Add 12 hours to make it PM
            adjustedEndHour += 12;
          }
        }

        // Update start time
        result.start.assign('hour', adjustedStartHour);
        result.start.assign('minute', startMin);

        // Create or update end time
        if (!result.end) {
          result.end = result.start.clone();
        }

        if (result.end) {
          result.end.assign('hour', adjustedEndHour);
          result.end.assign('minute', endMin);
        }
      }
    });

    return results;
  }
});

// Custom refiner for "from X to Y" pattern (same as "between X and Y")
customChrono.refiners.push({
  refine: (context, results) => {
    results.forEach((result) => {
      const text = context.text.substring(result.index);
      const fromMatch = text.match(/^from\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+to\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);

      if (fromMatch) {
        const startHour = parseInt(fromMatch[1]);
        const startMin = fromMatch[2] ? parseInt(fromMatch[2]) : 0;
        const startMeridiem = fromMatch[3] || fromMatch[6];
        const endHour = parseInt(fromMatch[4]);
        const endMin = fromMatch[5] ? parseInt(fromMatch[5]) : 0;
        const endMeridiem = fromMatch[6];

        // Adjust start hour
        let adjustedStartHour = startHour;
        if (startMeridiem && startMeridiem.toLowerCase() === 'pm' && startHour !== 12) {
          adjustedStartHour += 12;
        } else if (startMeridiem && startMeridiem.toLowerCase() === 'am' && startHour === 12) {
          adjustedStartHour = 0;
        }

        // Adjust end hour
        let adjustedEndHour = endHour;
        if (endMeridiem.toLowerCase() === 'pm' && endHour !== 12) {
          adjustedEndHour += 12;
        } else if (endMeridiem.toLowerCase() === 'am' && endHour === 12) {
          adjustedEndHour = 0;
        }

        // Fix common mistake: "10 to 12am" probably means "10am to 12pm" (noon)
        // If end time is before start time, assume they meant PM for the end
        if (adjustedEndHour < adjustedStartHour || (adjustedEndHour === adjustedStartHour && endMin <= startMin)) {
          if (endHour === 12 && endMeridiem.toLowerCase() === 'am') {
            // They probably meant 12pm (noon), not 12am (midnight)
            adjustedEndHour = 12;
          } else {
            // Add 12 hours to make it PM
            adjustedEndHour += 12;
          }
        }

        // Update start time
        result.start.assign('hour', adjustedStartHour);
        result.start.assign('minute', startMin);

        // Create or update end time
        if (!result.end) {
          result.end = result.start.clone();
        }

        if (result.end) {
          result.end.assign('hour', adjustedEndHour);
          result.end.assign('minute', endMin);
        }
      }
    });

    return results;
  }
});


/**
 * Detect item type from prefix
 * CRITICAL: Prefix MUST include space (e.g., "t " not "t")
 */
export function detectItemType(input: string): ItemType {
  if (input.startsWith('t ')) return 'todo';
  if (input.startsWith('e ')) return 'event';
  if (input.startsWith('r ')) return 'routine';
  if (input.startsWith('n ')) return 'note';
  if (input.startsWith('* ')) return 'note';
  return 'note'; // Default to note
}

/**
 * Check if input has an explicit note prefix
 */
export function hasExplicitNotePrefix(input: string): boolean {
  return input.startsWith('* ') || input.startsWith('n ');
}

/**
 * Remove prefix from content
 */
export function removePrefix(input: string): string {
  const prefixes = ['t ', 'e ', 'r ', 'n ', '* '];
  for (const prefix of prefixes) {
    if (input.startsWith(prefix)) {
      return input.slice(2);
    }
  }
  return input;
}


/**
 * Extract embedded note references from content
 * Pattern: [[note-id]] for embedding notes
 */
export function extractEmbeddedNotes(content: string): string[] {
  const embedPattern = /\[\[([a-z0-9]+)\]\]/g;
  const matches = content.matchAll(embedPattern);
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

  // Weekends
  if (lowerContent.includes('weekend') || lowerContent.includes('every weekend')) {
    return { frequency: 'weekly', interval: 1, daysOfWeek: [0, 6] };
  }

  // Enhanced monthly patterns - "first/second/third/fourth/last Tuesday of each month"
  const ordinals = ['first', 'second', 'third', 'fourth', 'fifth', 'last'];
  const ordinalNumbers: { [key: string]: number } = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    last: -1,
  };

  for (const ordinal of ordinals) {
    for (let i = 0; i < dayNames.length; i++) {
      const patterns = [
        `${ordinal} ${dayNames[i]} of each month`,
        `${ordinal} ${dayNames[i]} of the month`,
        `${ordinal} ${dayNames[i]} of every month`,
        `${ordinal} ${dayNames[i]} monthly`,
      ];

      for (const pattern of patterns) {
        if (lowerContent.includes(pattern)) {
          return {
            frequency: 'monthly',
            interval: 1,
            nthDayOfWeek: ordinalNumbers[ordinal],
            dayOfWeek: i,
          };
        }
      }
    }
  }

  // Specific day of month - "15th of each month", "on the 15th"
  const dayOfMonthMatch = lowerContent.match(/(?:on the )?(\d{1,2})(?:st|nd|rd|th)?(?: of (?:each|every) month)?/);
  if (dayOfMonthMatch && (lowerContent.includes('month') || lowerContent.includes('monthly'))) {
    const day = parseInt(dayOfMonthMatch[1]);
    if (day >= 1 && day <= 31) {
      return { frequency: 'monthly', interval: 1, dayOfMonth: day };
    }
  }

  // Last day of month
  if (lowerContent.includes('last day of') && lowerContent.includes('month')) {
    return { frequency: 'monthly', interval: 1, dayOfMonth: -1 };
  }

  // Every X weeks
  const everyXWeeksMatch = lowerContent.match(/every (\d+) weeks?/);
  if (everyXWeeksMatch) {
    return { frequency: 'weekly', interval: parseInt(everyXWeeksMatch[1]) };
  }

  // Every X months
  const everyXMonthsMatch = lowerContent.match(/every (\d+) months?/);
  if (everyXMonthsMatch) {
    return { frequency: 'monthly', interval: parseInt(everyXMonthsMatch[1]) };
  }

  return null;
}

/**
 * Parse natural language date/time using enhanced Chrono
 */
export function parseDateTime(content: string): { date: Date | null; hasTime: boolean; refText: string; endDate?: Date | null } {
  const results = customChrono.parse(content);

  // Check for 24h time pattern "at HH:MM" that chrono might miss entirely
  const time24Match = content.match(/\bat\s+(\d{1,2}):(\d{2})\b/i);
  let has24hTime = false;
  if (time24Match) {
    const hour = parseInt(time24Match[1]);
    const minute = parseInt(time24Match[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      has24hTime = true;
    }
  }

  if (results.length === 0) {
    // Even with no chrono results, if we found 24h time pattern, create a date for today
    if (has24hTime) {
      const now = new Date();
      const hour = parseInt(time24Match![1]);
      const minute = parseInt(time24Match![2]);
      now.setHours(hour, minute, 0, 0);
      return { date: now, hasTime: true, refText: time24Match![0] };
    }
    return { date: null, hasTime: false, refText: '' };
  }

  const result = results[0];
  const date = result.start.date();

  // Check if time component was specified
  let hasTime = result.start.isCertain('hour') && result.start.isCertain('minute');

  // Fallback: use 24h time pattern if chrono didn't mark time as certain
  if (!hasTime && has24hTime) {
    hasTime = true;
  }

  // Check for end time (for events with duration like "2-4pm")
  const endDate = result.end ? result.end.date() : null;

  return {
    date,
    hasTime,
    refText: result.text,
    endDate,
  };
}

/**
 * Main parsing function
 */
export function parseInput(input: string): ParsedInput {
  const type = detectItemType(input);
  const content = removePrefix(input);
  const embeddedNotes = extractEmbeddedNotes(content);

  let scheduledTime: Date | null = null;
  let endTime: Date | null = null;
  let hasTime = false;
  let recurrencePattern: RecurrencePattern | null = null;

  // Parse based on type
  if (type === 'event' || type === 'todo') {
    const parsed = parseDateTime(content);
    scheduledTime = parsed.date;
    endTime = parsed.endDate || null;
    hasTime = parsed.hasTime;
  }

  if (type === 'routine') {
    recurrencePattern = detectRecurrencePattern(content);
    const parsed = parseDateTime(content);
    scheduledTime = parsed.date;
    hasTime = parsed.hasTime;
  }

  // Determine if we need to prompt for time
  // For todos and events without a date OR without a specific time, we'll prompt
  let needsTimePrompt =
    (type === 'todo' || type === 'event') &&
    (scheduledTime === null || !hasTime);

  // Final override: if content contains "at HH:MM" pattern, don't prompt
  // This catches any cases where parseDateTime didn't properly detect the time
  if (needsTimePrompt) {
    const time24Override = content.match(/\bat\s+\d{1,2}:\d{2}\b/i);
    if (time24Override) {
      needsTimePrompt = false;
    }
  }

  // For all-day events, set to midnight-to-midnight
  if (type === 'event' && scheduledTime && !hasTime) {
    // Start at midnight
    const startOfDay = new Date(scheduledTime);
    startOfDay.setHours(0, 0, 0, 0);
    scheduledTime = startOfDay;

    // End at next midnight
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    endOfDay.setHours(0, 0, 0, 0);
    endTime = endOfDay;
  }

  return {
    type,
    content,
    scheduledTime,
    endTime,
    hasTime,
    recurrencePattern,
    embeddedNotes,
    needsTimePrompt,
  };
}
