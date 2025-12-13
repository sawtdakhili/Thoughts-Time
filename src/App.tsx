import { useState, useRef, useEffect } from 'react';
import ThoughtsPane, { ThoughtsPaneHandle } from './components/ThoughtsPane';
import TimePane from './components/TimePane';
import Settings from './components/Settings';
import ToastContainer from './components/Toast';
import PaneErrorBoundary from './components/PaneErrorBoundary';
import MobileFooter from './components/MobileFooter';
import HelpDrawer from './components/HelpDrawer';
import AuthBanner from './components/AuthBanner';
import UserMenu from './components/UserMenu';
import { useSettingsStore } from './store/useSettingsStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useDebouncedSearch } from './hooks/useDebouncedSearch';
import { useLazyDates } from './hooks/useLazyDates';
import { useMobileLayout } from './hooks/useMobileLayout';
import { useSwipeGesture } from './hooks/useSwipeGesture';
import { useHapticFeedback } from './hooks/useHapticFeedback';
import { useKeyboardDetection } from './hooks/useKeyboardDetection';
import { Item } from './types';
import { useAuthStore } from './store/useAuthStore';
import { useStore } from './store/useStore';
import * as syncService from './services/syncService';

function App() {
  const [searchInput, setSearchInput] = useState('');
  const searchQuery = useDebouncedSearch(searchInput, 300);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const viewMode = useSettingsStore((state) => state.viewMode);
  const activeMobilePane = useSettingsStore((state) => state.activeMobilePane);
  const setActiveMobilePane = useSettingsStore((state) => state.setActiveMobilePane);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const thoughtsPaneRef = useRef<ThoughtsPaneHandle>(null);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  // Mobile layout detection
  const { isMobile } = useMobileLayout();
  const { triggerHaptic } = useHapticFeedback();
  const { isKeyboardVisible } = useKeyboardDetection();

  // Setup undo/redo
  const { undo, redo } = useUndoRedo();

  // Auth state - directly access mode instead of calling function
  const authMode = useAuthStore((state) => state.mode);
  const authUserId = useAuthStore((state) => state.user?.id);

  // Fetch items from Supabase on authentication
  useEffect(() => {
    if (authMode === 'authenticated' && authUserId) {
      syncService
        .fetchItems()
        .then((items) => {
          // Replace local items with Supabase items (skip history to avoid undo/redo issues)
          useStore.setState({ items, skipHistory: false });
        })
        .catch((error) => {
          console.error('Error fetching items from Supabase:', error);
        });
    }
  }, [authMode, authUserId]);

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

  // Mobile swipe gesture for pane switching
  useSwipeGesture(swipeContainerRef as React.RefObject<HTMLDivElement>, {
    onSwipeLeft: () => {
      if (isMobile && activeMobilePane === 'thoughts') {
        triggerHaptic('light');
        setActiveMobilePane('time');
      }
    },
    onSwipeRight: () => {
      if (isMobile && activeMobilePane === 'time') {
        triggerHaptic('light');
        setActiveMobilePane('thoughts');
      }
    },
    preventScroll: false, // Allow vertical scrolling
  });

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
        } else if (isHelpOpen) {
          setIsHelpOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        }
      },
      description: 'Close search, help, or settings',
    },
  ]);

  return (
    <div className="h-full flex flex-col bg-background text-text-primary">
      {/* Skip Navigation Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-text-primary focus:text-background focus:rounded-sm"
      >
        Skip to main content
      </a>

      {/* Auth Banner - Guest Mode Only */}
      <AuthBanner />

      {/* Settings Modal */}
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Help Drawer */}
      <HelpDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Header - Desktop only */}
      {!isMobile && (
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
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="text-base hover:opacity-70 transition-opacity"
              title="Input help"
              aria-label={isHelpOpen ? 'Close help' : 'Open input help'}
            >
              ?
            </button>
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

            {/* User Menu */}
            <UserMenu />
          </div>
        </header>
      )}

      {/* Main Content */}
      <main id="main-content" ref={swipeContainerRef} className="flex-1 flex overflow-hidden">
        {isMobile ? (
          /* Mobile: Single pane based on activeMobilePane */
          <div className="w-full">
            {activeMobilePane === 'thoughts' ? (
              <PaneErrorBoundary paneName="Thoughts Pane">
                <ThoughtsPane
                  ref={thoughtsPaneRef}
                  searchQuery={searchQuery}
                  viewMode={viewMode}
                  currentDate={thoughtsCurrentDate}
                  onNextDay={goToNextDayThoughts}
                  onPreviousDay={goToPreviousDayThoughts}
                  highlightedItemId={highlightedItemId}
                  isMobile={true}
                />
              </PaneErrorBoundary>
            ) : (
              <PaneErrorBoundary paneName="Time Pane">
                <TimePane
                  searchQuery={searchQuery}
                  viewMode={viewMode}
                  currentDate={timeCurrentDate}
                  onNextDay={goToNextDayTime}
                  onPreviousDay={goToPreviousDayTime}
                  onJumpToSource={handleJumpToSource}
                  isMobile={true}
                />
              </PaneErrorBoundary>
            )}
          </div>
        ) : (
          /* Desktop: Two-pane layout */
          <>
            {/* Thoughts Pane - Left */}
            <div className="w-1/2 border-r border-border-subtle">
              <PaneErrorBoundary paneName="Thoughts Pane">
                <ThoughtsPane
                  ref={thoughtsPaneRef}
                  searchQuery={searchQuery}
                  viewMode={viewMode}
                  currentDate={thoughtsCurrentDate}
                  onNextDay={goToNextDayThoughts}
                  onPreviousDay={goToPreviousDayThoughts}
                  highlightedItemId={highlightedItemId}
                  isMobile={false}
                />
              </PaneErrorBoundary>
            </div>

            {/* Time Pane - Right */}
            <div className="w-1/2">
              <PaneErrorBoundary paneName="Time Pane">
                <TimePane
                  searchQuery={searchQuery}
                  viewMode={viewMode}
                  currentDate={timeCurrentDate}
                  onNextDay={goToNextDayTime}
                  onPreviousDay={goToPreviousDayTime}
                  onJumpToSource={handleJumpToSource}
                  isMobile={false}
                />
              </PaneErrorBoundary>
            </div>
          </>
        )}
      </main>

      {/* Mobile Footer */}
      {isMobile && (
        <MobileFooter
          activePane={activeMobilePane}
          onPaneSwitch={(pane) => {
            triggerHaptic('light');
            setActiveMobilePane(pane);
          }}
          onSearchClick={() => {
            triggerHaptic('light');
            setIsSearchOpen(true);
          }}
          onHelpClick={() => {
            triggerHaptic('light');
            setIsHelpOpen(true);
          }}
          onSettingsClick={() => {
            triggerHaptic('light');
            setIsSettingsOpen(true);
          }}
          isVisible={!isKeyboardVisible}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
