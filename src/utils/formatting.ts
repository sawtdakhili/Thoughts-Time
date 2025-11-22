/**
 * Shared formatting utilities for symbols and time display
 */

/**
 * Convert symbols back to prefixes for parsing
 * Used when editing items that display symbols
 */
export function symbolsToPrefix(text: string): string {
  return text
    .replace(/^(\s*)↹\s/, '$1e ')
    .replace(/^(\s*)□\s/, '$1t ')
    .replace(/^(\s*)☑\s/, '$1t ')
    .replace(/^(\s*)↻\s/, '$1r ')
    .replace(/^(\s*)↝\s/, '$1n ');
}

/**
 * Convert 24-hour time string (HH:mm) to display format
 * Example: "14:30" => "2:30pm" (12h) or "14:30" (24h)
 */
export function formatTimeForDisplay(time24: string, format: '12h' | '24h' = '12h'): string {
  const [hours, minutes] = time24.split(':').map(Number);

  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // 12-hour format
  const period = hours >= 12 ? 'pm' : 'am';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Prefix to symbol mapping for item types
 */
export const prefixToSymbol: { [key: string]: string } = {
  e: '↹',
  t: '□',
  r: '↻',
  '*': '↝',
};

/**
 * Symbol to prefix mapping for item types
 */
export const symbolToPrefix: { [key: string]: string } = {
  '↹': 'e',
  '□': 't',
  '☑': 't',
  '↻': 'r',
  '↝': 'n',
};

/**
 * Item type to symbol mapping
 */
export const typeToSymbol: { [key: string]: string } = {
  event: '↹',
  todo: '□',
  routine: '↻',
  note: '↝',
};
