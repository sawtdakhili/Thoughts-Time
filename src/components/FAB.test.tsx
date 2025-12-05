import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FAB from './FAB';
import { MOBILE } from '../constants';

// Mock the useHapticFeedback hook
vi.mock('../hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    triggerHaptic: vi.fn(),
    isSupported: true,
  }),
}));

describe('FAB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<FAB onClick={vi.fn()} />);

    const button = screen.getByRole('button', { name: 'Add' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('+');
  });

  it('should render with custom icon and label', () => {
    render(<FAB onClick={vi.fn()} icon="✓" label="Complete" />);

    const button = screen.getByRole('button', { name: 'Complete' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('✓');
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<FAB onClick={handleClick} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should have correct size from MOBILE constants', () => {
    render(<FAB onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveStyle({
      width: `${MOBILE.FAB_SIZE}px`,
      height: `${MOBILE.FAB_SIZE}px`,
    });
  });

  it('should be positioned above footer', () => {
    render(<FAB onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveStyle({
      bottom: `${MOBILE.FOOTER_HEIGHT + 16}px`,
    });
  });

  it('should render at bottom-right by default', () => {
    render(<FAB onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('right-16');
  });

  it('should render at bottom-center when specified', () => {
    render(<FAB onClick={vi.fn()} position="bottom-center" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('left-1/2');
    expect(button).toHaveClass('-translate-x-1/2');
  });

  it('should be visible by default', () => {
    render(<FAB onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-100');
    expect(button).not.toHaveClass('pointer-events-none');
  });

  it('should be hidden when hidden prop is true', () => {
    render(<FAB onClick={vi.fn()} hidden={true} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-0');
    expect(button).toHaveClass('pointer-events-none');
  });

  it('should have circular shape', () => {
    render(<FAB onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveStyle({
      borderRadius: '50%',
    });
  });

  it('should have proper z-index', () => {
    render(<FAB onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('z-40');
  });

  it('should have fab animation class', () => {
    render(<FAB onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('animate-fab-in');
  });

  it('should have shadow styling', () => {
    render(<FAB onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveStyle({
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    });
  });

  it('should have proper color scheme', () => {
    render(<FAB onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    const styleAttr = button.getAttribute('style');
    expect(styleAttr).toContain('background-color: var(--color-text-primary)');
    expect(styleAttr).toContain('color: var(--color-background)');
  });

  it('should be keyboard accessible', () => {
    const handleClick = vi.fn();
    render(<FAB onClick={handleClick} />);

    const button = screen.getByRole('button');
    button.focus();

    expect(button).toHaveFocus();
  });

  it('should have button type', () => {
    render(<FAB onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });
});
