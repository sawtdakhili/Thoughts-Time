import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemActions from './ItemActions';

describe('ItemActions', () => {
  it('renders edit and delete buttons', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();

    render(<ItemActions onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByLabelText('Edit item')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete item')).toBeInTheDocument();
  });

  it('renders jump to source button when provided', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnJumpToSource = vi.fn();

    render(
      <ItemActions
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onJumpToSource={mockOnJumpToSource}
      />
    );

    expect(screen.getByLabelText('Jump to source')).toBeInTheDocument();
  });

  it('does not render jump to source button when not provided', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();

    render(<ItemActions onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.queryByLabelText('Jump to source')).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();

    render(<ItemActions onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByLabelText('Edit item'));
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();

    render(<ItemActions onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByLabelText('Delete item'));
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onJumpToSource when jump button is clicked', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnJumpToSource = vi.fn();

    render(
      <ItemActions
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onJumpToSource={mockOnJumpToSource}
      />
    );

    fireEvent.click(screen.getByLabelText('Jump to source'));
    expect(mockOnJumpToSource).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnJumpToSource = vi.fn();

    render(
      <ItemActions
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onJumpToSource={mockOnJumpToSource}
      />
    );

    // Check aria-labels
    const editButton = screen.getByLabelText('Edit item');
    const deleteButton = screen.getByLabelText('Delete item');
    const jumpButton = screen.getByLabelText('Jump to source');

    expect(editButton).toHaveAttribute('title', 'Edit');
    expect(deleteButton).toHaveAttribute('title', 'Delete');
    expect(jumpButton).toHaveAttribute('title', 'Jump to source');
  });
});
