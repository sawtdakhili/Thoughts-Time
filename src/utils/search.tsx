import React from 'react';
import { Item } from '../types';

/**
 * Recursively checks if an item or any of its children match the search query.
 *
 * @param item - The item to check
 * @param query - The search query string
 * @param items - All items in the store (for looking up children)
 * @returns True if the item or any child matches the query
 *
 * @example
 * const matches = matchesSearch(todo, 'meeting', allItems);
 */
export function matchesSearch(item: Item, query: string, items: Item[]): boolean {
  if (!query) return true;

  const lowerQuery = query.toLowerCase();

  // Check content
  if (item.content.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  // Recursively check children
  const childIds = 'children' in item ? item.children : [];

  for (const childId of childIds) {
    const childItem = items.find((i) => i.id === childId);
    if (childItem && matchesSearch(childItem, query, items)) {
      return true;
    }
  }

  return false;
}

/**
 * Highlights matching text in a string by wrapping matches in <mark> tags.
 *
 * @param text - The text to search within
 * @param query - The search query to highlight
 * @returns Array of React nodes with highlighted matches
 *
 * @example
 * const highlighted = highlightMatches('Hello world', 'world');
 * // Returns: ['Hello ', <mark>world</mark>]
 */
export function highlightMatches(text: string, query: string): (string | React.ReactElement)[] {
  if (!query) return [text];

  const parts: (string | React.ReactElement)[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;
  let index = lowerText.indexOf(lowerQuery);
  let keyCounter = 0;

  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }

    // Add highlighted match
    parts.push(
      <mark key={keyCounter++} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded-sm">
        {text.substring(index, index + query.length)}
      </mark>
    );

    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}
