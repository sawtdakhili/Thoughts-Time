import { useState, useEffect, useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../store/useSettingsStore';
import ItemDisplay from './ItemDisplay';
import TimePromptModal from './TimePromptModal';
import { Item } from '../types';
import { parseInput } from '../utils/parser';
import { symbolsToPrefix, formatTimeForDisplay, prefixToSymbol, symbolToPrefix as symbolToPrefixMap } from '../utils/formatting';
import { matchesSearch } from '../utils/search.tsx';
import { ANIMATION, DATE_RANGE } from '../constants';

interface ThoughtsPaneProps {
  searchQuery?: string;
  viewMode?: 'infinite' | 'book';
  currentDate?: string;
  onNextDay?: () => void;
  onPreviousDay?: () => void;
  highlightedItemId?: string | null;
}

export interface ThoughtsPaneHandle {
  scrollToDate: (date: string) => void;
}

const ThoughtsPane = forwardRef<ThoughtsPaneHandle, ThoughtsPaneProps>(({
  searchQuery = '',
  viewMode = 'infinite',
  currentDate,
  onNextDay,
  onPreviousDay,
  highlightedItemId,
}, ref) => {
  const [input, setInput] = useState('');
  const addItem = useStore((state) => state.addItem);
  const items = useStore((state) => state.items);
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [timePrompt, setTimePrompt] = useState<{ line: string; index: number; isEvent: boolean } | null>(null);
  const [isPageFlipping, setIsPageFlipping] = useState(false);
  const lastScrollTop = useRef(0);
  const isTransitioning = useRef(false);
  const wheelDeltaY = useRef(0);

  // Filter items based on search query (memoized for performance)
  const filteredItems = useMemo(() =>
    searchQuery
      ? items.filter(item => matchesSearch(item, searchQuery, items))
      : items,
    [items, searchQuery]
  );

  // Compute items grouped by date (memoized for performance)
  const itemsByDate = useMemo(() => {
    const map = new Map<string, Item[]>();
    filteredItems.forEach((item) => {
      const date = item.createdDate;
      if (!map.has(date)) {
        map.set(date, []);
      }
      map.get(date)!.push(item);
    });
    return map;
  }, [filteredItems]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Generate date range: past to future days
  const today = format(new Date(), 'yyyy-MM-dd');
  const dates: string[] = [];

  for (let i = -DATE_RANGE.PAST_DAYS; i <= DATE_RANGE.FUTURE_DAYS; i++) {
    const date = i === 0
      ? new Date()
      : i < 0
        ? subDays(new Date(), Math.abs(i))
        : addDays(new Date(), i);
    dates.push(format(date, 'yyyy-MM-dd'));
  }

  // Filter dates for infinite scroll mode - only show dates with items (plus today)
  const visibleDates = useMemo(() => {
    if (viewMode === 'book') {
      return currentDate ? [currentDate] : dates;
    }
    // In infinite mode, filter out empty dates except today
    return dates.filter(date => {
      const dateItems = itemsByDate.get(date) || [];
      return dateItems.length > 0 || date === today;
    });
  }, [viewMode, currentDate, dates, itemsByDate, today]);

  // Find index of today for initial scroll
  const todayIndex = useMemo(() => {
    return visibleDates.findIndex(date => date === today);
  }, [visibleDates, today]);

  // Estimate height based on items - each item is ~60px, header is ~50px
  const estimateSize = useCallback((index: number) => {
    const date = visibleDates[index];
    const dateItems = itemsByDate.get(date) || [];
    const topLevelItems = dateItems.filter(item => !item.parentId).length;

    // Base: header (50px) + padding (40px)
    // Per item: ~70px (includes spacing)
    // Empty day: ~60px
    const baseHeight = 90;
    const perItem = 70;
    const emptyHeight = topLevelItems === 0 ? 60 : 0;

    return baseHeight + (topLevelItems * perItem) + emptyHeight;
  }, [visibleDates, itemsByDate]);

  // Virtualizer for infinite scroll mode
  const virtualizer = useVirtualizer({
    count: visibleDates.length,
    getScrollElement: () => scrollRef.current,
    estimateSize,
    overscan: 3,
  });

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    scrollToDate: (date: string) => {
      const dateIndex = visibleDates.findIndex(d => d === date);
      if (dateIndex >= 0) {
        virtualizer.scrollToIndex(dateIndex, { align: 'start' });
      }
    },
  }), [visibleDates, virtualizer]);

  // Auto-scroll to today on mount for infinite mode
  useEffect(() => {
    if (scrollRef.current && viewMode === 'infinite' && todayIndex >= 0) {
      virtualizer.scrollToIndex(todayIndex, { align: 'end' });
    }
  }, [todayIndex, viewMode, virtualizer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Check if a space was just added
    if (newValue.length > input.length && newValue[cursorPos - 1] === ' ') {
      // Find the start of the current line
      const lineStart = newValue.lastIndexOf('\n', cursorPos - 2) + 1;
      const beforeSpace = newValue.substring(lineStart, cursorPos - 1).trim();

      // Check if it matches a prefix
      if (prefixToSymbol[beforeSpace]) {
        // Replace prefix with symbol
        const symbol = prefixToSymbol[beforeSpace];
        const leadingSpaces = newValue.substring(lineStart, cursorPos - 1).match(/^\s*/)?.[0] || '';
        const updatedValue =
          newValue.substring(0, lineStart) +
          leadingSpaces +
          symbol +
          ' ' +
          newValue.substring(cursorPos);

        setInput(updatedValue);

        // Move cursor to after the symbol and space
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPos = lineStart + leadingSpaces.length + symbol.length + 1;
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
          }
        }, 0);
        return;
      }
    }

    setInput(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

    // Backspace: check if we need to revert symbol to prefix
    if (e.key === 'Backspace' && selectionStart === selectionEnd) {
      const charBeforeCursor = value[selectionStart - 1];
      const charBeforeThat = value[selectionStart - 2];

      // If we're deleting a space after a symbol, revert to prefix
      if (charBeforeCursor === ' ') {
        if (charBeforeThat && symbolToPrefixMap[charBeforeThat]) {
          // Check if the symbol is at the start of a line
          const lineStart = value.lastIndexOf('\n', selectionStart - 3) + 1;
          const beforeSymbol = value.substring(lineStart, selectionStart - 2).trim();

          if (beforeSymbol === '') {
            // Revert symbol + space to prefix + space, then remove space
            e.preventDefault();
            const prefix = symbolToPrefixMap[charBeforeThat];
            const newValue =
              value.substring(0, selectionStart - 2) +
              prefix +
              value.substring(selectionStart);
            setInput(newValue);

            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = selectionStart - 1;
            }, 0);
            return;
          }
        }
      }
    }

    // Tab: insert indentation (2 spaces)
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const newValue = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
      setInput(newValue);

      // Move cursor after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
      }, 0);
      return;
    }

    // Shift+Tab: remove indentation from current line
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();

      // Find start of current line
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const lineText = value.substring(lineStart, selectionStart);

      // Check if line starts with 2 spaces
      if (lineText.startsWith('  ')) {
        const newValue = value.substring(0, lineStart) + value.substring(lineStart + 2);
        setInput(newValue);

        // Move cursor back 2 positions
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, selectionStart - 2);
        }, 0);
      }
      return;
    }

    // Regular Enter: submit (Shift+Enter adds newline naturally)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e: React.FormEvent | React.KeyboardEvent, inputOverride?: string) => {
    e.preventDefault();
    const inputToProcess = inputOverride ?? input;
    if (inputToProcess.trim()) {
      const lines = inputToProcess.split('\n');

      // First pass: check if any line needs time prompt
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const contentWithoutIndent = line.trimStart();
        // Convert symbols back to prefixes before parsing
        const contentWithPrefix = symbolsToPrefix(contentWithoutIndent);
        const parsed = parseInput(contentWithPrefix);

        if (parsed.needsTimePrompt) {
          // Show time prompt for this line
          setTimePrompt({
            line: contentWithoutIndent,
            index: i,
            isEvent: parsed.type === 'event'
          });
          return;
        }
      }

      // If we get here, no prompts needed - create all items
      createItems(inputOverride);
    }
  };

  const createItems = (inputOverride?: string) => {
    const inputToProcess = inputOverride ?? input;
    const lines = inputToProcess.split('\n');
    const itemStack: Array<{ id: string; level: number }> = [];

    lines.forEach((line) => {
      if (!line.trim()) return; // Skip empty lines

      // Detect indentation level (2 spaces = 1 level)
      const leadingSpaces = line.match(/^(\s*)/)?.[0].length || 0;
      const indentLevel = Math.floor(leadingSpaces / 2);
      const contentWithoutIndent = line.trimStart();
      // Convert symbols back to prefixes before parsing
      const contentWithPrefix = symbolsToPrefix(contentWithoutIndent);

      // Find parent based on indent level
      let parentId: string | null = null;
      if (indentLevel > 0) {
        // Find the closest parent at indentLevel - 1
        for (let i = itemStack.length - 1; i >= 0; i--) {
          if (itemStack[i].level === indentLevel - 1) {
            parentId = itemStack[i].id;
            break;
          }
        }
      }

      // Create item with detected parent and depth
      const newItemId = addItem(contentWithPrefix, parentId, indentLevel);

      // Update stack
      // Remove items at same or deeper level
      while (itemStack.length > 0 && itemStack[itemStack.length - 1].level >= indentLevel) {
        itemStack.pop();
      }
      // Add this item to stack
      itemStack.push({ id: newItemId, level: indentLevel });
    });

    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
    }

    // Scroll to bottom after adding item
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };


  const handleTimePromptCancel = () => {
    setTimePrompt(null);
  };


  const handleWheel = (e: WheelEvent) => {
    if (!scrollRef.current || viewMode !== 'book' || !onNextDay || !onPreviousDay || isTransitioning.current) return;

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

  const handleTimePromptModalSubmit = (time: string, endTime?: string) => {
    if (!timePrompt) return;

    // Update the line with the time(s)
    const lines = input.split('\n');
    let updatedLine: string;

    if (timePrompt.isEvent && endTime) {
      updatedLine = lines[timePrompt.index].trimStart() + ' from ' + formatTimeForDisplay(time, timeFormat) + ' to ' + formatTimeForDisplay(endTime, timeFormat);
    } else {
      updatedLine = lines[timePrompt.index].trimStart() + ' at ' + formatTimeForDisplay(time, timeFormat);
    }

    const leadingSpaces = lines[timePrompt.index].match(/^(\s*)/)?.[0] || '';
    lines[timePrompt.index] = leadingSpaces + updatedLine;

    const newInput = lines.join('\n');
    setInput(newInput);
    setTimePrompt(null);

    // Re-submit after a brief delay with the new input value
    // (can't rely on state due to closure capturing old value)
    setTimeout(() => {
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(syntheticEvent, newInput);
    }, 50);
  };

  return (
    <div className="h-full flex flex-col">
      <TimePromptModal
        isOpen={!!timePrompt}
        isEvent={timePrompt?.isEvent || false}
        content={timePrompt?.line || ''}
        timeFormat={timeFormat}
        onSubmit={handleTimePromptModalSubmit}
        onCancel={handleTimePromptCancel}
      />

      {/* Items Area - Scrollable through all days */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto px-24 py-16 ${
          viewMode === 'book' ? 'snap-y snap-proximity' : ''
        } ${
          isPageFlipping && viewMode === 'book' ? 'page-flip-left' : ''
        }`}
        style={viewMode === 'book' ? { height: 'calc(100vh - 60px - 90px)' } : undefined}
      >
        {/* No results found state */}
        {searchQuery && itemsByDate.size === 0 && (
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
              const dateItems = itemsByDate.get(date) || [];
              const isToday = date === today;

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
                  <div className={`sticky top-0 bg-background py-3 mb-6 border-b border-border-subtle ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}>
                    <h3 className="text-base font-serif uppercase tracking-wide">
                      {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                      {isToday && ' (Today)'}
                    </h3>
                  </div>

                  {/* Items for this date */}
                  {dateItems.length === 0 ? (
                    <div className="text-center text-text-secondary text-sm py-4">
                      <p>Nothing captured yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {dateItems.filter(item => !item.parentId).map((item) => (
                        <ItemDisplay
                          key={item.id}
                          item={item}
                          sourcePane="thoughts"
                          searchQuery={searchQuery}
                          highlightedItemId={highlightedItemId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Non-virtualized list for book mode */}
        {viewMode === 'book' && visibleDates.map((date) => {
          const dateItems = itemsByDate.get(date) || [];
          const isToday = date === today;

          // Hide empty days in book mode when searching
          if (dateItems.length === 0 && !isToday && searchQuery) {
            return null;
          }

          return (
            <div
              key={date}
              className="snap-start snap-always"
            >
              {/* Date Header */}
              <div className={`sticky top-0 bg-background py-3 mb-6 border-b border-border-subtle ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}>
                <h3 className="text-base font-serif uppercase tracking-wide">
                  {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                  {isToday && ' (Today)'}
                </h3>
              </div>

              {/* Items for this date */}
              {dateItems.length === 0 ? (
                <div className="text-center text-text-secondary text-sm py-4">
                  <p>Nothing captured yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {dateItems.filter(item => !item.parentId).map((item) => (
                    <ItemDisplay
                      key={item.id}
                      item={item}
                      sourcePane="thoughts"
                      searchQuery={searchQuery}
                      highlightedItemId={highlightedItemId}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input Field - Fixed at Bottom */}
      <form onSubmit={handleSubmit} className="border-t border-border-subtle">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type here... (Tab to indent, Shift+Enter for new line)"
          className="w-full min-h-[56px] max-h-[200px] py-16 px-24 bg-transparent border-none outline-none font-serif text-base placeholder-text-secondary resize-none overflow-y-auto"
          rows={1}
          autoFocus
        />
      </form>
    </div>
  );
});

ThoughtsPane.displayName = 'ThoughtsPane';

export default ThoughtsPane;
