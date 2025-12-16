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
    const itemMap = new Map([[todo.id, todo]]);
    expect(matchesSearch(todo, '', itemMap)).toBe(true);
  });

  it('matches content case-insensitively', () => {
    const todo = createTodo('Buy MILK');
    const itemMap = new Map([[todo.id, todo]]);
    expect(matchesSearch(todo, 'milk', itemMap)).toBe(true);
    expect(matchesSearch(todo, 'MILK', itemMap)).toBe(true);
    expect(matchesSearch(todo, 'Milk', itemMap)).toBe(true);
  });

  it('returns false when content does not match', () => {
    const todo = createTodo('Buy eggs');
    const itemMap = new Map([[todo.id, todo]]);
    expect(matchesSearch(todo, 'milk', itemMap)).toBe(false);
  });

  it('matches partial content', () => {
    const todo = createTodo('Buy groceries');
    const itemMap = new Map([[todo.id, todo]]);
    expect(matchesSearch(todo, 'groc', itemMap)).toBe(true);
    expect(matchesSearch(todo, 'ceries', itemMap)).toBe(true);
  });

  describe('recursive search', () => {
    it('matches if subtask content matches', () => {
      const subtask = createTodo('Get milk');
      subtask.id = 'subtask-1';
      const parent = createTodo('Shopping trip', ['subtask-1']);

      const itemMap = new Map([
        [parent.id, parent],
        [subtask.id, subtask],
      ]);
      expect(matchesSearch(parent, 'milk', itemMap)).toBe(true);
    });

    it('matches if note sub-item matches', () => {
      const subNote = createNote('Important reminder');
      subNote.id = 'sub-note-1';
      const parent = createNote('Project notes', ['sub-note-1']);

      const itemMap = new Map([
        [parent.id, parent],
        [subNote.id, subNote],
      ]);
      expect(matchesSearch(parent, 'reminder', itemMap)).toBe(true);
    });

    it('matches deeply nested items', () => {
      const deepChild = createTodo('Deep content');
      deepChild.id = 'deep-1';
      const child = createTodo('Middle', ['deep-1']);
      child.id = 'child-1';
      const parent = createTodo('Parent', ['child-1']);

      const itemMap = new Map([
        [parent.id, parent],
        [child.id, child],
        [deepChild.id, deepChild],
      ]);
      expect(matchesSearch(parent, 'Deep', itemMap)).toBe(true);
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
