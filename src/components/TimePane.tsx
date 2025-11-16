import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import ItemDisplay from './ItemDisplay';
import { Item, Todo } from '../types';

function TimePane() {
  const currentDate = useStore((state) => state.currentDate);
  const getScheduledItemsForDate = useStore((state) => state.getScheduledItemsForDate);

  const dateString = format(currentDate, 'yyyy-MM-dd');
  const scheduledItems = getScheduledItemsForDate(dateString);

  // Separate items with time vs without time
  const itemsWithTime: Item[] = [];
  const itemsWithoutTime: Item[] = [];

  scheduledItems.forEach((item) => {
    if (item.type === 'todo') {
      const todo = item as Todo;
      if (todo.hasTime) {
        itemsWithTime.push(item);
      } else {
        itemsWithoutTime.push(item);
      }
    } else if (item.type === 'event') {
      itemsWithTime.push(item);
    }
  });

  // Group items by hour
  const itemsByHour: { [hour: string]: Item[] } = {};
  itemsWithTime.forEach((item) => {
    let timeKey = '';
    if (item.type === 'todo') {
      const todo = item as Todo;
      if (todo.scheduledTime) {
        timeKey = format(new Date(todo.scheduledTime), 'h:mm a');
      }
    } else if (item.type === 'event') {
      timeKey = format(new Date(item.startTime), 'h:mm a');
    }

    if (timeKey) {
      if (!itemsByHour[timeKey]) {
        itemsByHour[timeKey] = [];
      }
      itemsByHour[timeKey].push(item);
    }
  });

  const hours = Object.keys(itemsByHour).sort();

  return (
    <div className="h-full flex flex-col">
      {/* Pane Header */}
      <div className="h-[48px] border-b border-border-subtle flex items-center px-48">
        <h2 className="text-sm font-serif uppercase tracking-wide">Time</h2>
      </div>

      {/* Timeline - Scrollable */}
      <div className="flex-1 overflow-y-auto px-48 py-32">
        {scheduledItems.length === 0 ? (
          <div className="text-center text-text-secondary text-sm pt-48">
            <p>No scheduled items today</p>
            <p className="mt-12">Create events with time</p>
            <p>(e meeting 2pm)</p>
          </div>
        ) : (
          <div className="space-y-32">
            {/* Items without specific time - at top */}
            {itemsWithoutTime.length > 0 && (
              <div>
                <div className="text-xs font-mono text-text-secondary mb-12 uppercase tracking-wide">
                  (No time)
                </div>
                <div className="space-y-24">
                  {itemsWithoutTime.map((item) => (
                    <ItemDisplay key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Items with specific times - by hour */}
            {hours.map((hour) => (
              <div key={hour}>
                <div className="text-xs font-mono text-text-secondary mb-12">
                  {hour}
                </div>
                <div className="space-y-24">
                  {itemsByHour[hour].map((item) => (
                    <ItemDisplay key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimePane;
