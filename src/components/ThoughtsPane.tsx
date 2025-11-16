import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import ItemDisplay from './ItemDisplay';

function ThoughtsPane() {
  const [input, setInput] = useState('');
  const currentDate = useStore((state) => state.currentDate);
  const addItem = useStore((state) => state.addItem);
  const getItemsForDate = useStore((state) => state.getItemsForDate);

  const dateString = format(currentDate, 'yyyy-MM-dd');
  const items = getItemsForDate(dateString);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      addItem(input);
      setInput('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Pane Header */}
      <div className="h-[48px] border-b border-border-subtle flex items-center px-48">
        <h2 className="text-sm font-serif uppercase tracking-wide">Thoughts</h2>
      </div>

      {/* Items Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-48 py-32">
        {items.length === 0 ? (
          <div className="text-center text-text-secondary text-sm pt-48">
            <p>Nothing captured yet today</p>
            <p className="mt-12">Type 't ' for todo</p>
            <p>Type 'e ' for event</p>
            <p>Type 'r ' for routine</p>
            <p>Just type for a note</p>
          </div>
        ) : (
          <div className="space-y-32">
            {items.map((item) => (
              <ItemDisplay key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Input Field - Fixed at Bottom */}
      <form onSubmit={handleSubmit} className="border-t border-border-subtle">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type here..."
          className="w-full h-[56px] px-24 bg-transparent border-none outline-none font-serif text-base placeholder-text-secondary"
          autoFocus
        />
      </form>
    </div>
  );
}

export default ThoughtsPane;
