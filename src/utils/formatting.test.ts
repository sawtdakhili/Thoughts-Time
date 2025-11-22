import { describe, it, expect } from 'vitest';
import {
  symbolsToPrefix,
  formatTimeForDisplay,
  prefixToSymbol,
  symbolToPrefix,
} from './formatting';

describe('symbolsToPrefix', () => {
  it('converts event symbol to prefix', () => {
    expect(symbolsToPrefix('↹ Meeting')).toBe('e Meeting');
  });

  it('converts unchecked todo symbol to prefix', () => {
    expect(symbolsToPrefix('□ Task')).toBe('t Task');
  });

  it('converts checked todo symbol to prefix', () => {
    expect(symbolsToPrefix('☑ Completed task')).toBe('t Completed task');
  });

  it('converts routine symbol to prefix', () => {
    expect(symbolsToPrefix('↻ Daily exercise')).toBe('r Daily exercise');
  });

  it('converts note symbol to prefix', () => {
    expect(symbolsToPrefix('↝ Note content')).toBe('n Note content');
  });

  it('preserves leading whitespace', () => {
    expect(symbolsToPrefix('  ↹ Indented event')).toBe('  e Indented event');
    expect(symbolsToPrefix('    □ Deeply indented task')).toBe('    t Deeply indented task');
  });

  it('handles text without symbols', () => {
    expect(symbolsToPrefix('Plain text')).toBe('Plain text');
  });

  it('only converts symbols at the start', () => {
    expect(symbolsToPrefix('Text with ↹ symbol in middle')).toBe('Text with ↹ symbol in middle');
  });
});

describe('formatTimeForDisplay', () => {
  describe('12-hour format', () => {
    it('formats morning time', () => {
      expect(formatTimeForDisplay('09:30', '12h')).toBe('9:30 am');
    });

    it('formats noon', () => {
      expect(formatTimeForDisplay('12:00', '12h')).toBe('12:00 pm');
    });

    it('formats midnight', () => {
      expect(formatTimeForDisplay('00:00', '12h')).toBe('12:00 am');
    });

    it('formats afternoon time', () => {
      expect(formatTimeForDisplay('14:30', '12h')).toBe('2:30 pm');
    });

    it('formats evening time', () => {
      expect(formatTimeForDisplay('23:45', '12h')).toBe('11:45 pm');
    });

    it('defaults to 12-hour format when no format specified', () => {
      expect(formatTimeForDisplay('15:20')).toBe('3:20 pm');
    });

    it('pads single-digit minutes', () => {
      expect(formatTimeForDisplay('09:05', '12h')).toBe('9:05 am');
    });
  });

  describe('24-hour format', () => {
    it('formats morning time', () => {
      expect(formatTimeForDisplay('09:30', '24h')).toBe('09:30');
    });

    it('formats noon', () => {
      expect(formatTimeForDisplay('12:00', '24h')).toBe('12:00');
    });

    it('formats midnight', () => {
      expect(formatTimeForDisplay('00:00', '24h')).toBe('00:00');
    });

    it('formats afternoon time', () => {
      expect(formatTimeForDisplay('14:30', '24h')).toBe('14:30');
    });

    it('formats evening time', () => {
      expect(formatTimeForDisplay('23:45', '24h')).toBe('23:45');
    });

    it('pads single-digit hours and minutes', () => {
      expect(formatTimeForDisplay('03:05', '24h')).toBe('03:05');
    });
  });
});

describe('prefixToSymbol', () => {
  it('maps event prefix to symbol', () => {
    expect(prefixToSymbol['e']).toBe('↹');
  });

  it('maps todo prefix to symbol', () => {
    expect(prefixToSymbol['t']).toBe('□');
  });

  it('maps routine prefix to symbol', () => {
    expect(prefixToSymbol['r']).toBe('↻');
  });

  it('maps note prefix to symbol', () => {
    expect(prefixToSymbol['*']).toBe('↝');
  });

  it('has exactly 4 mappings', () => {
    expect(Object.keys(prefixToSymbol)).toHaveLength(4);
  });
});

describe('symbolToPrefix', () => {
  it('maps event symbol to prefix', () => {
    expect(symbolToPrefix['↹']).toBe('e');
  });

  it('maps unchecked todo symbol to prefix', () => {
    expect(symbolToPrefix['□']).toBe('t');
  });

  it('maps checked todo symbol to prefix', () => {
    expect(symbolToPrefix['☑']).toBe('t');
  });

  it('maps routine symbol to prefix', () => {
    expect(symbolToPrefix['↻']).toBe('r');
  });

  it('maps note symbol to prefix', () => {
    expect(symbolToPrefix['↝']).toBe('n');
  });

  it('has exactly 5 mappings', () => {
    expect(Object.keys(symbolToPrefix)).toHaveLength(5);
  });

  it('maps both checked and unchecked todo symbols to same prefix', () => {
    expect(symbolToPrefix['□']).toBe(symbolToPrefix['☑']);
  });
});
