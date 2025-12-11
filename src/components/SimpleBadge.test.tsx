import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SimpleBadge from './SimpleBadge';

describe('SimpleBadge', () => {
  it('renders with default label', () => {
    render(<SimpleBadge />);

    const btn = screen.getByRole('button', { name: 'Badge' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Badge');
  });

  it('renders with custom label', () => {
    render(<SimpleBadge label="New" />);

    const btn = screen.getByRole('button', { name: 'New' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('New');
  });

  it('applies accent variant classes', () => {
    render(<SimpleBadge variant="accent" label="Accent" />);

    const btn = screen.getByRole('button', { name: 'Accent' });
    expect(btn).toHaveClass('bg-accent');
    expect(btn).toHaveClass('text-white');
  });

  it('calls onClick when clicked', () => {
    const handler = vi.fn();
    render(<SimpleBadge onClick={handler} label="Click" />);

    const btn = screen.getByRole('button', { name: 'Click' });
    fireEvent.click(btn);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
