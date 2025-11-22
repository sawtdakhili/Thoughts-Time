import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useStore } from '../store/useStore';
import { useToast } from '../hooks/useToast';
import { Todo } from '../types';
import { parseInput } from '../utils/parser';
import { matchesSearch } from '../utils/search';
import ConfirmDialog from './ConfirmDialog';

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
  const addToast = useToast((state) => state.addToast);
  const [showRescheduler, setShowRescheduler] = useState<string | null>(null);
  const [rescheduleInput, setRescheduleInput] = useState('');
  const [handledItems, setHandledItems] = useState<Set<string>>(new Set());
  const [itemsToShow, setItemsToShow] = useState(10);
  const [confirmCancel, setConfirmCancel] = useState<{ isOpen: boolean; itemId: string | null }>({
    isOpen: false,
    itemId: null,
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();

  // Generate ALL undone todos from previous days (scheduled or unscheduled)
  // Only include parent-level todos (not subtasks)
  const reviewItems: DailyReviewItem[] = items
    .filter((item) => {
      if (item.type !== 'todo') return false;
      const todo = item as Todo;

      // ALL incomplete todos from previous days (not today)
      // Exclude subtasks - they'll be shown nested under their parents
      const isReviewCandidate =
        todo.createdDate < today && !todo.completedAt && !todo.cancelledAt && !todo.parentId; // Only show parent-level todos

      // Apply search filter
      return isReviewCandidate && matchesSearch(item, searchQuery, items);
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
    const todo = items.find((i) => i.id === todoId) as Todo | undefined;
    if (!todo || !todo.children || todo.children.length === 0) return [];

    return todo.children
      .map((childId: string) => {
        const child = items.find((i) => i.id === childId);
        // Only include todo children that are incomplete
        if (!child || child.type !== 'todo' || child.completedAt || child.cancelledAt) return null;

        const createdDate = new Date(child.createdDate);
        const waitingDays = differenceInDays(now, createdDate);
        return { item: child as Todo, waitingDays };
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
      addToast(
        'Could not parse date/time. Try formats like "tomorrow 2pm", "friday at 3:30pm", "next monday 9am"',
        'error'
      );
      return;
    }

    // Update the item with the new scheduled time
    if (parsed.scheduledTime) {
      updateItem(itemId, {
        scheduledTime: parsed.scheduledTime,
        hasTime: parsed.hasTime,
      });
      // Mark item as handled
      setHandledItems((prev) => new Set(prev).add(itemId));
    } else {
      addToast('Please specify a date/time for rescheduling', 'error');
      return;
    }

    setShowRescheduler(null);
    setRescheduleInput('');
  };

  const handleComplete = (itemId: string) => {
    toggleTodoComplete(itemId);
    // Mark item as handled
    setHandledItems((prev) => new Set(prev).add(itemId));
  };

  const handleCancel = (itemId: string) => {
    setConfirmCancel({ isOpen: true, itemId });
  };

  const handleConfirmCancel = () => {
    if (confirmCancel.itemId) {
      deleteItem(confirmCancel.itemId);
      // Mark item as handled
      setHandledItems((prev) => new Set(prev).add(confirmCancel.itemId!));
    }
    setConfirmCancel({ isOpen: false, itemId: null });
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
    <>
      <ConfirmDialog
        isOpen={confirmCancel.isOpen}
        title="Cancel Item"
        message="Are you sure you want to cancel this item permanently?"
        confirmText="Cancel Item"
        cancelText="Keep"
        isDangerous={true}
        onConfirm={handleConfirmCancel}
        onCancel={() => setConfirmCancel({ isOpen: false, itemId: null })}
      />

      <section aria-labelledby="daily-review-heading">
        {/* Daily Review Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <span className="text-base leading-book" aria-hidden="true">
              ■
            </span>
            <h2 id="daily-review-heading" className="text-base font-serif font-semibold">
              Daily Review
            </h2>
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
                    <span className="text-base leading-book flex-shrink-0 text-text-secondary">
                      •
                    </span>

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
                    <div
                      className="flex items-center gap-6 flex-shrink-0"
                      role="group"
                      aria-label={`Actions for ${item.content}`}
                    >
                      <button
                        onClick={() => handleReschedule(item.id)}
                        className="w-18 h-18 flex items-center justify-center hover:opacity-70 active:opacity-50"
                        title="Reschedule"
                        aria-label={`Reschedule "${item.content}"`}
                        disabled={showRescheduler === item.id}
                      >
                        <span className="text-sm" aria-hidden="true">
                          ↷
                        </span>
                      </button>
                      <button
                        onClick={() => handleComplete(item.id)}
                        className="w-18 h-18 flex items-center justify-center hover:opacity-70 active:opacity-50"
                        title="Complete"
                        aria-label={`Complete "${item.content}"`}
                        disabled={showRescheduler === item.id}
                      >
                        <span className="text-sm" aria-hidden="true">
                          ✓
                        </span>
                      </button>
                      <button
                        onClick={() => handleCancel(item.id)}
                        className="w-18 h-18 flex items-center justify-center hover:opacity-70 active:opacity-50 text-text-secondary"
                        title="Cancel"
                        aria-label={`Cancel "${item.content}"`}
                        disabled={showRescheduler === item.id}
                      >
                        <span className="text-sm" aria-hidden="true">
                          ×
                        </span>
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
                onClick={() => setItemsToShow((prev) => prev + 10)}
                className="text-sm text-text-secondary hover:text-text-primary font-serif"
              >
                Show {Math.min(10, unhandledItems.length - itemsToShow)} more...
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default DailyReview;
