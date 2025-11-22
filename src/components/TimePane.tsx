import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../store/useSettingsStore';
import DailyReview from './DailyReview';
import TimePromptModal from './TimePromptModal';
import ConfirmDialog from './ConfirmDialog';
import EditEntryInput from './EditEntryInput';
import { Item, Todo, Event as EventType, Routine } from '../types';
import { parseInput } from '../utils/parser';
import { createItem } from '../utils/itemFactory';
import {
  symbolsToPrefix,
  formatTimeForDisplay,
  prefixToSymbol,
  symbolToPrefix,
} from '../utils/formatting';
import { matchesSearch, highlightMatches } from '../utils/search.tsx';
import { ANIMATION, DATE_RANGE } from '../constants';

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
  onJumpToSource?: (item: Item) => void;
}

function TimePane({
  searchQuery = '',
  viewMode = 'infinite',
  currentDate,
  onNextDay,
  onPreviousDay,
  onJumpToSource,
}: TimePaneProps) {
  const items = useStore((state) => state.items);
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const toggleTodoComplete = useStore((state) => state.toggleTodoComplete);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Helper function to format Date object to time string based on setting
  const formatTime = (date: Date): string => {
    if (timeFormat === '24h') {
      return format(date, 'HH:mm');
    }
    return format(date, 'h:mm a');
  };
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isPageFlipping, setIsPageFlipping] = useState(false);
  const lastScrollTop = useRef(0);
  const isTransitioning = useRef(false);
  const wheelDeltaY = useRef(0);
  const [timePrompt, setTimePrompt] = useState<{
    content: string;
    isEvent: boolean;
    itemId: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; itemId: string | null }>({
    isOpen: false,
    itemId: null,
  });

  // Filter items based on search query
  const filteredItems = useMemo(
    () => (searchQuery ? items.filter((item) => matchesSearch(item, searchQuery, items)) : items),
    [items, searchQuery]
  );

  // Collect all scheduled todos for checking event overlaps (memoized for performance)
  // Use ALL items (not filtered) to ensure split detection works during search
  const scheduledTodos = useMemo(() => {
    const todos: Array<{ time: Date; item: Todo }> = [];
    items.forEach((item) => {
      if (item.type === 'todo') {
        const todo = item as Todo;
        if (todo.scheduledTime) {
          todos.push({ time: new Date(todo.scheduledTime), item: todo });
        }
      }
    });
    return todos;
  }, [items]);

  // Compute timeline entries grouped by date (memoized for performance)
  const entriesByDate = useMemo(() => {
    const map = new Map<string, TimelineEntry[]>();

    // Helper function to check if event has items within its timeframe
    const hasItemsWithinEvent = (event: EventType): boolean => {
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      return scheduledTodos.some(({ time }) => time > startTime && time < endTime);
    };

    // Process all filtered items
    filteredItems.forEach((item) => {
      if (item.type === 'todo') {
        const todo = item as Todo;
        if (todo.scheduledTime) {
          const dateKey = format(new Date(todo.scheduledTime), 'yyyy-MM-dd');
          if (!map.has(dateKey)) {
            map.set(dateKey, []);
          }
          map.get(dateKey)!.push({
            time: new Date(todo.scheduledTime),
            timeKey: formatTime(new Date(todo.scheduledTime)),
            type: 'todo',
            item,
          });
        }
      } else if (item.type === 'event') {
        const event = item as EventType;
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);
        const dateKey = format(startTime, 'yyyy-MM-dd');

        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }

        // Check if event should be split
        if (hasItemsWithinEvent(event)) {
          // Split event: add start and end markers
          map.get(dateKey)!.push({
            time: startTime,
            timeKey: formatTime(startTime),
            type: 'event-start',
            item,
          });

          map.get(dateKey)!.push({
            time: endTime,
            timeKey: formatTime(endTime),
            type: 'event-end',
            item,
          });
        } else {
          // Single event: no split
          map.get(dateKey)!.push({
            time: startTime,
            timeKey: formatTime(startTime),
            type: 'event-single',
            item,
          });
        }
      }
    });

    return map;
  }, [filteredItems, scheduledTodos, timeFormat]);

  // Generate date range: past to future days (memoized to prevent recreation)
  const today = format(new Date(), 'yyyy-MM-dd');
  const dates = useMemo(() => {
    const result: string[] = [];
    for (let i = -DATE_RANGE.PAST_DAYS; i <= DATE_RANGE.FUTURE_DAYS; i++) {
      const date =
        i === 0 ? new Date() : i < 0 ? subDays(new Date(), Math.abs(i)) : addDays(new Date(), i);
      result.push(format(date, 'yyyy-MM-dd'));
    }
    return result;
  }, []);

  // Filter dates for infinite scroll mode - only show dates with items (plus today)
  const visibleDates = useMemo(() => {
    if (viewMode === 'book') {
      return currentDate ? [currentDate] : dates;
    }
    // In infinite mode, filter out empty dates except today
    return dates.filter((date) => {
      const entries = entriesByDate.get(date) || [];
      return entries.length > 0 || date === today;
    });
  }, [viewMode, currentDate, dates, entriesByDate, today]);

  // Find index of today for initial scroll
  const todayIndex = useMemo(() => {
    return visibleDates.findIndex((date) => date === today);
  }, [visibleDates, today]);

  // Estimate height based on entries - each time slot is ~60px, header is ~50px
  const estimateSize = useCallback(
    (index: number) => {
      const date = visibleDates[index];
      const entries = entriesByDate.get(date) || [];
      const isToday = date === today;

      // Group entries by time to count time slots
      const timeSlots = new Set(entries.map((e) => e.timeKey)).size;

      // Base: header (50px) + padding (40px)
      // Per time slot: ~80px (time label + items)
      // Daily review for today: ~100px
      // Empty day: ~60px
      const baseHeight = 90;
      const perSlot = 80;
      const dailyReview = isToday ? 100 : 0;
      const emptyHeight = timeSlots === 0 ? 60 : 0;

      return baseHeight + timeSlots * perSlot + dailyReview + emptyHeight;
    },
    [visibleDates, entriesByDate, today]
  );

  // Virtualizer for infinite scroll mode
  const virtualizer = useVirtualizer({
    count: visibleDates.length,
    getScrollElement: () => scrollRef.current,
    estimateSize,
    overscan: 3,
  });

  // Auto-scroll to today on mount
  useEffect(() => {
    if (scrollRef.current && viewMode === 'infinite' && todayIndex >= 0) {
      // Use virtualizer to scroll to today
      virtualizer.scrollToIndex(todayIndex, { align: 'start' });
    }
  }, [todayIndex, viewMode, virtualizer]);

  const handleWheel = (e: WheelEvent) => {
    if (
      !scrollRef.current ||
      viewMode !== 'book' ||
      !onNextDay ||
      !onPreviousDay ||
      isTransitioning.current
    )
      return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isScrollable = scrollHeight > clientHeight;

    // Detect if we're at boundaries
    const atBottom = scrollTop + clientHeight >= scrollHeight - 5;
    const atTop = scrollTop <= 5;

    // For non-scrollable content OR at boundaries, use wheel delta accumulation
    if (!isScrollable || atBottom || atTop) {
      wheelDeltaY.current += e.deltaY;

      // Threshold to prevent accidental triggers - requires intentional over-scroll
      if (wheelDeltaY.current > ANIMATION.WHEEL_DELTA_THRESHOLD) {
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
            }, ANIMATION.PAGE_FLIP_DURATION);
          }, ANIMATION.SCROLL_RESET_DELAY);
        }, ANIMATION.SCROLL_RESET_DELAY);
      } else if (wheelDeltaY.current < -ANIMATION.WHEEL_DELTA_THRESHOLD) {
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
            }, ANIMATION.PAGE_FLIP_DURATION);
          }, ANIMATION.SCROLL_RESET_DELAY);
        }, ANIMATION.SCROLL_RESET_DELAY);
      }
    } else {
      // Reset delta when scrolling normally (not at boundaries)
      wheelDeltaY.current = 0;
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop } = scrollRef.current;

    // Track scroll position for reference
    lastScrollTop.current = scrollTop;
  };

  // Add wheel event listener for non-scrollable content
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl && viewMode === 'book') {
      scrollEl.addEventListener('wheel', handleWheel as EventListener);
      return () => scrollEl.removeEventListener('wheel', handleWheel as EventListener);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, onNextDay, onPreviousDay]);

  // Get symbol for item type
  const getSymbol = (item: Item) => {
    switch (item.type) {
      case 'todo': {
        const todo = item as Todo;
        return todo.completedAt ? '☑' : '□';
      }
      case 'event':
        return '↹';
      case 'routine':
        return '↻';
      case 'note':
        return '↝';
      default:
        return '';
    }
  };

  const handleEdit = (itemId: string, item: Item) => {
    const symbol = getSymbol(item);
    setEditingItem(itemId);
    if (symbol && item.type !== 'note') {
      // For todos, events, routines: show symbol
      setEditContent(`${symbol} ${item.content}`);
    } else {
      // For notes: no prefix or symbol
      setEditContent(item.content);
    }
  };

  const handleSaveEdit = (itemId: string) => {
    const currentItem = items.find((i) => i.id === itemId);
    if (!editContent.trim() || !currentItem) {
      setEditingItem(null);
      setEditContent('');
      return;
    }

    // Convert symbols back to prefixes before parsing
    const contentWithPrefix = symbolsToPrefix(editContent.trim());

    // Re-parse the full line (with prefix) to detect type changes
    const parsed = parseInput(contentWithPrefix);

    // Check if time prompt is needed
    if (parsed.needsTimePrompt) {
      setTimePrompt({
        content: editContent.trim(),
        isEvent: parsed.type === 'event',
        itemId: itemId,
      });
      return;
    }

    // If type changed, delete old item and create new one
    if (parsed.type !== currentItem.type) {
      // Create new item with parsed data, preserving original creation time
      const newItemData = createItem({
        content: parsed.content,
        createdAt: currentItem.createdAt,
        createdDate: currentItem.createdDate,
        parsed,
        userId: currentItem.userId,
      });

      // Delete old and add new
      const addItemDirect = useStore.getState().addItemDirect;
      deleteItem(itemId);
      addItemDirect({ ...newItemData, id: itemId });
    } else {
      // Same type, just update
      const updates: Partial<Item> = { content: parsed.content };

      if (currentItem.type === 'todo') {
        Object.assign(updates, {
          scheduledTime:
            parsed.scheduledTime !== null
              ? parsed.scheduledTime
              : (currentItem as Todo).scheduledTime,
          hasTime: parsed.hasTime,
        });
      } else if (currentItem.type === 'event') {
        Object.assign(updates, {
          startTime: parsed.scheduledTime || (currentItem as EventType).startTime,
          endTime: parsed.endTime || parsed.scheduledTime || (currentItem as EventType).endTime,
          hasTime: parsed.hasTime,
        });
      } else if (currentItem.type === 'routine') {
        Object.assign(updates, {
          scheduledTime: parsed.scheduledTime
            ? format(parsed.scheduledTime, 'HH:mm')
            : (currentItem as Routine).scheduledTime,
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

  const handleTimePromptCancel = () => {
    setTimePrompt(null);
  };

  // Handle input change with symbol conversion
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    // Check if a space was just added
    if (newValue.length > editContent.length && newValue[cursorPos - 1] === ' ') {
      const beforeSpace = newValue.substring(0, cursorPos - 1).trim();

      // Check if it matches a prefix
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
    setConfirmDelete({ isOpen: true, itemId });
  };

  const handleConfirmDelete = () => {
    if (confirmDelete.itemId) {
      deleteItem(confirmDelete.itemId);
    }
    setConfirmDelete({ isOpen: false, itemId: null });
  };

  const renderEntry = (entry: TimelineEntry) => {
    const item = entry.item;

    if (entry.type === 'todo') {
      const todo = item as Todo;
      const isCompleted = todo.completedAt;
      const isEditing = editingItem === item.id;
      const isHovered = hoveredItem === item.id;

      return (
        <div onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem(null)}>
          {isEditing ? (
            <EditEntryInput
              value={editContent}
              onChange={handleInputChange}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              onSave={() => handleSaveEdit(item.id)}
              onCancel={handleCancelEdit}
            />
          ) : (
            <div className={`flex items-start gap-3 ${isCompleted ? 'opacity-40' : ''}`}>
              <button
                onClick={() => toggleTodoComplete(item.id)}
                className="text-base leading-book flex-shrink-0 cursor-pointer hover:opacity-70"
              >
                {isCompleted ? '☑' : '□'}
              </button>
              <div className="flex-1">
                <div className="flex items-start gap-8">
                  <p
                    className={`flex-1 text-base font-serif leading-book ${isCompleted ? 'line-through' : ''}`}
                  >
                    {searchQuery ? highlightMatches(item.content, searchQuery) : item.content}
                  </p>
                  {isHovered && (
                    <div className="flex gap-4 flex-shrink-0">
                      {onJumpToSource && (
                        <button
                          onClick={() => onJumpToSource(item)}
                          className="text-xs text-text-secondary hover:text-text-primary"
                          title="Jump to source"
                        >
                          ↸
                        </button>
                      )}
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
              </div>
            </div>
          )}
        </div>
      );
    } else if (entry.type === 'event-single') {
      const event = item as EventType;
      const startTime = formatTime(new Date(event.startTime));
      const endTime = formatTime(new Date(event.endTime));
      const isEditing = editingItem === item.id;
      const isHovered = hoveredItem === item.id;

      return (
        <div onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem(null)}>
          {isEditing ? (
            <EditEntryInput
              value={editContent}
              onChange={handleInputChange}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              onSave={() => handleSaveEdit(item.id)}
              onCancel={handleCancelEdit}
            />
          ) : (
            <div className="flex items-start gap-3">
              <span className="text-base leading-book flex-shrink-0">↹</span>
              <div className="flex-1">
                <div className="flex items-start gap-8">
                  <p className="flex-1 text-base font-serif leading-book font-semibold">
                    {searchQuery ? highlightMatches(item.content, searchQuery) : item.content} (
                    {startTime} - {endTime})
                  </p>
                  {isHovered && (
                    <div className="flex gap-4 flex-shrink-0">
                      {onJumpToSource && (
                        <button
                          onClick={() => onJumpToSource(item)}
                          className="text-xs text-text-secondary hover:text-text-primary"
                          title="Jump to source"
                        >
                          ↸
                        </button>
                      )}
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
              </div>
            </div>
          )}
        </div>
      );
    } else if (entry.type === 'event-start') {
      const event = item as EventType;
      const startTime = formatTime(new Date(event.startTime));
      const endTime = formatTime(new Date(event.endTime));
      const isEditing = editingItem === item.id;
      const isHovered = hoveredItem === item.id;

      return (
        <div onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem(null)}>
          {isEditing ? (
            <EditEntryInput
              value={editContent}
              onChange={handleInputChange}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              onSave={() => handleSaveEdit(item.id)}
              onCancel={handleCancelEdit}
            />
          ) : (
            <div className="flex items-start gap-3">
              <span className="text-base leading-book flex-shrink-0">⇤</span>
              <div className="flex-1">
                <div className="flex items-start gap-8">
                  <p className="flex-1 text-base font-serif leading-book font-semibold">
                    {searchQuery ? highlightMatches(item.content, searchQuery) : item.content} (
                    {startTime} - {endTime})
                  </p>
                  {isHovered && (
                    <div className="flex gap-4 flex-shrink-0">
                      {onJumpToSource && (
                        <button
                          onClick={() => onJumpToSource(item)}
                          className="text-xs text-text-secondary hover:text-text-primary"
                          title="Jump to source"
                        >
                          ↸
                        </button>
                      )}
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
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // event-end - simplified display, no edit/delete (use start marker for that)
      return (
        <div className="flex items-start gap-3 opacity-60">
          <span className="text-base leading-book flex-shrink-0">⇥</span>
          <p className="text-base font-serif leading-book">{item.content} (end)</p>
        </div>
      );
    }
  };

  const handleTimePromptModalSubmit = (time: string, endTime?: string) => {
    if (!timePrompt) return;

    const currentItem = items.find((i) => i.id === timePrompt.itemId);
    if (!currentItem) return;

    let updatedContent: string;
    if (timePrompt.isEvent && endTime) {
      updatedContent =
        timePrompt.content +
        ' from ' +
        formatTimeForDisplay(time, timeFormat) +
        ' to ' +
        formatTimeForDisplay(endTime, timeFormat);
    } else {
      updatedContent = timePrompt.content + ' at ' + formatTimeForDisplay(time, timeFormat);
    }

    const contentWithPrefix = symbolsToPrefix(updatedContent);
    const parsed = parseInput(contentWithPrefix);

    if (parsed.type !== currentItem.type) {
      const newItemData = createItem({
        content: parsed.content,
        createdAt: currentItem.createdAt,
        createdDate: currentItem.createdDate,
        parsed,
        userId: currentItem.userId,
      });

      const addItemDirect = useStore.getState().addItemDirect;
      deleteItem(timePrompt.itemId);
      addItemDirect({ ...newItemData, id: timePrompt.itemId });
    } else {
      const updates: Partial<Item> = { content: parsed.content };

      if (currentItem.type === 'todo') {
        Object.assign(updates, {
          scheduledTime:
            parsed.scheduledTime !== null
              ? parsed.scheduledTime
              : (currentItem as Todo).scheduledTime,
          hasTime: parsed.hasTime,
        });
      } else if (currentItem.type === 'event') {
        Object.assign(updates, {
          startTime: parsed.scheduledTime || (currentItem as EventType).startTime,
          endTime: parsed.endTime || parsed.scheduledTime || (currentItem as EventType).endTime,
          hasTime: parsed.hasTime,
        });
      } else if (currentItem.type === 'routine') {
        Object.assign(updates, {
          scheduledTime: parsed.scheduledTime
            ? format(parsed.scheduledTime, 'HH:mm')
            : (currentItem as Routine).scheduledTime,
          hasTime: parsed.hasTime,
          recurrencePattern: parsed.recurrencePattern || (currentItem as Routine).recurrencePattern,
        });
      }

      updateItem(timePrompt.itemId, updates);
    }

    setTimePrompt(null);
    setEditingItem(null);
    setEditContent('');
  };

  return (
    <>
      <TimePromptModal
        isOpen={!!timePrompt}
        isEvent={timePrompt?.isEvent || false}
        content={timePrompt?.content || ''}
        timeFormat={timeFormat}
        onSubmit={handleTimePromptModalSubmit}
        onCancel={handleTimePromptCancel}
      />

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, itemId: null })}
      />

      <div className="h-full flex flex-col">
        {/* Timeline - Scrollable through all days */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto px-24 py-16 ${
            viewMode === 'book' ? 'snap-y snap-proximity' : ''
          } ${isPageFlipping && viewMode === 'book' ? 'page-flip' : ''}`}
          style={viewMode === 'book' ? { height: 'calc(100vh - 60px - 90px)' } : undefined}
        >
          {/* No results found state */}
          {searchQuery && entriesByDate.size === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
              <p className="text-lg font-serif mb-2">No results found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}

          {/* Virtualized list for infinite mode */}
          {viewMode === 'infinite' && visibleDates.length > 0 && (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const date = visibleDates[virtualRow.index];
                const entries = entriesByDate.get(date) || [];
                const isToday = date === today;

                // Sort entries by time
                const sortedEntries = [...entries].sort(
                  (a, b) => a.time.getTime() - b.time.getTime()
                );

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
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="pb-16"
                  >
                    {/* Date Header */}
                    <div
                      className={`sticky top-0 bg-background py-3 mb-6 border-b border-border-subtle ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}
                    >
                      <h3 className="text-base font-serif uppercase tracking-wide">
                        {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                        {isToday && ' (Today)'}
                      </h3>
                    </div>

                    {/* Daily Review - appears under current day title */}
                    {isToday && (
                      <div className="mb-8">
                        <DailyReview searchQuery={searchQuery} />
                        <div className="mt-8 border-t border-border-subtle" />
                      </div>
                    )}

                    {/* Items for this date */}
                    {times.length === 0 ? (
                      <div className="text-center text-text-secondary text-sm py-4">
                        <p>No scheduled items</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {times.map((time) => (
                          <div key={time}>
                            <div className="text-xs font-mono text-text-secondary mb-1">{time}</div>
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
          )}

          {/* Non-virtualized list for book mode */}
          {viewMode === 'book' &&
            visibleDates.map((date) => {
              const entries = entriesByDate.get(date) || [];
              const isToday = date === today;

              // Hide empty days in book mode when searching
              if (entries.length === 0 && !isToday && searchQuery) {
                return null;
              }

              // Sort entries by time
              const sortedEntries = [...entries].sort(
                (a, b) => a.time.getTime() - b.time.getTime()
              );

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
                <div key={date} className="snap-start snap-always">
                  {/* Date Header */}
                  <div
                    className={`sticky top-0 bg-background py-3 mb-6 border-b border-border-subtle ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}
                  >
                    <h3 className="text-base font-serif uppercase tracking-wide">
                      {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                      {isToday && ' (Today)'}
                    </h3>
                  </div>

                  {/* Daily Review - appears under current day title in book mode */}
                  {isToday && (
                    <div className="mb-8 border border-border-subtle rounded-sm p-16 bg-hover-bg">
                      <DailyReview searchQuery={searchQuery} />
                    </div>
                  )}

                  {/* Items for this date */}
                  {times.length === 0 ? (
                    <div className="text-center text-text-secondary text-sm py-4">
                      <p>No scheduled items</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {times.map((time) => (
                        <div key={time}>
                          <div className="text-xs font-mono text-text-secondary mb-1">{time}</div>
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
    </>
  );
}

export default TimePane;
