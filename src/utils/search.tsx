import React from 'react';
import { Item } from '../types';

/**
 * Recursively checks if an item or any of its children match the search query.
 * PERFORMANCE: Uses item map for O(1) child lookups instead of O(n) array.find()
 *
 * @param item - The item to check
 * @param query - The search query string
 * @param itemMap - Map of item IDs to items for fast lookups
 * @returns True if the item or any child matches the query
 *
 * @example
 * const itemMap = new Map(items.map(i => [i.id, i]));
 * const matches = matchesSearch(todo, 'meeting', itemMap);
 */
export function matchesSearch(item: Item, query: string, itemMap: Map<string, Item>): boolean {
  if (!query) return true;

  const lowerQuery = query.toLowerCase();

  // Check content
  if (item.content.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  // Recursively check children using O(1) map lookup
  const childIds = 'children' in item ? item.children : [];

  for (const childId of childIds) {
    const childItem = itemMap.get(childId);
    if (childItem && matchesSearch(childItem, query, itemMap)) {
      return true;
    }
  }

  return false;
}

/**
 * Legacy wrapper for backward compatibility with array-based search.
 * Prefer using matchesSearch with itemMap for better performance.
 * @deprecated Use matchesSearch with Map instead
 */
export function matchesSearchArray(item: Item, query: string, items: Item[]): boolean {
  const itemMap = new Map(items.map(i => [i.id, i]));
  return matchesSearch(item, query, itemMap);
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

  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }

    // Add highlighted match with position-based stable key
    parts.push(
      <mark key={`mark-${index}`} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded-sm">
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
