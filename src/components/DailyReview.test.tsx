import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DailyReview from './DailyReview';
import { useStore } from '../store/useStore';
import { useToast } from '../hooks/useToast';
import { format, subDays } from 'date-fns';

// Mock the stores
vi.mock('../store/useStore');
vi.mock('../hooks/useToast');

const mockUseStore = useStore as unknown as ReturnType<typeof vi.fn>;
const mockUseToast = useToast as unknown as ReturnType<typeof vi.fn>;

describe('DailyReview', () => {
  const mockUpdateItem = vi.fn();
  const mockDeleteItem = vi.fn();
  const mockToggleTodoComplete = vi.fn();
  const mockAddToast = vi.fn();

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd');

  const createTodo = (
    id: string,
    content: string,
    createdDate: string,
    completedAt: Date | null = null
  ) => ({
    id,
    userId: 'user-1',
    type: 'todo' as const,
    content,
    createdAt: new Date(createdDate),
    createdDate,
    updatedAt: new Date(),
    completedAt,
    cancelledAt: null,
    scheduledTime: null,
    hasTime: false,
    parentId: null,
    parentType: null,
    depthLevel: 0,
    subtasks: [],
    embeddedItems: [],
    completionLinkId: null,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseToast.mockImplementation(
      (selector: (state: { addToast: typeof mockAddToast }) => typeof mockAddToast) =>
        selector({ addToast: mockAddToast })
    );
  });

  it('should not render when there are no review items', () => {
    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
        }) => unknown
      ) =>
        selector({
          items: [],
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
        })
    );

    const { container } = render(<DailyReview />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render todos from today', () => {
    const todayTodo = createTodo('1', 'Today task', today);

    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
        }) => unknown
      ) =>
        selector({
          items: [todayTodo],
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
        })
    );

    const { container } = render(<DailyReview />);
    expect(container.firstChild).toBeNull();
  });

  it('should render incomplete todos from previous days', () => {
    const oldTodo = createTodo('1', 'Old task', yesterday);

    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
        }) => unknown
      ) =>
        selector({
          items: [oldTodo],
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
        })
    );

    render(<DailyReview />);

    expect(screen.getByText('Daily Review')).toBeInTheDocument();
    expect(screen.getByText('Old task')).toBeInTheDocument();
    expect(screen.getByText(/1 day old/)).toBeInTheDocument();
  });

  it('should not render completed todos', () => {
    const completedTodo = createTodo('1', 'Completed task', yesterday, new Date());

    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
        }) => unknown
      ) =>
        selector({
          items: [completedTodo],
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
        })
    );

    const { container } = render(<DailyReview />);
    expect(container.firstChild).toBeNull();
  });

  it('should sort items by waiting days (oldest first)', () => {
    const newerTodo = createTodo('1', 'Newer task', yesterday);
    const olderTodo = createTodo('2', 'Older task', twoDaysAgo);

    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
        }) => unknown
      ) =>
        selector({
          items: [newerTodo, olderTodo],
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
        })
    );

    render(<DailyReview />);

    const items = screen.getAllByText(/task/);
    expect(items[0]).toHaveTextContent('Older task');
    expect(items[1]).toHaveTextContent('Newer task');
  });

  it('should have accessible action buttons', () => {
    const oldTodo = createTodo('1', 'Test task', yesterday);

    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
        }) => unknown
      ) =>
        selector({
          items: [oldTodo],
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
        })
    );

    render(<DailyReview />);

    expect(screen.getByLabelText(/Reschedule "Test task"/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Complete "Test task"/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cancel "Test task"/)).toBeInTheDocument();
  });

  it('should call toggleTodoComplete when complete button is clicked', () => {
    const oldTodo = createTodo('1', 'Test task', yesterday);

    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
        }) => unknown
      ) =>
        selector({
          items: [oldTodo],
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
        })
    );

    render(<DailyReview />);

    fireEvent.click(screen.getByLabelText(/Complete "Test task"/));
    expect(mockToggleTodoComplete).toHaveBeenCalledWith('1');
  });

  it('should show reschedule input when reschedule button is clicked', () => {
    const oldTodo = createTodo('1', 'Test task', yesterday);

    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
        }) => unknown
      ) =>
        selector({
          items: [oldTodo],
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
        })
    );

    render(<DailyReview />);

    fireEvent.click(screen.getByLabelText(/Reschedule "Test task"/));
    expect(screen.getByPlaceholderText(/tomorrow 2pm/)).toBeInTheDocument();
  });

  it('should filter items based on search query', () => {
    const todo1 = createTodo('1', 'Buy groceries', yesterday);
    const todo2 = createTodo('2', 'Call mom', yesterday);

    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
        }) => unknown
      ) =>
        selector({
          items: [todo1, todo2],
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
        })
    );

    render(<DailyReview searchQuery="groceries" />);

    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.queryByText('Call mom')).not.toBeInTheDocument();
  });

  it('should have proper semantic structure', () => {
    const oldTodo = createTodo('1', 'Test task', yesterday);

    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
        }) => unknown
      ) =>
        selector({
          items: [oldTodo],
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
        })
    );

    render(<DailyReview />);

    // Check for proper heading
    const heading = screen.getByRole('heading', { name: 'Daily Review' });
    expect(heading).toBeInTheDocument();

    // Check for section with aria-labelledby
    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'daily-review-heading');
  });

  it('should show "Show more" button when more than 10 items', () => {
    const todos = Array.from({ length: 15 }, (_, i) => createTodo(`${i}`, `Task ${i}`, yesterday));

    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
        }) => unknown
      ) =>
        selector({
          items: todos,
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
        })
    );

    render(<DailyReview />);

    expect(screen.getByText(/Show 5 more/)).toBeInTheDocument();
  });
});
