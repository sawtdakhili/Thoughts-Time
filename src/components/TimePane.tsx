import { useState, useEffect, useRef } from 'react';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import DailyReview from './DailyReview';
import { Item, Todo, Event as EventType, Note } from '../types';

type TimelineEntry = {
  time: Date;
  timeKey: string;
  type: 'todo' | 'event-start' | 'event-end' | 'event-single';
  item: Item;
};

interface TimePaneProps {
  searchQuery?: string;
}

function TimePane({ searchQuery = '' }: TimePaneProps) {
  const items = useStore((state) => state.items);
  const toggleTodoComplete = useStore((state) => state.toggleTodoComplete);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

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

  const handleEdit = (itemId: string, content: string) => {
    setEditingItem(itemId);
    setEditContent(content);
  };

  const handleSaveEdit = (itemId: string) => {
    if (editContent.trim() && editContent !== items.find(i => i.id === itemId)?.content) {
      updateItem(itemId, { content: editContent.trim() });
    }
    setEditingItem(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditContent('');
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
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit(item.id);
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
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
                      onClick={() => handleEdit(item.id, item.content)}
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
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit(item.id);
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
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
                      onClick={() => handleEdit(item.id, item.content)}
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
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit(item.id);
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
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
                      onClick={() => handleEdit(item.id, item.content)}
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
        className="flex-1 overflow-y-auto px-24 py-16"
      >
        {/* Daily Review - appears at top */}
        <DailyReview />

        {dates.map((date) => {
          const entries = entriesByDate.get(date) || [];
          const isToday = date === today;

          if (entries.length === 0) {
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
            <div key={date} className="mb-16">
              {/* Date Header */}
              <div className={`sticky top-0 bg-background py-2 mb-4 border-b border-border-subtle ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}>
                <h3 className="text-xs font-mono uppercase tracking-wider">
                  {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                  {isToday && ' (Today)'}
                </h3>
              </div>

              {/* Items for this date */}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimePane;
