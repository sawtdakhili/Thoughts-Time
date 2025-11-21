import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimePromptModal from './TimePromptModal';

describe('TimePromptModal', () => {
  const defaultProps = {
    isOpen: true,
    isEvent: false,
    content: 'Test content',
    timeFormat: '24h' as const,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<TimePromptModal {...defaultProps} />);
      expect(screen.getByText('What time?')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<TimePromptModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('What time?')).not.toBeInTheDocument();
    });
  });

  describe('task mode (single time)', () => {
    it('shows single time input for non-events', () => {
      const { container } = render(<TimePromptModal {...defaultProps} />);
      // Custom TimeInput uses text input
      const timeInputs = container.querySelectorAll('input[type="text"]');
      expect(timeInputs).toHaveLength(1);
    });

    it('displays correct title for tasks', () => {
      render(<TimePromptModal {...defaultProps} />);
      expect(screen.getByText('What time?')).toBeInTheDocument();
    });

    it('displays content text', () => {
      render(<TimePromptModal {...defaultProps} />);
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('event mode (start and end time)', () => {
    it('shows two time inputs for events', () => {
      const { container } = render(<TimePromptModal {...defaultProps} isEvent={true} />);
      // Custom TimeInput uses text input
      const timeInputs = container.querySelectorAll('input[type="text"]');
      expect(timeInputs).toHaveLength(2);
    });

    it('displays correct title for events', () => {
      render(<TimePromptModal {...defaultProps} isEvent={true} />);
      expect(screen.getByText('When does it start and end?')).toBeInTheDocument();
    });

    it('shows Add Times button for events', () => {
      render(<TimePromptModal {...defaultProps} isEvent={true} />);
      expect(screen.getByText('Add Times')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onCancel when Cancel button is clicked', () => {
      render(<TimePromptModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(defaultProps.onCancel).toHaveBeenCalledOnce();
    });

    it('calls onSubmit with time when Add Time button is clicked', () => {
      const { container } = render(<TimePromptModal {...defaultProps} />);
      const timeInput = container.querySelector('input[type="text"]')!;
      // Simulate typing "14:30"
      fireEvent.change(timeInput, { target: { value: '14:30' } });
      fireEvent.click(screen.getByText('Add Time'));
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('14:30', undefined);
    });

    it('calls onSubmit with start and end times for events', () => {
      const { container } = render(<TimePromptModal {...defaultProps} isEvent={true} />);
      const timeInputs = container.querySelectorAll('input[type="text"]');
      fireEvent.change(timeInputs[0], { target: { value: '09:00' } });
      fireEvent.change(timeInputs[1], { target: { value: '10:00' } });
      fireEvent.click(screen.getByText('Add Times'));
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('09:00', '10:00');
    });

    it('does not call onSubmit when time is empty', () => {
      render(<TimePromptModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Add Time'));
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when event end time is empty', () => {
      const { container } = render(<TimePromptModal {...defaultProps} isEvent={true} />);
      const timeInputs = container.querySelectorAll('input[type="text"]');
      fireEvent.change(timeInputs[0], { target: { value: '09:00' } });
      fireEvent.click(screen.getByText('Add Times'));
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('keyboard shortcuts', () => {
    it('calls onCancel when Escape is pressed', () => {
      const { container } = render(<TimePromptModal {...defaultProps} />);
      const timeInput = container.querySelector('input[type="text"]')!;
      fireEvent.keyDown(timeInput, { key: 'Escape' });
      expect(defaultProps.onCancel).toHaveBeenCalledOnce();
    });

    it('submits on Enter when time is filled', () => {
      const { container } = render(<TimePromptModal {...defaultProps} />);
      const timeInput = container.querySelector('input[type="text"]')!;
      fireEvent.change(timeInput, { target: { value: '15:00' } });
      fireEvent.keyDown(timeInput, { key: 'Enter' });
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('15:00');
    });
  });
});
