import { useState } from 'react';
import { format, subDays, addDays } from 'date-fns';
import ThoughtsPane from './components/ThoughtsPane';
import TimePane from './components/TimePane';
import Settings from './components/Settings';
import ToastContainer from './components/Toast';
import { useSettingsStore } from './store/useSettingsStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const viewMode = useSettingsStore((state) => state.viewMode);

  // Book mode: track current day for each pane independently
  const [thoughtsDayIndex, setThoughtsDayIndex] = useState(30); // Start at today (index 30 in 60-day range)
  const [timeDayIndex, setTimeDayIndex] = useState(30);

  // Generate date range: 30 days past to 30 days future
  const dates: string[] = [];
  for (let i = -30; i <= 30; i++) {
    const date = i === 0
      ? new Date()
      : i < 0
        ? subDays(new Date(), Math.abs(i))
        : addDays(new Date(), i);
    dates.push(format(date, 'yyyy-MM-dd'));
  }

  const thoughtsCurrentDate = viewMode === 'book' ? dates[thoughtsDayIndex] : undefined;
  const timeCurrentDate = viewMode === 'book' ? dates[timeDayIndex] : undefined;

  // Navigation functions for Thoughts pane
  const goToNextDayThoughts = () => {
    if (thoughtsDayIndex < dates.length - 1) {
      setThoughtsDayIndex(thoughtsDayIndex + 1);
    }
  };

  const goToPreviousDayThoughts = () => {
    if (thoughtsDayIndex > 0) {
      setThoughtsDayIndex(thoughtsDayIndex - 1);
    }
  };

  // Navigation functions for Time pane
  const goToNextDayTime = () => {
    if (timeDayIndex < dates.length - 1) {
      setTimeDayIndex(timeDayIndex + 1);
    }
  };

  const goToPreviousDayTime = () => {
    if (timeDayIndex > 0) {
      setTimeDayIndex(timeDayIndex - 1);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'f',
      ctrlKey: true,
      metaKey: true, // Support both Ctrl (Windows/Linux) and Cmd (Mac)
      handler: () => {
        setIsSearchOpen(true);
      },
      description: 'Open search',
    },
    {
      key: 'Escape',
      handler: () => {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery('');
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        }
      },
      description: 'Close search or settings',
    },
  ]);

  return (
    <div className="h-full flex flex-col bg-background text-text-primary">
      {/* Settings Modal */}
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Header */}
      <header className="h-[60px] border-b border-border-subtle flex items-center justify-between px-48">
        <h1 className="text-lg font-serif">Thoughts & Time</h1>
        <div className="flex items-center gap-16">
          {isSearchOpen && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery) {
                  setIsSearchOpen(false);
                }
              }}
              placeholder="Search..."
              className="px-12 py-4 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm w-[240px] focus:outline-none focus:border-text-secondary"
              autoFocus
            />
          )}
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) {
                setSearchQuery('');
              }
            }}
            className="text-base hover:opacity-70 transition-opacity"
            title="Search"
            aria-label={isSearchOpen ? "Close search" : "Open search"}
          >
            🔍
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-base hover:opacity-70 transition-opacity"
            title="Settings"
            aria-label="Open settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Two-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thoughts Pane - Left */}
        <div className="w-1/2 border-r border-border-subtle">
          <ThoughtsPane
            searchQuery={searchQuery}
            viewMode={viewMode}
            currentDate={thoughtsCurrentDate}
            onNextDay={goToNextDayThoughts}
            onPreviousDay={goToPreviousDayThoughts}
          />
        </div>

        {/* Time Pane - Right */}
        <div className="w-1/2">
          <TimePane
            searchQuery={searchQuery}
            viewMode={viewMode}
            currentDate={timeCurrentDate}
            onNextDay={goToNextDayTime}
            onPreviousDay={goToPreviousDayTime}
          />
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
