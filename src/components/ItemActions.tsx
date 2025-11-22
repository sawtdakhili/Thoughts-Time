interface ItemActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onJumpToSource?: () => void;
}

/**
 * Action buttons (edit/delete) that appear on hover for items.
 */
function ItemActions({ onEdit, onDelete, onJumpToSource }: ItemActionsProps) {
  return (
    <div className="flex gap-4 flex-shrink-0">
      {onJumpToSource && (
        <button
          onClick={onJumpToSource}
          className="text-xs text-text-secondary hover:text-text-primary"
          title="Jump to source"
          aria-label="Jump to source"
        >
          ↸
        </button>
      )}
      <button
        onClick={onEdit}
        className="text-xs text-text-secondary hover:text-text-primary"
        title="Edit"
        aria-label="Edit item"
      >
        ✎
      </button>
      <button
        onClick={onDelete}
        className="text-xs text-text-secondary hover:text-text-primary"
        title="Delete"
        aria-label="Delete item"
      >
        ×
      </button>
    </div>
  );
}

export default ItemActions;
