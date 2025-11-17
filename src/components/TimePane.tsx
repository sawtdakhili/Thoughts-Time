import { useState, useEffect, useRef } from 'react';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import DailyReview from './DailyReview';
import { Item, Todo, Event as EventType, Note, Routine } from '../types';
import { parseInput } from '../utils/parser';

type TimelineEntry = {
  time: Date;
  timeKey: string;
  type: 'todo' | 'event-start' | 'event-end' | 'event-single';
  item: Item;
};

interface TimePaneProps {
  searchQuery?: string;
  viewMode?: 'infinite' | 'book';
  currentDate?: string;
  onNextDay?: () => void;
  onPreviousDay?: () => void;
}

function TimePane({
  searchQuery = '',
  viewMode = 'infinite',
  currentDate,
  onNextDay,
  onPreviousDay,
}: TimePaneProps) {
  const items = useStore((state) => state.items);
  const toggleTodoComplete = useStore((state) => state.toggleTodoComplete);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isPageFlipping, setIsPageFlipping] = useState(false);
  const lastScrollTop = useRef(0);
  const isTransitioning = useRef(false);
  const wheelDeltaY = useRef(0);

  // Filter function: recursively check if item or its children match search
  const matchesSearch = (item: Item, query: string): boolean => {
    if (!query) return true;

    const lowerQuery = query.toLowerCase();

    // Check content
    if (item.content.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Check tags
    if (item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    // Recursively check sub-items
    const subItemIds = item.type === 'note'
      ? (item as Note).subItems
      : item.type === 'todo'
        ? (item as Todo).subtasks
        : [];

    for (const subId of subItemIds) {
      const subItem = items.find(i => i.id === subId);
      if (subItem && matchesSearch(subItem, query)) {
        return true;
      }
    }

    return false;
  };

  // Filter items based on search query
  const filteredItems = searchQuery
    ? items.filter(item => matchesSearch(item, searchQuery))
    : items;

  // Compute timeline entries grouped by date
  const entriesByDate = new Map<string, TimelineEntry[]>();

  // First, collect all scheduled todos for checking event overlaps
  const scheduledTodos: Array<{ time: Date; item: Todo }> = [];
  filteredItems.forEach((item) => {
    if (item.type === 'todo') {
      const todo = item as Todo;
      if (todo.scheduledTime) {
        scheduledTodos.push({ time: new Date(todo.scheduledTime), item: todo });
      }
    }
  });

  // Helper function to check if event has items within its timeframe
  const hasItemsWithinEvent = (event: EventType): boolean => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    return scheduledTodos.some(({ time }) => {
      return time > startTime && time < endTime;
    });
  };

  // Now process all items
  filteredItems.forEach((item) => {
    if (item.type === 'todo') {
      const todo = item as Todo;
      if (todo.scheduledTime) {
        const dateKey = format(new Date(todo.scheduledTime), 'yyyy-MM-dd');
        if (!entriesByDate.has(dateKey)) {
          entriesByDate.set(dateKey, []);
        }
        entriesByDate.get(dateKey)!.push({
          time: new Date(todo.scheduledTime),
          timeKey: format(new Date(todo.scheduledTime), 'h:mm a'),
          type: 'todo',
          item,
        });
      }
    } else if (item.type === 'event') {
      const event = item as EventType;
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      const dateKey = format(startTime, 'yyyy-MM-dd');

      if (!entriesByDate.has(dateKey)) {
        entriesByDate.set(dateKey, []);
      }

      // Check if event should be split
      if (hasItemsWithinEvent(event)) {
        // Split event: add start and end markers
        entriesByDate.get(dateKey)!.push({
          time: startTime,
          timeKey: format(startTime, 'h:mm a'),
          type: 'event-start',
          item,
        });

        entriesByDate.get(dateKey)!.push({
          time: endTime,
          timeKey: format(endTime, 'h:mm a'),
          type: 'event-end',
          item,
        });
      } else {
        // Single event: no split
        entriesByDate.get(dateKey)!.push({
          time: startTime,
          timeKey: format(startTime, 'h:mm a'),
          type: 'event-single',
          item,
        });
      }
    }
  });

  // Generate date range: 30 days past to 30 days future
  const today = format(new Date(), 'yyyy-MM-dd');
  const dates: string[] = [];

  for (let i = -30; i <= 30; i++) {
    const date = i === 0
      ? new Date()
      : i < 0
        ? subDays(new Date(), Math.abs(i))
        : addDays(new Date(), i);
    dates.push(format(date, 'yyyy-MM-dd'));
  }

  // Auto-scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight / 2;
    }
  }, []);

  const handleWheel = (e: WheelEvent) => {
    if (!scrollRef.current || viewMode !== 'book' || !onNextDay || !onPreviousDay || isTransitioning.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isScrollable = scrollHeight > clientHeight;

    // For non-scrollable content, use wheel events directly
    if (!isScrollable) {
      wheelDeltaY.current += e.deltaY;

      // Threshold to prevent accidental triggers
      if (wheelDeltaY.current > 100) {
        // Scroll down = next day
        wheelDeltaY.current = 0;
        isTransitioning.current = true;
        setIsPageFlipping(true);
        setTimeout(() => {
          onNextDay();
          setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
            setTimeout(() => {
              setIsPageFlipping(false);
              isTransitioning.current = false;
            }, 600);
          }, 50);
        }, 50);
      } else if (wheelDeltaY.current < -100) {
        // Scroll up = previous day
        wheelDeltaY.current = 0;
        isTransitioning.current = true;
        setIsPageFlipping(true);
        setTimeout(() => {
          onPreviousDay();
          setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
            setTimeout(() => {
              setIsPageFlipping(false);
              isTransitioning.current = false;
            }, 600);
          }, 50);
        }, 50);
      }
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // Book mode: detect when user tries to scroll beyond boundaries
    if (viewMode === 'book' && onNextDay && onPreviousDay && !isTransitioning.current) {
      const scrollDirection = scrollTop > lastScrollTop.current ? 'down' : 'up';
      lastScrollTop.current = scrollTop;

      // Only detect boundary if content is scrollable (taller than container)
      const isScrollable = scrollHeight > clientHeight;

      // At bottom, trying to scroll down = next day
      if (isScrollable && scrollTop + clientHeight >= scrollHeight - 1 && scrollDirection === 'down') {
        isTransitioning.current = true;
        setIsPageFlipping(true);
        setTimeout(() => {
          onNextDay();
          // Wait for React to re-render with new content before resetting scroll
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = 0;
            }
            setTimeout(() => {
              setIsPageFlipping(false);
              isTransitioning.current = false;
            }, 600);
          }, 50);
        }, 50);
      }
      // At top, trying to scroll up = previous day
      else if (scrollTop <= 1 && scrollDirection === 'up') {
        isTransitioning.current = true;
        setIsPageFlipping(true);
        setTimeout(() => {
          onPreviousDay();
          // Wait for React to re-render with new content before resetting scroll
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = 0;
            }
            setTimeout(() => {
              setIsPageFlipping(false);
              isTransitioning.current = false;
            }, 600);
          }, 50);
        }, 50);
      }
    }
  };

  // Add wheel event listener for non-scrollable content
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl && viewMode === 'book') {
      scrollEl.addEventListener('wheel', handleWheel as any);
      return () => scrollEl.removeEventListener('wheel', handleWheel as any);
    }
  }, [viewMode, onNextDay, onPreviousDay]);

  // Get prefix for item type
  const getPrefix = (item: Item) => {
    switch (item.type) {
      case 'todo':
        return 't';
      case 'event':
        return 'e';
      case 'routine':
        return 'r';
      case 'note':
        // Timeline entries are top-level, so notes have no prefix
        return '';
      default:
        return '';
    }
  };

  const handleEdit = (itemId: string, item: Item) => {
    const prefix = getPrefix(item);
    setEditingItem(itemId);
    if (prefix) {
      setEditContent(`${prefix} ${item.content}`);
    } else {
      // Notes have no prefix
      setEditContent(item.content);
    }
  };

  // Helper: Convert symbols back to prefixes for parsing
  const symbolsToPrefix = (text: string): string => {
    return text
      .replace(/^(\s*)↹\s/, '$1e ')
      .replace(/^(\s*)□\s/, '$1t ')
      .replace(/^(\s*)☑\s/, '$1t ')
      .replace(/^(\s*)↻\s/, '$1r ')
      .replace(/^(\s*)↝\s/, '$1* ');
  };

  const handleSaveEdit = (itemId: string) => {
    const currentItem = items.find(i => i.id === itemId);
    if (!editContent.trim() || !currentItem) {
      setEditingItem(null);
      setEditContent('');
      return;
    }

    // Convert symbols back to prefixes before parsing
    const contentWithPrefix = symbolsToPrefix(editContent.trim());

    // Re-parse the full line (with prefix) to detect type changes
    const parsed = parseInput(contentWithPrefix);

    // If type changed, delete old item and create new one
    if (parsed.type !== currentItem.type) {
      // Create new item with parsed data
      const newItemData = {
        content: parsed.content,
        tags: parsed.tags,
        type: parsed.type,
        createdAt: currentItem.createdAt, // Preserve original creation time
        createdDate: currentItem.createdDate,
      };

      // Add type-specific fields
      if (parsed.type === 'todo') {
        Object.assign(newItemData, {
          scheduledTime: parsed.scheduledTime,
          hasTime: parsed.hasTime,
          deadline: parsed.deadline,
          completedAt: null,
          subtasks: [],
          embeddedItems: [],
        });
      } else if (parsed.type === 'event') {
        Object.assign(newItemData, {
          startTime: parsed.scheduledTime || new Date(),
          endTime: parsed.endTime || parsed.scheduledTime || new Date(),
          hasTime: parsed.hasTime,
          embeddedItems: [],
        });
      } else if (parsed.type === 'routine') {
        Object.assign(newItemData, {
          scheduledTime: parsed.scheduledTime ? format(parsed.scheduledTime, 'HH:mm') : '09:00',
          hasTime: parsed.hasTime,
          recurrencePattern: parsed.recurrencePattern || { frequency: 'daily', interval: 1 },
          streak: 0,
          lastCompleted: null,
          embeddedItems: [],
        });
      } else if (parsed.type === 'note') {
        Object.assign(newItemData, {
          subItems: [],
        });
      }

      // Delete old and add new
      const addItem = useStore.getState().addItem;
      deleteItem(itemId);
      addItem(newItemData as any);
    } else {
      // Same type, just update
      const updates: Partial<Item> = { content: parsed.content, tags: parsed.tags };

      if (currentItem.type === 'todo') {
        Object.assign(updates, {
          scheduledTime: parsed.scheduledTime,
          hasTime: parsed.hasTime,
          deadline: parsed.deadline,
        });
      } else if (currentItem.type === 'event') {
        Object.assign(updates, {
          startTime: parsed.scheduledTime || (currentItem as EventType).startTime,
          endTime: parsed.endTime || parsed.scheduledTime || (currentItem as EventType).endTime,
          hasTime: parsed.hasTime,
        });
      } else if (currentItem.type === 'routine') {
        Object.assign(updates, {
          scheduledTime: parsed.scheduledTime ? format(parsed.scheduledTime, 'HH:mm') : (currentItem as Routine).scheduledTime,
          hasTime: parsed.hasTime,
          recurrencePattern: parsed.recurrencePattern || (currentItem as Routine).recurrencePattern,
        });
      }

      updateItem(itemId, updates);
    }

    setEditingItem(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditContent('');
  };

  // Handle input change with symbol conversion
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    // Check if a space was just added
    if (newValue.length > editContent.length && newValue[cursorPos - 1] === ' ') {
      const beforeSpace = newValue.substring(0, cursorPos - 1).trim();

      // Check if it matches a prefix
      const prefixToSymbol: { [key: string]: string } = {
        'e': '↹',
        't': '□',
        'r': '↻',
        '*': '↝',
      };

      if (prefixToSymbol[beforeSpace]) {
        // Replace prefix with symbol
        const symbol = prefixToSymbol[beforeSpace];
        const updatedValue = symbol + ' ' + newValue.substring(cursorPos);
        setEditContent(updatedValue);

        // Move cursor to after the symbol and space
        setTimeout(() => {
          const input = e.target;
          const newCursorPos = symbol.length + 1;
          input.selectionStart = input.selectionEnd = newCursorPos;
        }, 0);
        return;
      }
    }

    setEditContent(newValue);
  };

  // Handle keydown for backspace (revert symbol to prefix)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, itemId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(itemId);
      return;
    } else if (e.key === 'Escape') {
      handleCancelEdit();
      return;
    }

    const input = e.currentTarget;
    const { selectionStart, selectionEnd, value } = input;

    // Backspace: check if we need to revert symbol to prefix
    if (e.key === 'Backspace' && selectionStart === selectionEnd) {
      const charBeforeCursor = value[selectionStart! - 1];
      const charBeforeThat = value[selectionStart! - 2];

      // If we're deleting a space after a symbol, revert to prefix
      if (charBeforeCursor === ' ' && selectionStart! === 2) {
        const symbolToPrefix: { [key: string]: string } = {
          '↹': 'e',
          '□': 't',
          '☑': 't',
          '↻': 'r',
          '↝': '*',
        };

        if (charBeforeThat && symbolToPrefix[charBeforeThat]) {
          // Revert symbol + space to prefix
          e.preventDefault();
          const prefix = symbolToPrefix[charBeforeThat];
          const newValue = prefix + value.substring(selectionStart!);
          setEditContent(newValue);

          setTimeout(() => {
            input.selectionStart = input.selectionEnd = prefix.length;
          }, 0);
          return;
        }
      }
    }
  };

  const handleDelete = (itemId: string) => {
    if (confirm('Delete this item?')) {
      deleteItem(itemId);
    }
  };

  const renderEntry = (entry: TimelineEntry) => {
    const item = entry.item;

    if (entry.type === 'todo') {
      const todo = item as Todo;
      const isCompleted = todo.completedAt;
      const isEditing = editingItem === item.id;
      const isHovered = hoveredItem === item.id;

      return (
        <div
          className={`flex items-start gap-3 ${isCompleted ? 'opacity-40' : ''}`}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <button
            onClick={() => toggleTodoComplete(item.id)}
            className="text-base leading-book flex-shrink-0 cursor-pointer hover:opacity-70"
          >
            {isCompleted ? '☑' : '□'}
          </button>
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-8">
                <input
                  type="text"
                  value={editContent}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, item.id)}
                  className="flex-1 px-8 py-4 bg-hover-bg border border-border-subtle rounded-sm font-serif text-base"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit(item.id)}
                  className="text-sm text-text-secondary hover:text-text-primary"
                  title="Save (Enter)"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-sm text-text-secondary hover:text-text-primary"
                  title="Cancel (Esc)"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-8">
                <p className={`flex-1 text-base font-serif leading-book ${isCompleted ? 'line-through' : ''}`}>
                  {item.content}
                </p>
                {isHovered && (
                  <div className="flex gap-4 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(item.id, item)}
                      className="text-xs text-text-secondary hover:text-text-primary"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-text-secondary hover:text-text-primary"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
            {!isEditing && item.tags.length > 0 && (
              <div className="mt-2 text-xs text-text-secondary">
                {item.tags.map((tag) => (
                  <span key={tag} className="mr-6">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    } else if (entry.type === 'event-single') {
      const event = item as EventType;
      const startTime = format(new Date(event.startTime), 'h:mm a');
      const endTime = format(new Date(event.endTime), 'h:mm a');
      const isEditing = editingItem === item.id;
      const isHovered = hoveredItem === item.id;

      return (
        <div
          className="flex items-start gap-3"
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <span className="text-base leading-book flex-shrink-0">↹</span>
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-8">
                <input
                  type="text"
                  value={editContent}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, item.id)}
                  className="flex-1 px-8 py-4 bg-hover-bg border border-border-subtle rounded-sm font-serif text-base"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit(item.id)}
                  className="text-sm text-text-secondary hover:text-text-primary"
                  title="Save (Enter)"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-sm text-text-secondary hover:text-text-primary"
                  title="Cancel (Esc)"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-8">
                <p className="flex-1 text-base font-serif leading-book font-semibold">
                  {item.content} ({startTime} - {endTime})
                </p>
                {isHovered && (
                  <div className="flex gap-4 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(item.id, item)}
                      className="text-xs text-text-secondary hover:text-text-primary"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-text-secondary hover:text-text-primary"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
            {!isEditing && item.tags.length > 0 && (
              <div className="mt-2 text-xs text-text-secondary">
                {item.tags.map((tag) => (
                  <span key={tag} className="mr-6">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    } else if (entry.type === 'event-start') {
      const event = item as EventType;
      const startTime = format(new Date(event.startTime), 'h:mm a');
      const endTime = format(new Date(event.endTime), 'h:mm a');
      const isEditing = editingItem === item.id;
      const isHovered = hoveredItem === item.id;

      return (
        <div
          className="flex items-start gap-3"
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <span className="text-base leading-book flex-shrink-0">⇤</span>
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-8">
                <input
                  type="text"
                  value={editContent}
                  onChange={handleInputChange}
                  onKeyDown={(e) => handleKeyDown(e, item.id)}
                  className="flex-1 px-8 py-4 bg-hover-bg border border-border-subtle rounded-sm font-serif text-base"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit(item.id)}
                  className="text-sm text-text-secondary hover:text-text-primary"
                  title="Save (Enter)"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-sm text-text-secondary hover:text-text-primary"
                  title="Cancel (Esc)"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-8">
                <p className="flex-1 text-base font-serif leading-book font-semibold">
                  {item.content} ({startTime} - {endTime})
                </p>
                {isHovered && (
                  <div className="flex gap-4 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(item.id, item)}
                      className="text-xs text-text-secondary hover:text-text-primary"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-text-secondary hover:text-text-primary"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
            {!isEditing && item.tags.length > 0 && (
              <div className="mt-2 text-xs text-text-secondary">
                {item.tags.map((tag) => (
                  <span key={tag} className="mr-6">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // event-end
      return (
        <div className="flex items-start gap-3">
          <span className="text-base leading-book flex-shrink-0">⇥</span>
          <div className="flex-1">
            <p className="text-base font-serif leading-book font-semibold">
              {item.content} (end)
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Pane Header */}
      <div className="h-[36px] border-b border-border-subtle flex items-center px-24">
        <h2 className="text-xs font-serif uppercase tracking-wider">Time</h2>
      </div>

      {/* Timeline - Scrollable through all days */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto px-24 py-16 ${
          viewMode === 'infinite' ? 'snap-y snap-mandatory' : ''
        } ${
          isPageFlipping && viewMode === 'book' ? 'page-flip' : ''
        }`}
        style={viewMode === 'book' ? { height: 'calc(100vh - 60px - 90px)' } : undefined}
      >
        {/* Daily Review - appears at top (infinite mode only) */}
        {viewMode === 'infinite' && <DailyReview />}

        {(viewMode === 'book' && currentDate ? [currentDate] : dates).map((date) => {
          const entries = entriesByDate.get(date) || [];
          const isToday = date === today;

          if (viewMode === 'infinite' && entries.length === 0) {
            return null;
          }

          // Sort entries by time
          const sortedEntries = [...entries].sort((a, b) => a.time.getTime() - b.time.getTime());

          // Group by time
          const entriesByTime: { [timeKey: string]: TimelineEntry[] } = {};
          sortedEntries.forEach((entry) => {
            if (!entriesByTime[entry.timeKey]) {
              entriesByTime[entry.timeKey] = [];
            }
            entriesByTime[entry.timeKey].push(entry);
          });

          const times = Object.keys(entriesByTime).sort((a, b) => {
            const timeA = new Date(`1970-01-01 ${a}`);
            const timeB = new Date(`1970-01-01 ${b}`);
            return timeA.getTime() - timeB.getTime();
          });

          return (
            <div
              key={date}
              className={viewMode === 'infinite' ? 'mb-16 snap-start' : ''}
            >
              {/* Date Header */}
              <div className={`sticky top-0 bg-background py-3 mb-6 border-b border-border-subtle ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}>
                <h3 className="text-base font-serif uppercase tracking-wide">
                  {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                  {isToday && ' (Today)'}
                </h3>
              </div>

              {/* Items for this date */}
              {times.length === 0 ? (
                <div className="text-center text-text-secondary text-sm py-4">
                  <p>No scheduled items</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {times.map((time) => (
                    <div key={time}>
                      <div className="text-xs font-mono text-text-secondary mb-1">
                        {time}
                      </div>
                      <div className="space-y-3">
                        {entriesByTime[time].map((entry, idx) => (
                          <div key={`${entry.item.id}-${entry.type}-${idx}`}>
                            {renderEntry(entry)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimePane;
