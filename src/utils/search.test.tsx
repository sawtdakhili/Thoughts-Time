import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { matchesSearch, highlightMatches } from './search.tsx';
import { Todo, Note } from '../types';

describe('matchesSearch', () => {
  const createTodo = (content: string, children: string[] = []): Todo => ({
    id: 'test-' + Math.random(),
    userId: 'user-1',
    type: 'todo',
    content,
    createdAt: new Date(),
    createdDate: '2025-01-01',
    updatedAt: new Date(),
    completedAt: null,
    cancelledAt: null,
    scheduledTime: null,
    hasTime: false,
    parentId: null,
    parentType: null,
    depthLevel: 0,
    children,
    embeddedItems: [],
    completionLinkId: null,
  });

  const createNote = (content: string, children: string[] = []): Note => ({
    id: 'test-' + Math.random(),
    userId: 'user-1',
    type: 'note',
    content,
    createdAt: new Date(),
    createdDate: '2025-01-01',
    updatedAt: new Date(),
    completedAt: null,
    cancelledAt: null,
    linkPreviews: [],
    children,
    parentId: null,
    parentType: null,
    depthLevel: 0,
    orderIndex: 0,
  });

  it('returns true when query is empty', () => {
    const todo = createTodo('Buy milk');
    expect(matchesSearch(todo, '', [])).toBe(true);
  });

  it('matches content case-insensitively', () => {
    const todo = createTodo('Buy MILK');
    expect(matchesSearch(todo, 'milk', [])).toBe(true);
    expect(matchesSearch(todo, 'MILK', [])).toBe(true);
    expect(matchesSearch(todo, 'Milk', [])).toBe(true);
  });

  it('returns false when content does not match', () => {
    const todo = createTodo('Buy eggs');
    expect(matchesSearch(todo, 'milk', [])).toBe(false);
  });

  it('matches partial content', () => {
    const todo = createTodo('Buy groceries');
    expect(matchesSearch(todo, 'groc', [])).toBe(true);
    expect(matchesSearch(todo, 'ceries', [])).toBe(true);
  });

  describe('recursive search', () => {
    it('matches if subtask content matches', () => {
      const subtask = createTodo('Get milk');
      subtask.id = 'subtask-1';
      const parent = createTodo('Shopping trip', ['subtask-1']);

      expect(matchesSearch(parent, 'milk', [parent, subtask])).toBe(true);
    });

    it('matches if note sub-item matches', () => {
      const subNote = createNote('Important reminder');
      subNote.id = 'sub-note-1';
      const parent = createNote('Project notes', ['sub-note-1']);

      expect(matchesSearch(parent, 'reminder', [parent, subNote])).toBe(true);
    });

    it('matches deeply nested items', () => {
      const deepChild = createTodo('Deep content');
      deepChild.id = 'deep-1';
      const child = createTodo('Middle', ['deep-1']);
      child.id = 'child-1';
      const parent = createTodo('Parent', ['child-1']);

      const items = [parent, child, deepChild];
      expect(matchesSearch(parent, 'Deep', items)).toBe(true);
    });
  });
});

describe('highlightMatches', () => {
  it('returns original text when query is empty', () => {
    const result = highlightMatches('Hello world', '');
    expect(result).toEqual(['Hello world']);
  });

  it('highlights single match', () => {
    const result = highlightMatches('Hello world', 'world');

    // Render to check the output
    render(<>{result}</>);
    const highlight = screen.getByText('world');
    expect(highlight.tagName).toBe('MARK');
  });

  it('highlights multiple matches', () => {
    const result = highlightMatches('test test test', 'test');

    render(<>{result}</>);
    const highlights = screen.getAllByText('test');
    expect(highlights).toHaveLength(3);
    highlights.forEach((h) => expect(h.tagName).toBe('MARK'));
  });

  it('is case-insensitive', () => {
    const result = highlightMatches('Hello WORLD', 'world');

    render(<>{result}</>);
    const highlight = screen.getByText('WORLD');
    expect(highlight.tagName).toBe('MARK');
  });

  it('preserves text before and after matches', () => {
    const result = highlightMatches('prefix match suffix', 'match');

    render(<>{result}</>);
    expect(screen.getByText(/prefix/)).toBeInTheDocument();
    expect(screen.getByText('match').tagName).toBe('MARK');
    expect(screen.getByText(/suffix/)).toBeInTheDocument();
  });

  it('handles match at beginning of text', () => {
    const result = highlightMatches('hello there', 'hello');

    render(<>{result}</>);
    expect(screen.getByText('hello').tagName).toBe('MARK');
  });

  it('handles match at end of text', () => {
    const result = highlightMatches('say hello', 'hello');

    render(<>{result}</>);
    expect(screen.getByText('hello').tagName).toBe('MARK');
  });

  it('handles no match', () => {
    const result = highlightMatches('Hello world', 'xyz');
    expect(result).toEqual(['Hello world']);
  });
});
