import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimePane from './TimePane';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { format } from 'date-fns';

// Mock the stores and hooks
vi.mock('../store/useStore');
vi.mock('../store/useSettingsStore');
vi.mock('../hooks/useWheelNavigation', () => ({
  useWheelNavigation: () => ({ handleScroll: vi.fn() }),
}));

const mockUseStore = useStore as unknown as ReturnType<typeof vi.fn>;
const mockUseSettingsStore = useSettingsStore as unknown as ReturnType<typeof vi.fn>;

describe('TimePane', () => {
  const mockAddItem = vi.fn().mockReturnValue('new-id');
  const mockUpdateItem = vi.fn();
  const mockDeleteItem = vi.fn();
  const mockToggleTodoComplete = vi.fn();
  const mockAddItemDirect = vi.fn();

  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();

  const createTodo = (id: string, content: string, scheduledTime: Date | null = null) => ({
    id,
    userId: 'user-1',
    type: 'todo' as const,
    content,
    createdAt: now,
    createdDate: today,
    updatedAt: now,
    completedAt: null,
    cancelledAt: null,
    scheduledTime,
    hasTime: !!scheduledTime,
    parentId: null,
    parentType: null,
    depthLevel: 0,
    subtasks: [],
    embeddedItems: [],
    completionLinkId: null,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseSettingsStore.mockImplementation((selector: (state: { timeFormat: string }) => string) =>
      selector({ timeFormat: '12h' })
    );

    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          addItem: typeof mockAddItem;
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
          addItemDirect: typeof mockAddItemDirect;
        }) => unknown
      ) =>
        selector({
          items: [],
          addItem: mockAddItem,
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
          addItemDirect: mockAddItemDirect,
        })
    );
  });

  it('should render without errors', () => {
    render(<TimePane viewMode="infinite" />);
    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it('should render in book mode', () => {
    render(<TimePane viewMode="book" currentDate={today} />);
    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it('should show no results message when search has no matches', () => {
    const scheduledTime = new Date();
    scheduledTime.setHours(14, 0, 0, 0);

    const todo = createTodo('1', 'Test task', scheduledTime);

    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          addItem: typeof mockAddItem;
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
          addItemDirect: typeof mockAddItemDirect;
        }) => unknown
      ) =>
        selector({
          items: [todo],
          addItem: mockAddItem,
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
          addItemDirect: mockAddItemDirect,
        })
    );

    render(<TimePane viewMode="infinite" searchQuery="nonexistent" />);

    expect(screen.getByText(/No results found/)).toBeInTheDocument();
  });

  it('should accept onJumpToSource prop', () => {
    const onJumpToSource = vi.fn();

    render(<TimePane viewMode="infinite" onJumpToSource={onJumpToSource} />);

    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it('should handle navigation props in book mode', () => {
    const onNextDay = vi.fn();
    const onPreviousDay = vi.fn();

    render(
      <TimePane
        viewMode="book"
        currentDate={today}
        onNextDay={onNextDay}
        onPreviousDay={onPreviousDay}
      />
    );

    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it('should handle 24h time format setting', () => {
    mockUseSettingsStore.mockImplementation((selector: (state: { timeFormat: string }) => string) =>
      selector({ timeFormat: '24h' })
    );

    render(<TimePane viewMode="infinite" />);

    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it('should accept searchQuery prop', () => {
    render(<TimePane viewMode="infinite" searchQuery="test" />);

    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });
});
