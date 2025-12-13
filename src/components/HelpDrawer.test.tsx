import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HelpDrawer from './HelpDrawer';

describe('HelpDrawer', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('does not render when closed', () => {
      render(<HelpDrawer isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders when open', () => {
      render(<HelpDrawer isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Input Prefixes')).toBeInTheDocument();
    });
  });

  describe('prefix buttons', () => {
    it('renders all four prefix buttons', () => {
      render(<HelpDrawer isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('t')).toBeInTheDocument();
      expect(screen.getByText('e')).toBeInTheDocument();
      expect(screen.getByText('r')).toBeInTheDocument();
      expect(screen.getByText('n')).toBeInTheDocument();
    });

    it('renders prefix names', () => {
      render(<HelpDrawer isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText(/Todo/)).toBeInTheDocument();
      expect(screen.getByText(/Event/)).toBeInTheDocument();
      expect(screen.getByText(/Routine/)).toBeInTheDocument();
      expect(screen.getByText(/Note/)).toBeInTheDocument();
    });

    it('renders prefix symbols', () => {
      render(<HelpDrawer isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('□')).toBeInTheDocument();
      expect(screen.getByText('↹')).toBeInTheDocument();
      expect(screen.getByText('↻')).toBeInTheDocument();
      expect(screen.getByText('↝')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClose when close button is clicked', () => {
      render(<HelpDrawer isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close help');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      render(<HelpDrawer isOpen={true} onClose={mockOnClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('opens popup when prefix button is clicked', () => {
      render(<HelpDrawer isOpen={true} onClose={mockOnClose} />);

      // Click on the Todo button (find by prefix letter, then get parent button)
      const todoButton = screen.getByText('t').closest('button');
      fireEvent.click(todoButton!);

      // Should show the popup with example
      expect(screen.getByText('Example')).toBeInTheDocument();
      expect(screen.getByText(/t Buy groceries/)).toBeInTheDocument();
    });
  });

  describe('prefix popup', () => {
    it('shows prefix details when clicked', () => {
      render(<HelpDrawer isOpen={true} onClose={mockOnClose} />);

      // Click Event prefix (find by prefix letter)
      const eventButton = screen.getByText('e').closest('button');
      fireEvent.click(eventButton!);

      expect(screen.getByText('Creates a calendar event with start/end time')).toBeInTheDocument();
      expect(screen.getByText(/e Meeting with team/)).toBeInTheDocument();
    });

    it('closes popup when "Got it" button is clicked', () => {
      render(<HelpDrawer isOpen={true} onClose={mockOnClose} />);

      // Open popup (find by prefix letter)
      const noteButton = screen.getByText('n').closest('button');
      fireEvent.click(noteButton!);

      expect(screen.getByText('Got it')).toBeInTheDocument();

      // Close popup
      fireEvent.click(screen.getByText('Got it'));

      // Popup should be closed, but drawer still open
      expect(screen.queryByText('Got it')).not.toBeInTheDocument();
      expect(screen.getByText('Input Prefixes')).toBeInTheDocument();
    });

    it('closes popup when Escape is pressed (drawer remains open)', () => {
      render(<HelpDrawer isOpen={true} onClose={mockOnClose} />);

      // Open popup (find by prefix letter)
      const routineButton = screen.getByText('r').closest('button');
      fireEvent.click(routineButton!);

      expect(screen.getByText('Got it')).toBeInTheDocument();

      // Press Escape - should close popup but not drawer
      fireEvent.keyDown(document, { key: 'Escape' });

      // Popup closed
      expect(screen.queryByText('Got it')).not.toBeInTheDocument();
      // Drawer still open
      expect(screen.getByText('Input Prefixes')).toBeInTheDocument();
      // onClose not called (popup intercepted Escape)
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has proper dialog role and aria attributes', () => {
      render(<HelpDrawer isOpen={true} onClose={mockOnClose} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Input prefix help');
    });

    it('has accessible close button', () => {
      render(<HelpDrawer isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByLabelText('Close help')).toBeInTheDocument();
    });

    it('backdrop is marked as aria-hidden', () => {
      render(<HelpDrawer isOpen={true} onClose={mockOnClose} />);

      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });
  });
});
