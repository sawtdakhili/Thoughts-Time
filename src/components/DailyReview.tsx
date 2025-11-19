import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useStore } from '../store/useStore';
import { Todo, Item } from '../types';
import { parseInput } from '../utils/parser';

interface DailyReviewItem {
  item: Todo;
  waitingDays: number;
}

interface DailyReviewProps {
  searchQuery?: string;
}

function DailyReview({ searchQuery = '' }: DailyReviewProps) {
  const items = useStore((state) => state.items);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);
  const toggleTodoComplete = useStore((state) => state.toggleTodoComplete);
  const [showRescheduler, setShowRescheduler] = useState<string | null>(null);
  const [rescheduleInput, setRescheduleInput] = useState('');
  const [handledItems, setHandledItems] = useState<Set<string>>(new Set());
  const [itemsToShow, setItemsToShow] = useState(10);

  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();

  // Filter function: recursively check if item or its children match search
  const matchesSearch = (item: Item, query: string): boolean => {
    if (!query) return true;

    const lowerQuery = query.toLowerCase();

    // Check content
    if (item.content.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Recursively check subtasks for todos
    if (item.type === 'todo') {
      const todo = item as Todo;
      for (const subtaskId of todo.subtasks) {
        const subtask = items.find(i => i.id === subtaskId);
        if (subtask && matchesSearch(subtask, query)) {
          return true;
        }
      }
    }

    return false;
  };

  // Generate ALL undone todos from previous days (scheduled or unscheduled)
  // Only include parent-level todos (not subtasks)
  const reviewItems: DailyReviewItem[] = items
    .filter((item) => {
      if (item.type !== 'todo') return false;
      const todo = item as Todo;

      // ALL incomplete todos from previous days (not today)
      // Exclude subtasks - they'll be shown nested under their parents
      const isReviewCandidate = (
        todo.createdDate < today &&
        !todo.completedAt &&
        !todo.cancelledAt &&
        !todo.parentId // Only show parent-level todos
      );

      // Apply search filter
      return isReviewCandidate && matchesSearch(item, searchQuery);
    })
    .map((item) => {
      const todo = item as Todo;
      const createdDate = new Date(todo.createdDate);
      const waitingDays = differenceInDays(now, createdDate);

      return { item: todo, waitingDays };
    })
    .sort((a, b) => b.waitingDays - a.waitingDays); // Oldest first (highest waiting days first)

  // Helper function to get subtasks for a todo
  const getSubtasks = (todoId: string): DailyReviewItem[] => {
    const todo = items.find(i => i.id === todoId) as Todo | undefined;
    if (!todo || !todo.subtasks || todo.subtasks.length === 0) return [];

    return todo.subtasks
      .map(subtaskId => {
        const subtask = items.find(i => i.id === subtaskId) as Todo | undefined;
        if (!subtask || subtask.completedAt || subtask.cancelledAt) return null;

        const createdDate = new Date(subtask.createdDate);
        const waitingDays = differenceInDays(now, createdDate);
        return { item: subtask, waitingDays };
      })
      .filter((item): item is DailyReviewItem => item !== null);
  };

  const handleReschedule = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      setRescheduleInput(item.content);
    }
    setShowRescheduler(itemId);
  };

  const confirmReschedule = (itemId: string) => {
    if (!rescheduleInput.trim()) return;

    // Parse the input using the parser - prepend "t " so parser treats it as a todo
    const parsed = parseInput('t ' + rescheduleInput);

    if (!parsed) {
      alert('Could not parse date/time. Try formats like "tomorrow 2pm", "friday at 3:30pm", "next monday 9am"');
      return;
    }

    // Update the item with the new scheduled time
    if (parsed.scheduledTime) {
      updateItem(itemId, {
        scheduledTime: parsed.scheduledTime,
        hasTime: parsed.hasTime,
      });
      // Mark item as handled
      setHandledItems(prev => new Set(prev).add(itemId));
    } else {
      alert('Please specify a date/time for rescheduling');
      return;
    }

    setShowRescheduler(null);
    setRescheduleInput('');
  };

  const handleComplete = (itemId: string) => {
    toggleTodoComplete(itemId);
    // Mark item as handled
    setHandledItems(prev => new Set(prev).add(itemId));
  };

  const handleCancel = (itemId: string) => {
    if (confirm('Cancel this item permanently?')) {
      deleteItem(itemId);
      // Mark item as handled
      setHandledItems(prev => new Set(prev).add(itemId));
    }
  };

  if (reviewItems.length === 0) {
    return null;
  }

  // Filter unhandled items and apply pagination
  const unhandledItems = reviewItems.filter(({ item }) => !handledItems.has(item.id));
  const displayedItems = unhandledItems.slice(0, itemsToShow);
  const hasMore = unhandledItems.length > itemsToShow;
  const allHandled = unhandledItems.length === 0;

  // Auto-complete: Hide Daily Review when all items are handled
  if (allHandled) {
    return null;
  }

  return (
    <div>
      {/* Daily Review Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <span className="text-base leading-book">■</span>
          <h3 className="text-base font-serif font-semibold">Daily Review</h3>
        </div>
      </div>

      {/* Review Items */}
      <div className="space-y-6 pl-16">
        {displayedItems.map(({ item, waitingDays }) => {
          const subtasks = getSubtasks(item.id);

          return (
            <div key={item.id} className="space-y-3">
              {/* Parent Todo */}
              <div className="group">
                <div className="flex items-start gap-3">
                  {/* Bullet - always shown */}
                  <span className="text-base leading-book flex-shrink-0 text-text-secondary">•</span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {showRescheduler === item.id ? (
                      <div className="flex items-center gap-8">
                        <input
                          type="text"
                          value={rescheduleInput}
                          onChange={(e) => setRescheduleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              confirmReschedule(item.id);
                            } else if (e.key === 'Escape') {
                              setShowRescheduler(null);
                              setRescheduleInput('');
                            }
                          }}
                          placeholder="e.g., tomorrow 2pm, friday 9am"
                          className="flex-1 bg-background border border-border-subtle px-8 py-4 font-mono text-sm outline-none focus:border-text-secondary"
                          autoFocus
                        />
                        <button
                          onClick={() => confirmReschedule(item.id)}
                          className="text-sm text-text-secondary hover:text-text-primary"
                          title="Save (Enter)"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setShowRescheduler(null);
                            setRescheduleInput('');
                          }}
                          className="text-sm text-text-secondary hover:text-text-primary"
                          title="Cancel (Esc)"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-base font-serif leading-book">
                          {item.content}
                          <span className="text-xs font-mono text-text-secondary ml-6">
                            ({waitingDays} {waitingDays === 1 ? 'day' : 'days'} old)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons - always shown */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <button
                      onClick={() => handleReschedule(item.id)}
                      className="w-18 h-18 flex items-center justify-center hover:opacity-70 active:opacity-50"
                      title="Reschedule"
                      disabled={showRescheduler === item.id}
                    >
                      <span className="text-sm">↷</span>
                    </button>
                    <button
                      onClick={() => handleComplete(item.id)}
                      className="w-18 h-18 flex items-center justify-center hover:opacity-70 active:opacity-50"
                      title="Complete"
                      disabled={showRescheduler === item.id}
                    >
                      <span className="text-sm">✓</span>
                    </button>
                    <button
                      onClick={() => handleCancel(item.id)}
                      className="w-18 h-18 flex items-center justify-center hover:opacity-70 active:opacity-50 text-text-secondary"
                      title="Cancel"
                      disabled={showRescheduler === item.id}
                    >
                      <span className="text-sm">×</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtasks - indented */}
              {subtasks.length > 0 && (
                <div className="pl-8 space-y-2">
                  {subtasks.map(({ item: subtask, waitingDays: subtaskDays }) => (
                    <div key={subtask.id} className="flex items-start gap-3 text-sm">
                      <span className="text-text-secondary flex-shrink-0">└</span>
                      <p className="flex-1 font-serif leading-book text-text-secondary">
                        {subtask.content}
                        <span className="text-xs font-mono ml-4">
                          ({subtaskDays} {subtaskDays === 1 ? 'day' : 'days'} old)
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Show More button */}
        {hasMore && (
          <div className="pt-4">
            <button
              onClick={() => setItemsToShow(prev => prev + 10)}
              className="text-sm text-text-secondary hover:text-text-primary font-serif"
            >
              Show {Math.min(10, unhandledItems.length - itemsToShow)} more...
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyReview;
