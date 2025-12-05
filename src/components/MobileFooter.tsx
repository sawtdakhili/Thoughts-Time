import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { MOBILE } from '../constants';

interface MobileFooterProps {
  activePane: 'thoughts' | 'time';
  onPaneSwitch: (pane: 'thoughts' | 'time') => void;
  onSearchClick: () => void;
  onSettingsClick: () => void;
  isVisible: boolean;
}

/**
 * Mobile footer navigation with pane switching and action buttons
 */
export default function MobileFooter({
  activePane,
  onPaneSwitch,
  onSearchClick,
  onSettingsClick,
  isVisible,
}: MobileFooterProps) {
  const { triggerHaptic } = useHapticFeedback();

  const handlePaneSwitch = (pane: 'thoughts' | 'time') => {
    if (pane !== activePane) {
      triggerHaptic('light');
      onPaneSwitch(pane);
    }
  };

  const handleSearchClick = () => {
    triggerHaptic('light');
    onSearchClick();
  };

  const handleSettingsClick = () => {
    triggerHaptic('light');
    onSettingsClick();
  };

  return (
    <footer
      className={`
        fixed bottom-0 left-0 right-0 z-30
        bg-background border-t border-border-subtle
        flex items-center justify-between
        px-16 transition-transform duration-300
        ${isVisible ? 'transform-none' : 'translate-y-full'}
      `}
      style={{
        height: `${MOBILE.FOOTER_HEIGHT}px`,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Pane Switcher */}
      <div className="flex items-center gap-2">
        {activePane === 'thoughts' ? (
          <button
            onClick={() => handlePaneSwitch('time')}
            className="flex items-center gap-2 text-base font-serif touch-target"
            aria-label="Switch to Time pane"
            type="button"
          >
            <span className="text-text-primary">Thoughts</span>
            <span className="text-text-secondary">& Time</span>
            <span className="text-text-secondary" aria-hidden="true">
              →
            </span>
          </button>
        ) : (
          <button
            onClick={() => handlePaneSwitch('thoughts')}
            className="flex items-center gap-2 text-base font-serif touch-target"
            aria-label="Switch to Thoughts pane"
            type="button"
          >
            <span className="text-text-secondary" aria-hidden="true">
              ←
            </span>
            <span className="text-text-secondary">Thoughts &</span>
            <span className="text-text-primary">Time</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-12">
        <button
          onClick={handleSearchClick}
          className="text-base touch-target"
          aria-label="Search"
          type="button"
          style={{
            minWidth: `${MOBILE.MIN_TOUCH_TARGET}px`,
            minHeight: `${MOBILE.MIN_TOUCH_TARGET}px`,
          }}
        >
          🔍
        </button>
        <button
          onClick={handleSettingsClick}
          className="text-base touch-target"
          aria-label="Settings"
          type="button"
          style={{
            minWidth: `${MOBILE.MIN_TOUCH_TARGET}px`,
            minHeight: `${MOBILE.MIN_TOUCH_TARGET}px`,
          }}
        >
          ⚙️
        </button>
      </div>
    </footer>
  );
}
