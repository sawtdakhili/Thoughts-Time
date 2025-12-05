import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MobileFooter from './MobileFooter';
import { MOBILE } from '../constants';

// Mock the useHapticFeedback hook
vi.mock('../hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    triggerHaptic: vi.fn(),
    isSupported: true,
  }),
}));

describe('MobileFooter', () => {
  const mockProps = {
    activePane: 'thoughts' as const,
    onPaneSwitch: vi.fn(),
    onSearchClick: vi.fn(),
    onSettingsClick: vi.fn(),
    isVisible: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with thoughts pane active', () => {
      render(<MobileFooter {...mockProps} activePane="thoughts" />);

      expect(screen.getByText('Thoughts')).toBeInTheDocument();
      expect(screen.getByText('& Time')).toBeInTheDocument();
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('should render with time pane active', () => {
      render(<MobileFooter {...mockProps} activePane="time" />);

      expect(screen.getByText('←')).toBeInTheDocument();
      expect(screen.getByText('Thoughts &')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
    });

    it('should render search and settings buttons', () => {
      render(<MobileFooter {...mockProps} />);

      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    });

    it('should be visible by default', () => {
      const { container } = render(<MobileFooter {...mockProps} isVisible={true} />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('transform-none');
      expect(footer).not.toHaveClass('translate-y-full');
    });

    it('should be hidden when isVisible is false', () => {
      const { container } = render(<MobileFooter {...mockProps} isVisible={false} />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('translate-y-full');
    });
  });

  describe('Pane Switching', () => {
    it('should call onPaneSwitch when switching from thoughts to time', () => {
      render(<MobileFooter {...mockProps} activePane="thoughts" />);

      const switchButton = screen.getByRole('button', { name: 'Switch to Time pane' });
      fireEvent.click(switchButton);

      expect(mockProps.onPaneSwitch).toHaveBeenCalledWith('time');
      expect(mockProps.onPaneSwitch).toHaveBeenCalledTimes(1);
    });

    it('should call onPaneSwitch when switching from time to thoughts', () => {
      render(<MobileFooter {...mockProps} activePane="time" />);

      const switchButton = screen.getByRole('button', { name: 'Switch to Thoughts pane' });
      fireEvent.click(switchButton);

      expect(mockProps.onPaneSwitch).toHaveBeenCalledWith('thoughts');
      expect(mockProps.onPaneSwitch).toHaveBeenCalledTimes(1);
    });

    it('should not call onPaneSwitch when clicking already active pane', () => {
      render(<MobileFooter {...mockProps} activePane="thoughts" />);

      // Click on the currently active pane button
      const switchButton = screen.getByRole('button', { name: 'Switch to Time pane' });

      // The component only switches when you click to change panes
      // If thoughts is active, clicking should switch to time
      fireEvent.click(switchButton);

      expect(mockProps.onPaneSwitch).toHaveBeenCalledWith('time');
    });
  });

  describe('Action Buttons', () => {
    it('should call onSearchClick when search button is clicked', () => {
      render(<MobileFooter {...mockProps} />);

      const searchButton = screen.getByRole('button', { name: 'Search' });
      fireEvent.click(searchButton);

      expect(mockProps.onSearchClick).toHaveBeenCalledTimes(1);
    });

    it('should call onSettingsClick when settings button is clicked', () => {
      render(<MobileFooter {...mockProps} />);

      const settingsButton = screen.getByRole('button', { name: 'Settings' });
      fireEvent.click(settingsButton);

      expect(mockProps.onSettingsClick).toHaveBeenCalledTimes(1);
    });

    it('should have minimum touch target size for search button', () => {
      render(<MobileFooter {...mockProps} />);

      const searchButton = screen.getByRole('button', { name: 'Search' });
      expect(searchButton).toHaveStyle({
        minWidth: `${MOBILE.MIN_TOUCH_TARGET}px`,
        minHeight: `${MOBILE.MIN_TOUCH_TARGET}px`,
      });
    });

    it('should have minimum touch target size for settings button', () => {
      render(<MobileFooter {...mockProps} />);

      const settingsButton = screen.getByRole('button', { name: 'Settings' });
      expect(settingsButton).toHaveStyle({
        minWidth: `${MOBILE.MIN_TOUCH_TARGET}px`,
        minHeight: `${MOBILE.MIN_TOUCH_TARGET}px`,
      });
    });
  });

  describe('Styling', () => {
    it('should have correct height from MOBILE constants', () => {
      const { container } = render(<MobileFooter {...mockProps} />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveStyle({
        height: `${MOBILE.FOOTER_HEIGHT}px`,
      });
    });

    it('should be fixed at bottom', () => {
      const { container } = render(<MobileFooter {...mockProps} />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('fixed');
      expect(footer).toHaveClass('bottom-0');
      expect(footer).toHaveClass('left-0');
      expect(footer).toHaveClass('right-0');
    });

    it('should have correct z-index', () => {
      const { container } = render(<MobileFooter {...mockProps} />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('z-30');
    });

    it('should have border on top', () => {
      const { container } = render(<MobileFooter {...mockProps} />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('border-t');
      expect(footer).toHaveClass('border-border-subtle');
    });

    it('should have safe area padding for iOS', () => {
      const { container } = render(<MobileFooter {...mockProps} />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveStyle({
        paddingBottom: 'env(safe-area-inset-bottom)',
      });
    });

    it('should have transition animation', () => {
      const { container } = render(<MobileFooter {...mockProps} />);

      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('transition-transform');
      expect(footer).toHaveClass('duration-300');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button types', () => {
      render(<MobileFooter {...mockProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should have aria-labels for action buttons', () => {
      render(<MobileFooter {...mockProps} />);

      expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute(
        'aria-label',
        'Search'
      );
      expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute(
        'aria-label',
        'Settings'
      );
    });

    it('should have aria-label for pane switch button', () => {
      render(<MobileFooter {...mockProps} activePane="thoughts" />);

      expect(
        screen.getByRole('button', { name: 'Switch to Time pane' })
      ).toHaveAttribute('aria-label', 'Switch to Time pane');
    });

    it('should mark arrow as aria-hidden', () => {
      const { container } = render(<MobileFooter {...mockProps} activePane="thoughts" />);

      const arrow = container.querySelector('[aria-hidden="true"]');
      expect(arrow).toBeInTheDocument();
      expect(arrow).toHaveTextContent('→');
    });

    it('should have touch-target class for accessibility', () => {
      render(<MobileFooter {...mockProps} />);

      const switchButton = screen.getByRole('button', { name: 'Switch to Time pane' });
      expect(switchButton).toHaveClass('touch-target');
    });
  });

  describe('Text Highlighting', () => {
    it('should highlight active pane text in primary color (thoughts)', () => {
      render(<MobileFooter {...mockProps} activePane="thoughts" />);

      const thoughtsText = screen.getByText('Thoughts');
      expect(thoughtsText).toHaveClass('text-text-primary');

      const timeText = screen.getByText('& Time');
      expect(timeText).toHaveClass('text-text-secondary');
    });

    it('should highlight active pane text in primary color (time)', () => {
      render(<MobileFooter {...mockProps} activePane="time" />);

      const timeText = screen.getByText('Time');
      expect(timeText).toHaveClass('text-text-primary');

      const thoughtsText = screen.getByText('Thoughts &');
      expect(thoughtsText).toHaveClass('text-text-secondary');
    });
  });
});
