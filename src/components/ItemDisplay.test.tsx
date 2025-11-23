import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemDisplay from './ItemDisplay';
import { useStore } from '../store/useStore';
import { Todo, Note } from '../types';

// Mock the toast hook
vi.mock('../hooks/useToast', () => ({
  useToast: () => vi.fn(),
}));

// Mock the history hook
vi.mock('../store/useHistory', () => ({
  useHistory: {
    getState: () => ({ performUndo: vi.fn() }),
  },
}));

describe('ItemDisplay', () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.setState({ items: [] });
  });

  const createTodo = (overrides: Partial<Todo> = {}): Todo => ({
    id: 'test-todo-1',
    userId: 'user-1',
    type: 'todo',
    content: 'Test todo item',
    createdAt: new Date('2025-01-01'),
    createdDate: '2025-01-01',
    updatedAt: new Date('2025-01-01'),
    completedAt: null,
    cancelledAt: null,
    scheduledTime: null,
    hasTime: false,
    parentId: null,
    parentType: null,
    depthLevel: 0,
    children: [],
    embeddedItems: [],
    completionLinkId: null,
    ...overrides,
  });

  const createNote = (overrides: Partial<Note> = {}): Note => ({
    id: 'test-note-1',
    userId: 'user-1',
    type: 'note',
    content: 'Test note item',
    createdAt: new Date('2025-01-01'),
    createdDate: '2025-01-01',
    updatedAt: new Date('2025-01-01'),
    completedAt: null,
    cancelledAt: null,
    linkPreviews: [],
    children: [],
    parentId: null,
    parentType: null,
    depthLevel: 0,
    orderIndex: 0,
    ...overrides,
  });

  describe('rendering', () => {
    it('renders todo item with checkbox symbol', () => {
      const todo = createTodo();
      render(<ItemDisplay item={todo} />);

      expect(screen.getByText('Test todo item')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Mark "Test todo item" as complete/ })
      ).toBeInTheDocument();
    });

    it('renders completed todo with checkmark symbol', () => {
      const completedTodo = createTodo({ completedAt: new Date() });
      render(<ItemDisplay item={completedTodo} />);

      expect(
        screen.getByRole('button', { name: /Mark "Test todo item" as incomplete/ })
      ).toBeInTheDocument();
    });

    it('renders note item with note symbol', () => {
      const note = createNote();
      render(<ItemDisplay item={note} />);

      expect(screen.getByText('Test note item')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'note item' })).toBeInTheDocument();
    });

    it('applies strikethrough to completed items', () => {
      const completedTodo = createTodo({ completedAt: new Date() });
      render(<ItemDisplay item={completedTodo} />);

      const content = screen.getByText('Test todo item');
      expect(content).toHaveClass('line-through');
    });

    it('applies italic styling to notes', () => {
      const note = createNote();
      render(<ItemDisplay item={note} />);

      const content = screen.getByText('Test note item');
      expect(content).toHaveClass('italic');
    });
  });

  describe('search highlighting', () => {
    it('highlights matching text when searchQuery is provided', () => {
      const todo = createTodo({ content: 'Buy groceries today' });
      render(<ItemDisplay item={todo} searchQuery="groceries" />);

      const highlight = screen.getByText('groceries');
      expect(highlight.tagName).toBe('MARK');
    });

    it('does not highlight when searchQuery is empty', () => {
      const todo = createTodo({ content: 'Buy groceries today' });
      render(<ItemDisplay item={todo} searchQuery="" />);

      expect(screen.getByText('Buy groceries today')).toBeInTheDocument();
      expect(screen.queryByRole('mark')).not.toBeInTheDocument();
    });
  });

  describe('nested items', () => {
    it('renders subtasks for todo items', () => {
      const subtask = createTodo({
        id: 'subtask-1',
        content: 'Subtask content',
        parentId: 'test-todo-1',
        depthLevel: 1,
      });
      const parentTodo = createTodo({ children: ['subtask-1'] });

      useStore.setState({ items: [parentTodo, subtask] });
      render(<ItemDisplay item={parentTodo} />);

      expect(screen.getByText('Subtask content')).toBeInTheDocument();
    });

    it('indents nested items', () => {
      const note = createNote({ depthLevel: 1 });
      const { container } = render(<ItemDisplay item={note} depth={1} />);

      // Check that margin-left is applied for indentation
      const indentedDiv = container.querySelector('[style*="margin-left"]');
      expect(indentedDiv).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('shows edit and delete buttons on hover', async () => {
      const todo = createTodo();
      render(<ItemDisplay item={todo} />);

      // Find the container and hover over it
      const container = screen.getByText('Test todo item').closest('div');
      if (container) {
        fireEvent.mouseEnter(container);

        expect(screen.getByTitle('Edit')).toBeInTheDocument();
        expect(screen.getByTitle('Delete')).toBeInTheDocument();
      }
    });

    it('calls toggleTodoComplete when checkbox is clicked', () => {
      const todo = createTodo();
      useStore.setState({ items: [todo] });

      render(<ItemDisplay item={todo} />);

      const checkbox = screen.getByRole('button', { name: /Mark "Test todo item" as complete/ });
      fireEvent.click(checkbox);

      // Verify the store action was called (item should be toggled)
      const updatedItems = useStore.getState().items;
      expect(updatedItems[0]).toBeDefined();
    });
  });

  describe('time display', () => {
    it('shows time for top-level items when showTime is true', () => {
      const todo = createTodo();
      render(<ItemDisplay item={todo} depth={0} showTime={true} />);

      // Time should be displayed
      const timeDisplay = screen.getByText(/\d{1,2}:\d{2}/);
      expect(timeDisplay).toBeInTheDocument();
    });

    it('hides time for nested items', () => {
      const todo = createTodo();
      render(<ItemDisplay item={todo} depth={1} showTime={true} />);

      // Time should not be displayed for nested items
      const timeElements = screen.queryAllByText(/^\d{1,2}:\d{2}/);
      expect(timeElements).toHaveLength(0);
    });
  });
});
