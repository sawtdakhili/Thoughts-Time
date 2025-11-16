import { useState, useEffect, useRef } from 'react';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import ItemDisplay from './ItemDisplay';
import { Item } from '../types';

function ThoughtsPane() {
  const [input, setInput] = useState('');
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const addItem = useStore((state) => state.addItem);
  const items = useStore((state) => state.items);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

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
      let lastParentId: string | null = null;
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

        // Track the first top-level item as potential parent for next submission
        if (indentLevel === 0 && !lastParentId) {
          lastParentId = newItemId;
        }
      });

      // Set parent for next submission
      setCurrentParentId(lastParentId);

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
    }
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
      {/* Pane Header */}
      <div className="h-[48px] border-b border-border-subtle flex items-center px-48">
        <h2 className="text-sm font-serif uppercase tracking-wide">Thoughts</h2>
      </div>

      {/* Items Area - Scrollable through all days */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-48 py-32"
      >
        {dates.map((date) => {
          const items = itemsByDate.get(date) || [];
          const isToday = date === today;

          if (items.length === 0 && !isToday) {
            // Don't show empty days (except today)
            return null;
          }

          return (
            <div key={date} className="mb-64">
              {/* Date Header */}
              <div className={`sticky top-0 bg-background py-12 mb-24 border-b border-border-subtle ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}>
                <h3 className="text-sm font-mono uppercase tracking-wide">
                  {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                  {isToday && ' (Today)'}
                </h3>
              </div>

              {/* Items for this date */}
              {items.length === 0 ? (
                <div className="text-center text-text-secondary text-sm py-24">
                  <p>Nothing captured yet</p>
                </div>
              ) : (
                <div className="space-y-32">
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
