import { format } from 'date-fns';
import { useStore } from './store/useStore';
import ThoughtsPane from './components/ThoughtsPane';
import TimePane from './components/TimePane';

function App() {
  const currentDate = useStore((state) => state.currentDate);

  return (
    <div className="h-full flex flex-col bg-background text-text-primary">
      {/* Header */}
      <header className="h-[60px] border-b border-border-subtle flex items-center justify-between px-48">
        <h1 className="text-lg font-serif">Thoughts & Time</h1>
        <div className="flex items-center gap-32">
          <button className="text-sm font-mono hover:opacity-70 transition-opacity">
            Search
          </button>
          <div className="text-sm font-mono">
            {format(currentDate, 'MMM d, yyyy')}
          </div>
        </div>
      </header>

      {/* Two-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thoughts Pane - Left */}
        <div className="w-1/2 border-r border-border-subtle">
          <ThoughtsPane />
        </div>

        {/* Time Pane - Right */}
        <div className="w-1/2">
          <TimePane />
        </div>
      </div>
    </div>
  );
}

export default App;
