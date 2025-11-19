import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useStore } from '../store/useStore';
import { Todo } from '../types';

interface DailyReviewItem {
  item: Todo;
  waitingDays: number;
}

function DailyReview() {
  const items = useStore((state) => state.items);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);
  const [showRescheduler, setShowRescheduler] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();

  // Generate ALL undone todos from previous days (scheduled or unscheduled)
  const reviewItems: DailyReviewItem[] = items
    .filter((item) => {
      if (item.type !== 'todo') return false;
      const todo = item as Todo;

      // ALL incomplete todos from previous days (not today)
      return (
        todo.createdDate < today &&
        !todo.completedAt &&
        !todo.cancelledAt
      );
    })
    .map((item) => {
      const todo = item as Todo;
      const createdDate = new Date(todo.createdDate);
      const waitingDays = differenceInDays(now, createdDate);

      return { item: todo, waitingDays };
    })
    .sort((a, b) => b.waitingDays - a.waitingDays); // Latest items at top (highest waiting days first)

  const handleReschedule = (itemId: string) => {
    setShowRescheduler(itemId);
  };

  const confirmReschedule = (itemId: string) => {
    if (!selectedTime) return;

    // Parse time (HH:mm format)
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);

    updateItem(itemId, {
      scheduledTime: scheduledDate,
    });

    setShowRescheduler(null);
    setSelectedTime('');
  };

  const handleComplete = (itemId: string) => {
    updateItem(itemId, {
      completedAt: now,
    });

    // TODO: Create completion entry in today's Thoughts
    // TODO: Create CompletionLink between them
  };

  const handleCancel = (itemId: string) => {
    if (confirm('Cancel this item permanently?')) {
      deleteItem(itemId);
    }
  };

  if (reviewItems.length === 0) {
    return null;
  }

  const allHandled = false; // TODO: Track which items have been handled

  return (
    <div className="mb-16">
      {/* Daily Review Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <span className="text-base leading-book">
            {allHandled ? '□' : '■'}
          </span>
          <h3 className="text-base font-serif font-semibold">Daily Review</h3>
        </div>
      </div>

      {/* Review Items */}
      <div className="space-y-6 pl-16">
        {reviewItems.map(({ item, waitingDays }) => (
          <div key={item.id} className="group">
            <div className="flex items-start gap-3 mb-2">
              <span className="text-base leading-book flex-shrink-0 text-text-secondary">•</span>
              <div className="flex-1">
                <p className="text-base font-serif leading-book">
                  {item.content}
                  <span className="text-xs font-mono text-text-secondary ml-6">
                    (waiting {waitingDays} {waitingDays === 1 ? 'day' : 'days'})
                  </span>
                </p>
                {item.tags.length > 0 && (
                  <div className="mt-1 text-xs text-text-secondary">
                    {item.tags.map((tag) => (
                      <span key={tag} className="mr-6">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {showRescheduler === item.id ? (
              <div className="flex items-center gap-4 pl-16">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="bg-background border border-border-subtle px-6 py-3 font-mono text-sm outline-none focus:border-text-secondary"
                  autoFocus
                />
                <button
                  onClick={() => confirmReschedule(item.id)}
                  className="px-6 py-3 text-xs font-mono hover:opacity-70"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowRescheduler(null);
                    setSelectedTime('');
                  }}
                  className="px-6 py-3 text-xs font-mono text-text-secondary hover:opacity-70"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-6 pl-16">
                <button
                  onClick={() => handleReschedule(item.id)}
                  className="w-18 h-18 flex items-center justify-center hover:opacity-70 active:opacity-50"
                  title="Reschedule"
                >
                  <span className="text-sm">↷</span>
                </button>
                <button
                  onClick={() => handleComplete(item.id)}
                  className="w-18 h-18 flex items-center justify-center hover:opacity-70 active:opacity-50"
                  title="Complete"
                >
                  <span className="text-sm">✓</span>
                </button>
                <button
                  onClick={() => handleCancel(item.id)}
                  className="w-18 h-18 flex items-center justify-center hover:opacity-70 active:opacity-50 text-text-secondary"
                  title="Cancel"
                >
                  <span className="text-sm">×</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Separator */}
      <div className="mt-8 border-t border-border-subtle" />
    </div>
  );
}

export default DailyReview;
