import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThoughtsPane from './ThoughtsPane';
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

describe('ThoughtsPane', () => {
  const mockAddItem = vi.fn().mockReturnValue('new-id');
  const mockUpdateItem = vi.fn();
  const mockDeleteItem = vi.fn();
  const mockToggleTodoComplete = vi.fn();

  const today = format(new Date(), 'yyyy-MM-dd');

  const createItem = (
    id: string,
    content: string,
    type: 'todo' | 'note' | 'event' | 'routine' = 'todo'
  ) => ({
    id,
    userId: 'user-1',
    type,
    content,
    createdAt: new Date(),
    createdDate: today,
    updatedAt: new Date(),
    completedAt: null,
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
        }) => unknown
      ) =>
        selector({
          items: [],
          addItem: mockAddItem,
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
        })
    );
  });

  it('should render the input textarea', () => {
    render(<ThoughtsPane viewMode="infinite" />);
    expect(screen.getByPlaceholderText(/Type here/)).toBeInTheDocument();
  });

  it('should handle input change', () => {
    render(<ThoughtsPane viewMode="infinite" />);

    const textarea = screen.getByPlaceholderText(/Type here/);
    fireEvent.change(textarea, { target: { value: 'New item' } });

    expect(textarea).toHaveValue('New item');
  });

  it('should handle multi-line input', () => {
    render(<ThoughtsPane viewMode="infinite" />);

    const textarea = screen.getByPlaceholderText(/Type here/);
    fireEvent.change(textarea, {
      target: { value: 't First task\nt Second task' },
    });

    expect(textarea).toHaveValue('t First task\nt Second task');
  });

  it('should render in book mode', () => {
    render(
      <ThoughtsPane
        viewMode="book"
        currentDate={today}
        onNextDay={vi.fn()}
        onPreviousDay={vi.fn()}
      />
    );

    // Should render without errors
    expect(screen.getByPlaceholderText(/Type here/)).toBeInTheDocument();
  });

  it('should show no results message when search has no matches', () => {
    const item = createItem('1', 'Test item');

    mockUseStore.mockImplementation(
      (
        selector: (state: {
          items: unknown[];
          addItem: typeof mockAddItem;
          updateItem: typeof mockUpdateItem;
          deleteItem: typeof mockDeleteItem;
          toggleTodoComplete: typeof mockToggleTodoComplete;
        }) => unknown
      ) =>
        selector({
          items: [item],
          addItem: mockAddItem,
          updateItem: mockUpdateItem,
          deleteItem: mockDeleteItem,
          toggleTodoComplete: mockToggleTodoComplete,
        })
    );

    render(<ThoughtsPane viewMode="infinite" searchQuery="nonexistent" />);

    expect(screen.getByText(/No results found/)).toBeInTheDocument();
  });

  it('should accept highlightedItemId prop', () => {
    render(<ThoughtsPane viewMode="infinite" highlightedItemId="some-id" />);
    // Should render without errors
    expect(screen.getByPlaceholderText(/Type here/)).toBeInTheDocument();
  });

  it('should accept searchQuery prop', () => {
    render(<ThoughtsPane viewMode="infinite" searchQuery="test" />);
    // Should render without errors
    expect(screen.getByPlaceholderText(/Type here/)).toBeInTheDocument();
  });
});
