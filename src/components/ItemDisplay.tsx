import { format } from 'date-fns';
import { Item, Todo, Event, Routine, Note } from '../types';
import { useStore } from '../store/useStore';

interface ItemDisplayProps {
  item: Item;
}

function ItemDisplay({ item }: ItemDisplayProps) {
  const toggleTodoComplete = useStore((state) => state.toggleTodoComplete);

  const getSymbol = () => {
    switch (item.type) {
      case 'todo':
        const todo = item as Todo;
        return todo.completedAt ? '☑' : '□';
      case 'event':
        return '⇹';
      case 'routine':
        return '↻';
      case 'note':
        return '↝';
      default:
        return '';
    }
  };

  const getTimeDisplay = () => {
    const time = format(new Date(item.createdAt), 'h:mm a');
    return time;
  };

  const handleToggleComplete = () => {
    if (item.type === 'todo') {
      toggleTodoComplete(item.id);
    }
  };

  const isCompleted = item.type === 'todo' && (item as Todo).completedAt;

  return (
    <div className="group">
      {/* Timestamp */}
      <div className="text-xs font-mono text-text-secondary mb-6">
        {getTimeDisplay()}
      </div>

      {/* Item Content */}
      <div className={`flex items-start gap-12 ${isCompleted ? 'opacity-40' : ''}`}>
        {/* Symbol */}
        <button
          onClick={handleToggleComplete}
          className={`text-base leading-book flex-shrink-0 ${
            item.type === 'todo' ? 'cursor-pointer hover:opacity-70' : 'cursor-default'
          }`}
          disabled={item.type !== 'todo'}
        >
          {getSymbol()}
        </button>

        {/* Content */}
        <div className="flex-1">
          <p
            className={`text-base font-serif leading-book ${
              item.type === 'note' ? 'italic' : ''
            } ${item.type === 'event' ? 'font-semibold' : ''} ${
              isCompleted ? 'line-through' : ''
            }`}
          >
            {item.content}
          </p>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="mt-6 text-sm text-text-secondary">
              {item.tags.map((tag) => (
                <span key={tag} className="mr-12">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Additional metadata for todos */}
          {item.type === 'todo' && (
            <>
              {(item as Todo).deadline && (
                <div className="mt-6 text-xs font-mono text-text-secondary">
                  Due: {format(new Date((item as Todo).deadline!), 'MMM d, h:mm a')}
                </div>
              )}
            </>
          )}

          {/* Additional metadata for routines */}
          {item.type === 'routine' && (
            <div className="mt-6 text-xs font-mono text-text-secondary">
              {(item as Routine).recurrencePattern.frequency === 'daily' && 'Every day'}
              {(item as Routine).streak > 0 && ` (Streak: ${(item as Routine).streak})`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemDisplay;
