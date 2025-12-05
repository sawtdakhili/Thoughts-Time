import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BottomSheet from './BottomSheet';

// Mock the hooks
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null }),
}));

vi.mock('../hooks/useSwipeGesture', () => ({
  useSwipeGesture: vi.fn(),
}));

describe('BottomSheet', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      render(
        <BottomSheet isOpen={false} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render backdrop when open', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const backdrop = container.querySelector('.bg-black.bg-opacity-50');
      expect(backdrop).toBeInTheDocument();
    });

    it('should render with title when provided', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose} title="Test Title">
          <div>Test Content</div>
        </BottomSheet>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should not render title when not provided', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const titleElement = container.querySelector('#bottom-sheet-title');
      expect(titleElement).not.toBeInTheDocument();
    });

    it('should render drag handle by default', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const handle = container.querySelector('.w-32.h-1');
      expect(handle).toBeInTheDocument();
    });

    it('should not render handle when showHandle is false', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose} showHandle={false}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const handle = container.querySelector('.w-32.h-1');
      expect(handle).not.toBeInTheDocument();
    });
  });

  describe('Height Settings', () => {
    it('should render with half height by default (60%)', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const sheet = container.querySelector('[role="dialog"]');
      expect(sheet).toHaveStyle({ height: '60%' });
    });

    it('should render with full height when specified (90%)', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose} height="full">
          <div>Test Content</div>
        </BottomSheet>
      );

      const sheet = container.querySelector('[role="dialog"]');
      expect(sheet).toHaveStyle({ height: '90%' });
    });

    it('should render with custom numeric height', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose} height={75}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const sheet = container.querySelector('[role="dialog"]');
      expect(sheet).toHaveStyle({ height: '75%' });
    });
  });

  describe('Interactions', () => {
    it('should call onClose when backdrop is clicked', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const backdrop = container.querySelector('.bg-black.bg-opacity-50');
      if (backdrop) {
        fireEvent.click(backdrop as HTMLElement);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when Escape is pressed while closed', () => {
      render(
        <BottomSheet isOpen={false} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when open', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unlock body scroll when closed', () => {
      const { rerender } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <BottomSheet isOpen={false} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      expect(document.body.style.overflow).toBe('');
    });

    it('should restore body scroll on unmount', () => {
      const { unmount } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Styling', () => {
    it('should have correct z-index layers', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const backdrop = container.querySelector('.z-50');
      const sheet = container.querySelector('.z-60');

      expect(backdrop).toBeInTheDocument();
      expect(sheet).toBeInTheDocument();
    });

    it('should have rounded top corners', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const sheet = container.querySelector('[role="dialog"]');
      expect(sheet).toHaveStyle({
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
      });
    });

    it('should have slide up animation', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const sheet = container.querySelector('[role="dialog"]');
      expect(sheet).toHaveClass('animate-slide-up');
    });

    it('should have fixed positioning at bottom', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const sheet = container.querySelector('[role="dialog"]');
      expect(sheet).toHaveClass('fixed');
      expect(sheet).toHaveClass('bottom-0');
      expect(sheet).toHaveClass('left-0');
      expect(sheet).toHaveClass('right-0');
    });

    it('should have iOS safe area padding', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const sheet = container.querySelector('[role="dialog"]');
      expect(sheet).toHaveStyle({
        paddingBottom: 'env(safe-area-inset-bottom)',
      });
    });

    it('should have border on top', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const sheet = container.querySelector('[role="dialog"]');
      expect(sheet).toHaveClass('border-t');
      expect(sheet).toHaveClass('border-border-subtle');
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby when title is provided', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose} title="Test Title">
          <div>Test Content</div>
        </BottomSheet>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'bottom-sheet-title');

      const title = screen.getByText('Test Title');
      expect(title).toHaveAttribute('id', 'bottom-sheet-title');
    });

    it('should not have aria-labelledby when title is not provided', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).not.toHaveAttribute('aria-labelledby');
    });

    it('should mark backdrop as aria-hidden', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('should mark drag handle as aria-hidden', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const handleContainer = container.querySelector('.flex.justify-center.py-3');
      expect(handleContainer).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Content Layout', () => {
    it('should have scrollable content area', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const content = container.querySelector('.flex-1.overflow-y-auto');
      expect(content).toBeInTheDocument();
    });

    it('should render children in content area', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div data-testid="child-element">Child Content</div>
        </BottomSheet>
      );

      expect(screen.getByTestId('child-element')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should have proper padding in content area', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </BottomSheet>
      );

      const content = container.querySelector('.px-24.py-16');
      expect(content).toBeInTheDocument();
    });
  });
});
