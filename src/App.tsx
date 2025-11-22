import { useState, useRef } from 'react';
import ThoughtsPane, { ThoughtsPaneHandle } from './components/ThoughtsPane';
import TimePane from './components/TimePane';
import Settings from './components/Settings';
import ToastContainer from './components/Toast';
import { useSettingsStore } from './store/useSettingsStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useDebouncedSearch } from './hooks/useDebouncedSearch';
import { useLazyDates } from './hooks/useLazyDates';
import { Item } from './types';

function App() {
  const [searchInput, setSearchInput] = useState('');
  const searchQuery = useDebouncedSearch(searchInput, 300);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const viewMode = useSettingsStore((state) => state.viewMode);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const thoughtsPaneRef = useRef<ThoughtsPaneHandle>(null);

  // Setup undo/redo
  const { undo, redo } = useUndoRedo();

  // Lazy load dates for better performance
  const { dates, loadMorePast, loadMoreFuture, canLoadMorePast, canLoadMoreFuture, todayIndex } =
    useLazyDates({
      initialPastDays: 14,
      initialFutureDays: 14,
      loadChunkSize: 14,
      maxPastDays: 90,
      maxFutureDays: 90,
    });

  // Book mode: track current day for each pane independently
  const [thoughtsDayIndex, setThoughtsDayIndex] = useState(todayIndex);
  const [timeDayIndex, setTimeDayIndex] = useState(todayIndex);

  // Handle jump to source from Time pane
  const handleJumpToSource = (item: Item) => {
    // In book mode, navigate to the date
    if (viewMode === 'book') {
      const dateIndex = dates.findIndex((d) => d === item.createdDate);
      if (dateIndex >= 0) {
        setThoughtsDayIndex(dateIndex);
      }
    } else {
      // In infinite mode, scroll to the date
      thoughtsPaneRef.current?.scrollToDate(item.createdDate);
    }

    // Highlight the item
    setHighlightedItemId(item.id);

    // Clear highlight after animation
    setTimeout(() => {
      setHighlightedItemId(null);
    }, 2000);
  };

  const thoughtsCurrentDate = viewMode === 'book' ? dates[thoughtsDayIndex] : undefined;
  const timeCurrentDate = viewMode === 'book' ? dates[timeDayIndex] : undefined;

  // Navigation functions for Thoughts pane
  const goToNextDayThoughts = () => {
    if (thoughtsDayIndex < dates.length - 1) {
      setThoughtsDayIndex(thoughtsDayIndex + 1);
      // Load more future dates when near the end
      if (thoughtsDayIndex >= dates.length - 3 && canLoadMoreFuture) {
        loadMoreFuture();
      }
    }
  };

  const goToPreviousDayThoughts = () => {
    if (thoughtsDayIndex > 0) {
      setThoughtsDayIndex(thoughtsDayIndex - 1);
      // Load more past dates when near the beginning
      if (thoughtsDayIndex <= 2 && canLoadMorePast) {
        loadMorePast();
        // Adjust index to account for newly loaded dates
        setThoughtsDayIndex((prev) => prev + 14);
      }
    }
  };

  // Navigation functions for Time pane
  const goToNextDayTime = () => {
    if (timeDayIndex < dates.length - 1) {
      setTimeDayIndex(timeDayIndex + 1);
      // Load more future dates when near the end
      if (timeDayIndex >= dates.length - 3 && canLoadMoreFuture) {
        loadMoreFuture();
      }
    }
  };

  const goToPreviousDayTime = () => {
    if (timeDayIndex > 0) {
      setTimeDayIndex(timeDayIndex - 1);
      // Load more past dates when near the beginning
      if (timeDayIndex <= 2 && canLoadMorePast) {
        loadMorePast();
        // Adjust index to account for newly loaded dates
        setTimeDayIndex((prev) => prev + 14);
      }
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
      key: 'z',
      ctrlKey: true,
      metaKey: true,
      shiftKey: false,
      handler: () => {
        undo();
      },
      description: 'Undo',
    },
    {
      key: 'z',
      ctrlKey: true,
      metaKey: true,
      shiftKey: true,
      handler: () => {
        redo();
      },
      description: 'Redo',
    },
    {
      key: 'Escape',
      handler: () => {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchInput('');
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
      <header className="h-[60px] border-b border-border-subtle flex items-center justify-center px-48 relative">
        <h1 className="text-lg font-serif">Thoughts & Time</h1>
        <div className="absolute right-48 flex items-center gap-16">
          {isSearchOpen && (
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onBlur={() => {
                if (!searchInput) {
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
                setSearchInput('');
              }
            }}
            className="text-base hover:opacity-70 transition-opacity"
            title="Search"
            aria-label={isSearchOpen ? 'Close search' : 'Open search'}
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
            ref={thoughtsPaneRef}
            searchQuery={searchQuery}
            viewMode={viewMode}
            currentDate={thoughtsCurrentDate}
            onNextDay={goToNextDayThoughts}
            onPreviousDay={goToPreviousDayThoughts}
            highlightedItemId={highlightedItemId}
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
            onJumpToSource={handleJumpToSource}
          />
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
