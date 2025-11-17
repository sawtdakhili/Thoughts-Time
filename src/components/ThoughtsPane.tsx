import { useState, useEffect, useRef } from 'react';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import ItemDisplay from './ItemDisplay';
import { Item } from '../types';
import { parseInput } from '../utils/parser';

function ThoughtsPane() {
  const [input, setInput] = useState('');
  const addItem = useStore((state) => state.addItem);
  const items = useStore((state) => state.items);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [timePrompt, setTimePrompt] = useState<{ line: string; index: number; isEvent: boolean } | null>(null);
  const [promptedTime, setPromptedTime] = useState('');
  const [promptedEndTime, setPromptedEndTime] = useState('');

  // Compute items grouped by date (recomputes when items change)
  const itemsByDate = new Map<string, Item[]>();
  items.forEach((item) => {
    const date = item.createdDate;
    if (!itemsByDate.has(date)) {
      itemsByDate.set(date, []);
    }
    itemsByDate.get(date)!.push(item);
  });

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

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

  const handleSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const lines = input.split('\n');

      // First pass: check if any line needs time prompt
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const contentWithoutIndent = line.trimStart();
        const parsed = parseInput(contentWithoutIndent);

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
      createItems();
    }
  };

  const createItems = () => {
    const lines = input.split('\n');
    const itemStack: Array<{ id: string; level: number }> = [];

    lines.forEach((line) => {
      if (!line.trim()) return; // Skip empty lines

      // Detect indentation level (2 spaces = 1 level)
      const leadingSpaces = line.match(/^(\s*)/)?.[0].length || 0;
      const indentLevel = Math.floor(leadingSpaces / 2);
      const contentWithoutIndent = line.trimStart();

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
      const newItemId = addItem(contentWithoutIndent, parentId, indentLevel);

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

  const handleTimePromptSubmit = () => {
    if (!timePrompt || !promptedTime) return;

    // For events, also require end time
    if (timePrompt.isEvent && !promptedEndTime) return;

    // Update the line with the time(s)
    const lines = input.split('\n');
    let updatedLine: string;

    if (timePrompt.isEvent) {
      // Events: "from X to Y"
      updatedLine = lines[timePrompt.index].trimStart() + ' from ' + promptedTime + ' to ' + promptedEndTime;
    } else {
      // Tasks: "at X"
      updatedLine = lines[timePrompt.index].trimStart() + ' at ' + promptedTime;
    }

    // Restore indentation
    const leadingSpaces = lines[timePrompt.index].match(/^(\s*)/)?.[0] || '';
    lines[timePrompt.index] = leadingSpaces + updatedLine;

    setInput(lines.join('\n'));
    setTimePrompt(null);
    setPromptedTime('');
    setPromptedEndTime('');

    // Re-submit after a brief delay to allow state to update
    setTimeout(() => {
      const syntheticEvent = new Event('submit') as any;
      handleSubmit(syntheticEvent);
    }, 50);
  };

  const handleTimePromptCancel = () => {
    setTimePrompt(null);
    setPromptedTime('');
    setPromptedEndTime('');
  };

  // Auto-scroll to bottom on mount (to show today)
  useEffect(() => {
    if (scrollRef.current && isAtBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Time Prompt Modal */}
      {timePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background border border-border-subtle rounded-sm p-24 max-w-md w-full mx-16">
            <h3 className="text-base font-serif mb-16">
              {timePrompt.isEvent ? 'When does it start and end?' : 'What time?'}
            </h3>
            <p className="text-sm text-text-secondary mb-16 font-serif">{timePrompt.line}</p>

            {timePrompt.isEvent ? (
              // Event: show start and end times
              <div className="space-y-12">
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-4">Start time</label>
                  <input
                    type="time"
                    value={promptedTime}
                    onChange={(e) => setPromptedTime(e.target.value)}
                    className="w-full px-12 py-8 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTimePromptSubmit();
                      } else if (e.key === 'Escape') {
                        handleTimePromptCancel();
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-4">End time</label>
                  <input
                    type="time"
                    value={promptedEndTime}
                    onChange={(e) => setPromptedEndTime(e.target.value)}
                    className="w-full px-12 py-8 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm mb-16"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTimePromptSubmit();
                      } else if (e.key === 'Escape') {
                        handleTimePromptCancel();
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              // Task: show single time
              <input
                type="time"
                value={promptedTime}
                onChange={(e) => setPromptedTime(e.target.value)}
                className="w-full px-12 py-8 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm mb-16"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTimePromptSubmit();
                  } else if (e.key === 'Escape') {
                    handleTimePromptCancel();
                  }
                }}
              />
            )}

            <div className="flex gap-8 justify-end mt-16">
              <button
                onClick={handleTimePromptCancel}
                className="px-16 py-8 text-sm font-mono text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleTimePromptSubmit}
                className="px-16 py-8 text-sm font-mono text-text-primary border border-border-subtle rounded-sm hover:bg-hover-bg"
              >
                {timePrompt.isEvent ? 'Add Times' : 'Add Time'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pane Header */}
      <div className="h-[36px] border-b border-border-subtle flex items-center px-24">
        <h2 className="text-xs font-serif uppercase tracking-wider">Thoughts</h2>
      </div>

      {/* Items Area - Scrollable through all days */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-24 py-16"
      >
        {dates.map((date) => {
          const items = itemsByDate.get(date) || [];
          const isToday = date === today;

          if (items.length === 0 && !isToday) {
            // Don't show empty days (except today)
            return null;
          }

          return (
            <div key={date} className="mb-24">
              {/* Date Header */}
              <div className={`sticky top-0 bg-background py-4 mb-8 border-b border-border-subtle ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}>
                <h3 className="text-xs font-mono uppercase tracking-wider">
                  {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                  {isToday && ' (Today)'}
                </h3>
              </div>

              {/* Items for this date */}
              {items.length === 0 ? (
                <div className="text-center text-text-secondary text-sm py-8">
                  <p>Nothing captured yet</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Only render top-level items (sub-items are rendered recursively) */}
                  {items.filter(item => !item.parentId).map((item) => (
                    <ItemDisplay key={item.id} item={item} />
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
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type here... (Tab to indent, Shift+Enter for new line)"
          className="w-full min-h-[56px] max-h-[200px] py-16 px-24 bg-transparent border-none outline-none font-serif text-base placeholder-text-secondary resize-none overflow-y-auto"
          rows={1}
          autoFocus
        />
      </form>
    </div>
  );
}

export default ThoughtsPane;
