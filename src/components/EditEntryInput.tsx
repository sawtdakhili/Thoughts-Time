interface EditEntryInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Reusable inline edit input for timeline entries.
 * Used by TimePane for editing todos and events.
 */
function EditEntryInput({ value, onChange, onKeyDown, onSave, onCancel }: EditEntryInputProps) {
  return (
    <div className="flex items-center gap-8">
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="flex-1 px-8 py-4 bg-hover-bg border border-border-subtle rounded-sm font-serif text-base"
        autoFocus
      />
      <button
        onClick={onSave}
        className="text-sm text-text-secondary hover:text-text-primary"
        title="Save (Enter)"
      >
        ✓
      </button>
      <button
        onClick={onCancel}
        className="text-sm text-text-secondary hover:text-text-primary"
        title="Cancel (Esc)"
      >
        ✕
      </button>
    </div>
  );
}

export default EditEntryInput;
