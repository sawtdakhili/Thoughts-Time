import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../store/useSettingsStore';
import ItemDisplay from './ItemDisplay';
import TimePromptModal from './TimePromptModal';
import FAB from './FAB';
import BottomSheet from './BottomSheet';
import { Item } from '../types';
import { parseInput } from '../utils/parser';
import {
  formatTimeForDisplay,
  prefixToSymbol,
  convertToParserFormat,
  symbolsToPrefix,
  symbolToPrefix as symbolToPrefixMap,
} from '../utils/formatting';
import { matchesSearch } from '../utils/search.tsx';
import { useWheelNavigation } from '../hooks/useWheelNavigation';
import { useToast } from '../hooks/useToast';
import { DATE_RANGE, MOBILE } from '../constants';

interface ThoughtsPaneProps {
  searchQuery?: string;
  viewMode?: 'infinite' | 'book';
  currentDate?: string;
  onNextDay?: () => void;
  onPreviousDay?: () => void;
  highlightedItemId?: string | null;
  isMobile?: boolean;
}

export interface ThoughtsPaneHandle {
  scrollToDate: (date: string) => void;
}

const ThoughtsPane = forwardRef<ThoughtsPaneHandle, ThoughtsPaneProps>(
  (
    {
      searchQuery = '',
      viewMode = 'infinite',
      currentDate,
      onNextDay,
      onPreviousDay,
      highlightedItemId,
      isMobile = false,
    },
    ref
  ) => {
    const [input, setInput] = useState('');
    const addItems = useStore((state) => state.addItems);
    const items = useStore((state) => state.items);
    const timeFormat = useSettingsStore((state) => state.timeFormat);
    const { addToast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [timePrompt, setTimePrompt] = useState<{
      line: string;
      index: number;
      isEvent: boolean;
    } | null>(null);
    const [isPageFlipping, setIsPageFlipping] = useState(false);
    const [isInputSheetOpen, setIsInputSheetOpen] = useState(false);

    // Filter items based on search query (memoized for performance)
    const filteredItems = useMemo(
      () => (searchQuery ? items.filter((item) => matchesSearch(item, searchQuery, items)) : items),
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
        const dateItems = itemsByDate.get(date) || [];
        return dateItems.length > 0 || date === today;
      });
    }, [viewMode, currentDate, dates, itemsByDate, today]);

    // Find index of today for initial scroll
    const todayIndex = useMemo(() => {
      return visibleDates.findIndex((date) => date === today);
    }, [visibleDates, today]);

    // Estimate height based on items - each item is ~60px, header is ~50px
    const estimateSize = useCallback(
      (index: number) => {
        const date = visibleDates[index];
        const dateItems = itemsByDate.get(date) || [];
        const topLevelItems = dateItems.filter((item) => !item.parentId).length;

        // Base: header (50px) + padding (40px)
        // Per item: ~70px (includes spacing)
        // Empty day: ~60px
        const baseHeight = 90;
        const perItem = 70;
        const emptyHeight = topLevelItems === 0 ? 60 : 0;

        return baseHeight + topLevelItems * perItem + emptyHeight;
      },
      [visibleDates, itemsByDate]
    );

    // Virtualizer for infinite scroll mode
    const virtualizer = useVirtualizer({
      count: visibleDates.length,
      getScrollElement: () => scrollRef.current,
      estimateSize,
      overscan: 3,
    });

    // Expose imperative methods
    useImperativeHandle(
      ref,
      () => ({
        scrollToDate: (date: string) => {
          const dateIndex = visibleDates.findIndex((d) => d === date);
          if (dateIndex >= 0) {
            virtualizer.scrollToIndex(dateIndex, { align: 'start' });
          } else if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
          }
        },
      }),
      [visibleDates, virtualizer]
    );

    // Auto-scroll to today on mount for infinite mode
    useEffect(() => {
      if (scrollRef.current && viewMode === 'infinite' && todayIndex >= 0) {
        virtualizer.scrollToIndex(todayIndex, { align: 'end' });
      }
    }, [todayIndex, viewMode, virtualizer]);

    // Use shared wheel navigation hook
    const { handleScroll } = useWheelNavigation({
      scrollRef: scrollRef as React.RefObject<HTMLDivElement>,
      viewMode,
      onNextDay,
      onPreviousDay,
      setIsPageFlipping,
    });

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
          const leadingSpaces =
            newValue.substring(lineStart, cursorPos - 1).match(/^\s*/)?.[0] || '';
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
                value.substring(0, selectionStart - 2) + prefix + value.substring(selectionStart);
              setInput(newValue);

              setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = selectionStart - 1;
              }, 0);
              return;
            }
          }
        }
      }

      // Tab: cycle through indent levels (at start of line)
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();

        // Find start of current line
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const lineContent = value.substring(lineStart);

        // First line cannot be indented
        if (lineStart === 0) {
          return;
        }

        // Check if line has a prefix (symbol + space)
        const prefixMatch = lineContent.match(/^(\t*)(\S) /);
        if (prefixMatch) {
          // Count existing tabs on current line
          const currentTabs = prefixMatch[1].length;

          // Find previous line and count its tabs
          const prevLineEnd = lineStart - 1;
          const prevLineStart = value.lastIndexOf('\n', prevLineEnd - 1) + 1;
          const prevLineContent = value.substring(prevLineStart, prevLineEnd);
          const prevTabs = (prevLineContent.match(/^(\t*)/)?.[1] || '').length;

          // Max allowed indent is 1 level deeper than previous line
          const maxTabs = prevTabs + 1;

          let newValue: string;
          let cursorDelta: number;

          if (currentTabs < maxTabs) {
            // Increment indent level
            newValue = value.substring(0, lineStart) + '\t' + value.substring(lineStart);
            cursorDelta = 1;
          } else {
            // Cycle back to 0 - remove all tabs
            newValue = value.substring(0, lineStart) + value.substring(lineStart + currentTabs);
            cursorDelta = -currentTabs;
          }

          setInput(newValue);

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + cursorDelta;
          }, 0);
        }
        return;
      }

      // Shift+Tab: remove tab from start of current line
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();

        // Find start of current line
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;

        // Check if there's a tab at the start of the line
        if (value[lineStart] === '\t') {
          const newValue = value.substring(0, lineStart) + value.substring(lineStart + 1);
          setInput(newValue);

          // Move cursor back 1 position
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = Math.max(
              lineStart,
              selectionStart - 1
            );
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
              isEvent: parsed.type === 'event',
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

      // Convert visual format to parser format using shared function
      const formattedLines = convertToParserFormat(inputToProcess);

      // Use the new addItems for batch creation
      const result = addItems(formattedLines);

      if (result.errors.length > 0) {
        // Show first error as toast
        addToast(result.errors[0], 'error');
        return;
      }

      setInput('');

      // Close mobile bottom sheet if open
      if (isMobile && isInputSheetOpen) {
        setIsInputSheetOpen(false);
      }

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '56px';
      }

      // Scroll to bottom after adding items
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    };

    const handleTimePromptCancel = () => {
      setTimePrompt(null);
    };

    const handleTimePromptModalSubmit = (time: string, endTime?: string) => {
      if (!timePrompt) return;

      // Update the line with the time(s)
      const lines = input.split('\n');
      let updatedLine: string;

      if (timePrompt.isEvent && endTime) {
        updatedLine =
          lines[timePrompt.index].trimStart() +
          ' from ' +
          formatTimeForDisplay(time, timeFormat) +
          ' to ' +
          formatTimeForDisplay(endTime, timeFormat);
      } else {
        updatedLine =
          lines[timePrompt.index].trimStart() + ' at ' + formatTimeForDisplay(time, timeFormat);
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
          } ${isPageFlipping && viewMode === 'book' ? 'page-flip-left' : ''}`}
          style={
            isMobile
              ? { height: `calc(100vh - ${MOBILE.FOOTER_HEIGHT}px)` }
              : viewMode === 'book'
                ? { height: 'calc(100vh - 60px - 90px)' }
                : undefined
          }
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
                    <div
                      className={`sticky top-0 z-10 bg-background py-3 mb-6 border-b border-border-subtle ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}
                    >
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
                        {dateItems
                          .filter((item) => !item.parentId)
                          .map((item) => (
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
          {viewMode === 'book' &&
            visibleDates.map((date) => {
              const dateItems = itemsByDate.get(date) || [];
              const isToday = date === today;

              // Hide empty days in book mode when searching
              if (dateItems.length === 0 && !isToday && searchQuery) {
                return null;
              }

              return (
                <div key={date} className="snap-start snap-always">
                  {/* Date Header */}
                  <div
                    className={`sticky top-0 z-10 bg-background py-3 mb-6 border-b border-border-subtle ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}
                  >
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
                      {dateItems
                        .filter((item) => !item.parentId)
                        .map((item) => (
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

        {/* Desktop: Input Field - Fixed at Bottom */}
        {!isMobile && (
          <form onSubmit={handleSubmit} className="border-t border-border-subtle">
            <label htmlFor="thoughts-input" className="sr-only">
              Add a new thought, task, event, or routine
            </label>
            <textarea
              id="thoughts-input"
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type here... (Tab to indent, Shift+Enter for new line)"
              className="w-full min-h-[56px] max-h-[200px] py-16 px-24 bg-transparent border-none outline-none font-serif text-base placeholder-text-secondary resize-none overflow-y-auto"
              style={{ tabSize: 8 }}
              rows={1}
              autoFocus
              aria-describedby="input-help"
            />
            <span id="input-help" className="sr-only">
              Use prefixes: t for todo, e for event, r for routine, n for note. Press Enter to
              submit, Shift+Enter for new line.
            </span>
          </form>
        )}

        {/* Mobile: FAB + Bottom Sheet */}
        {isMobile && (
          <>
            <FAB onClick={() => setIsInputSheetOpen(true)} icon="+" label="Add thought" />
            <BottomSheet
              isOpen={isInputSheetOpen}
              onClose={() => setIsInputSheetOpen(false)}
              title="Add Thought"
              height="half"
            >
              <form onSubmit={handleSubmit}>
                <label htmlFor="thoughts-input-mobile" className="sr-only">
                  Add a new thought, task, event, or routine
                </label>
                <textarea
                  id="thoughts-input-mobile"
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type here... (Tab to indent, Shift+Enter for new line)"
                  className="w-full min-h-[120px] max-h-[300px] py-12 px-16 bg-transparent border border-border-subtle rounded-sm font-serif text-base placeholder-text-secondary resize-none overflow-y-auto"
                  style={{ tabSize: 8 }}
                  rows={4}
                  autoFocus
                  aria-describedby="input-help-mobile"
                />
                <span id="input-help-mobile" className="sr-only">
                  Use prefixes: t for todo, e for event, r for routine, n for note. Press Enter to
                  submit, Shift+Enter for new line.
                </span>
                <button
                  type="submit"
                  className="mt-16 w-full py-12 bg-text-primary text-background rounded-sm font-serif text-base touch-target"
                  style={{
                    minHeight: `${MOBILE.MIN_TOUCH_TARGET}px`,
                  }}
                >
                  Add
                </button>
              </form>
            </BottomSheet>
          </>
        )}
      </div>
    );
  }
);

ThoughtsPane.displayName = 'ThoughtsPane';

export default ThoughtsPane;
