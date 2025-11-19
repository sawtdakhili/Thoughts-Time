import { useState } from 'react';
import { format } from 'date-fns';
import { Item, Todo, Routine, Note, Event } from '../types';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { parseInput } from '../utils/parser';
import { createItem } from '../utils/itemFactory';
import { symbolsToPrefix, formatTimeForDisplay, prefixToSymbol, symbolToPrefix as symbolToPrefixMap } from '../utils/formatting';
import { useToast } from '../hooks/useToast';
import ConfirmDialog from './ConfirmDialog';

interface ItemDisplayProps {
  item: Item;
  depth?: number;
  showTime?: boolean;
  sourcePane?: 'thoughts' | 'time';
}

function ItemDisplay({ item, depth = 0, showTime = true, sourcePane = 'thoughts' }: ItemDisplayProps) {
  const toggleTodoComplete = useStore((state) => state.toggleTodoComplete);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);
  const addItemDirect = useStore((state) => state.addItemDirect);
  const items = useStore((state) => state.items);
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const addToast = useToast((state) => state.addToast);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [timePrompt, setTimePrompt] = useState<{ content: string; isEvent: boolean } | null>(null);
  const [promptedTime, setPromptedTime] = useState('');
  const [promptedEndTime, setPromptedEndTime] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; message: string; hasChildren: boolean }>({
    isOpen: false,
    message: '',
    hasChildren: false,
  });

  const getSymbol = () => {
    switch (item.type) {
      case 'todo':
        const todo = item as Todo;
        return todo.completedAt ? '☑' : '□';
      case 'event':
        return '↹';
      case 'routine':
        return '↻';
      case 'note':
        return '↝';
      default:
        return '';
    }
  };

  const getTimeDisplay = () => {
    // Only show timestamp for top-level items when showTime is true
    if (depth === 0 && showTime) {
      const formatPattern = timeFormat === '24h' ? 'HH:mm' : 'h:mm a';
      const time = format(new Date(item.createdAt), formatPattern);
      return time;
    }
    return null;
  };

  const handleToggleComplete = () => {
    if (item.type === 'todo') {
      toggleTodoComplete(item.id);
    }
  };

  const handleEdit = () => {
    // Initialize edit content with symbol + content
    const symbol = getSymbol();
    if (symbol && item.type !== 'note') {
      // For todos, events, routines: show symbol
      setEditContent(`${symbol} ${item.content}`);
    } else {
      // For notes: no prefix or symbol
      setEditContent(item.content);
    }
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) {
      setIsEditing(false);
      return;
    }

    // Convert symbols back to prefixes before parsing
    const contentWithPrefix = symbolsToPrefix(editContent.trim());

    // Re-parse the full line (with prefix) to detect type changes
    const parsed = parseInput(contentWithPrefix);

    // Check if time prompt is needed
    if (parsed.needsTimePrompt) {
      setTimePrompt({
        content: editContent.trim(),
        isEvent: parsed.type === 'event',
      });
      return;
    }

    // If type changed, delete old item and create new one
    if (parsed.type !== item.type) {
      // Create new item with parsed data, preserving original creation time
      const newItemData = createItem({
        content: parsed.content,
        createdAt: item.createdAt,
        createdDate: item.createdDate,
        parsed,
        userId: item.userId,
      });

      // Delete old and add new
      deleteItem(item.id);
      addItemDirect({ ...newItemData, id: item.id });
    } else {
      // Same type, just update
      const updates: Partial<Item> = { content: parsed.content };

      if (item.type === 'todo') {
        Object.assign(updates, {
          scheduledTime: parsed.scheduledTime !== null ? parsed.scheduledTime : (item as Todo).scheduledTime,
          hasTime: parsed.hasTime,
        });
      } else if (item.type === 'event') {
        Object.assign(updates, {
          startTime: parsed.scheduledTime || (item as Event).startTime,
          endTime: parsed.endTime || parsed.scheduledTime || (item as Event).endTime,
          hasTime: parsed.hasTime,
        });
      } else if (item.type === 'routine') {
        Object.assign(updates, {
          scheduledTime: parsed.scheduledTime ? format(parsed.scheduledTime, 'HH:mm') : (item as Routine).scheduledTime,
          hasTime: parsed.hasTime,
          recurrencePattern: parsed.recurrencePattern || (item as Routine).recurrencePattern,
        });
      }

      updateItem(item.id, updates);
    }

    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent('');
    setIsEditing(false);
  };


  const handleTimePromptSubmit = () => {
    if (!timePrompt || !promptedTime) return;

    // For events, also require end time
    if (timePrompt.isEvent && !promptedEndTime) return;

    // Update content with time (formatted for readability)
    let updatedContent: string;
    if (timePrompt.isEvent) {
      // Events: "from X to Y"
      updatedContent = timePrompt.content + ' from ' + formatTimeForDisplay(promptedTime, timeFormat) + ' to ' + formatTimeForDisplay(promptedEndTime, timeFormat);
    } else {
      // Tasks/Routines: "at X"
      updatedContent = timePrompt.content + ' at ' + formatTimeForDisplay(promptedTime, timeFormat);
    }

    // Convert symbols back to prefixes before parsing
    const contentWithPrefix = symbolsToPrefix(updatedContent);

    // Re-parse with time included
    const parsed = parseInput(contentWithPrefix);

    // If type changed, delete old item and create new one
    if (parsed.type !== item.type) {
      // Create new item with parsed data, preserving original creation time
      const newItemData = createItem({
        content: parsed.content,
        createdAt: item.createdAt,
        createdDate: item.createdDate,
        parsed,
        userId: item.userId,
      });

      // Delete old and add new
      deleteItem(item.id);
      addItemDirect({ ...newItemData, id: item.id });
    } else {
      // Same type, just update
      const updates: Partial<Item> = { content: parsed.content };

      if (item.type === 'todo') {
        Object.assign(updates, {
          scheduledTime: parsed.scheduledTime !== null ? parsed.scheduledTime : (item as Todo).scheduledTime,
          hasTime: parsed.hasTime,
        });
      } else if (item.type === 'event') {
        Object.assign(updates, {
          startTime: parsed.scheduledTime || (item as Event).startTime,
          endTime: parsed.endTime || parsed.scheduledTime || (item as Event).endTime,
          hasTime: parsed.hasTime,
        });
      } else if (item.type === 'routine') {
        Object.assign(updates, {
          scheduledTime: parsed.scheduledTime ? format(parsed.scheduledTime, 'HH:mm') : (item as Routine).scheduledTime,
          hasTime: parsed.hasTime,
          recurrencePattern: parsed.recurrencePattern || (item as Routine).recurrencePattern,
        });
      }

      updateItem(item.id, updates);
    }

    // Clear time prompt and editing state
    setTimePrompt(null);
    setPromptedTime('');
    setPromptedEndTime('');
    setIsEditing(false);
  };

  const handleTimePromptCancel = () => {
    setTimePrompt(null);
    setPromptedTime('');
    setPromptedEndTime('');
  };


  // Handle input change with symbol conversion
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    // Check if a space was just added
    if (newValue.length > editContent.length && newValue[cursorPos - 1] === ' ') {
      const beforeSpace = newValue.substring(0, cursorPos - 1).trim();

      // Check if it matches a prefix
      if (prefixToSymbol[beforeSpace]) {
        // Replace prefix with symbol
        const symbol = prefixToSymbol[beforeSpace];
        const updatedValue = symbol + ' ' + newValue.substring(cursorPos);
        setEditContent(updatedValue);

        // Move cursor to after the symbol and space
        setTimeout(() => {
          const input = e.target;
          const newCursorPos = symbol.length + 1;
          input.selectionStart = input.selectionEnd = newCursorPos;
        }, 0);
        return;
      }
    }

    setEditContent(newValue);
  };

  // Handle keydown for backspace (revert symbol to prefix)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
      return;
    } else if (e.key === 'Escape') {
      handleCancelEdit();
      return;
    }

    const input = e.currentTarget;
    const { selectionStart, selectionEnd, value } = input;

    // Backspace: check if we need to revert symbol to prefix
    if (e.key === 'Backspace' && selectionStart === selectionEnd) {
      const charBeforeCursor = value[selectionStart! - 1];
      const charBeforeThat = value[selectionStart! - 2];

      // If we're deleting a space after a symbol, revert to prefix
      if (charBeforeCursor === ' ' && selectionStart! === 2) {
        if (charBeforeThat && symbolToPrefixMap[charBeforeThat]) {
          // Revert symbol + space to prefix
          e.preventDefault();
          const prefix = symbolToPrefixMap[charBeforeThat];
          const newValue = prefix + value.substring(selectionStart!);
          setEditContent(newValue);

          setTimeout(() => {
            input.selectionStart = input.selectionEnd = prefix.length;
          }, 0);
          return;
        }
      }
    }
  };

  const handleDelete = () => {
    // Get sub-items count for confirmation message
    const subItemIds = item.type === 'note'
      ? (item as Note).subItems
      : item.type === 'todo'
        ? (item as Todo).subtasks
        : [];

    const hasChildren = subItemIds.length > 0;

    let message = 'Are you sure you want to delete this item?';
    if (hasChildren) {
      message = `This will also delete ${subItemIds.length} sub-item${subItemIds.length > 1 ? 's' : ''}. Continue?`;
    }

    setConfirmDelete({
      isOpen: true,
      message,
      hasChildren,
    });
  };

  const handleConfirmDelete = () => {
    deleteItem(item.id);
    addToast('Item deleted', 'success');
  };

  const isCompleted = item.type === 'todo' && (item as Todo).completedAt;

  // Get sub-items
  const subItemIds = item.type === 'note'
    ? (item as Note).subItems
    : item.type === 'todo'
      ? (item as Todo).subtasks
      : [];

  const subItems = subItemIds
    .map(id => items.find(i => i.id === id))
    .filter(Boolean) as Item[];

  const indentPx = depth * 16;

  return (
    <>
      {/* Time Prompt Modal */}
      {timePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background border border-border-subtle rounded-sm p-24 max-w-md w-full mx-16">
            <h3 className="text-base font-serif mb-16">
              {timePrompt.isEvent ? 'When does it start and end?' : 'What time?'}
            </h3>
            <p className="text-sm text-text-secondary mb-16 font-serif">{timePrompt.content}</p>

            {timePrompt.isEvent ? (
              // Event: show start and end times
              <div className="space-y-12">
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-4">Start time</label>
                  <input
                    type="time"
                    value={promptedTime}
                    onChange={(e) => setPromptedTime(e.target.value)}
                    className="w-full px-12 py-8 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTimePromptSubmit();
                      } else if (e.key === 'Escape') {
                        handleTimePromptCancel();
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-4">End time</label>
                  <input
                    type="time"
                    value={promptedEndTime}
                    onChange={(e) => setPromptedEndTime(e.target.value)}
                    className="w-full px-12 py-8 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm mb-16"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTimePromptSubmit();
                      } else if (e.key === 'Escape') {
                        handleTimePromptCancel();
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              // Task/Routine: show single time
              <input
                type="time"
                value={promptedTime}
                onChange={(e) => setPromptedTime(e.target.value)}
                className="w-full px-12 py-8 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm mb-16"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTimePromptSubmit();
                  } else if (e.key === 'Escape') {
                    handleTimePromptCancel();
                  }
                }}
              />
            )}

            <div className="flex gap-8 justify-end mt-16">
              <button
                onClick={handleTimePromptCancel}
                className="px-16 py-8 text-sm font-mono text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleTimePromptSubmit}
                className="px-16 py-8 text-sm font-mono text-text-primary border border-border-subtle rounded-sm hover:bg-hover-bg"
              >
                {timePrompt.isEvent ? 'Add Times' : 'Add Time'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="group">
        <div
          style={{
            marginLeft: `${indentPx}px`,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
        {/* Timestamp (only for top-level) */}
        {depth === 0 && (
          <div className="text-xs font-mono text-text-secondary mt-3 mb-0.5">
            {getTimeDisplay()}
          </div>
        )}

        {/* Item Content */}
        <div className={`flex items-start gap-3 ${isCompleted ? 'opacity-40' : ''}`}>
          {/* Symbol - hide when editing */}
          {!isEditing && (
            <button
              onClick={handleToggleComplete}
              className={`text-base leading-book flex-shrink-0 ${
                item.type === 'todo' ? 'cursor-pointer hover:opacity-70' : 'cursor-default'
              }`}
              disabled={item.type !== 'todo'}
            >
              {getSymbol()}
            </button>
          )}

          {/* Content */}
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-8">
                <input
                  type="text"
                  value={editContent}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-8 py-4 bg-hover-bg border border-border-subtle rounded-sm font-serif text-base"
                  autoFocus
                />
                <button
                  onClick={handleSaveEdit}
                  className="text-sm text-text-secondary hover:text-text-primary"
                  title="Save (Enter)"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-sm text-text-secondary hover:text-text-primary"
                  title="Cancel (Esc)"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-8">
                <p
                  className={`flex-1 text-base font-serif leading-book ${
                    item.type === 'note' ? 'italic' : ''
                  } ${item.type === 'event' ? 'font-semibold' : ''} ${
                    isCompleted ? 'line-through' : ''
                  }`}
                >
                  {item.content}
                </p>
                {/* Edit/Delete buttons - show on hover */}
                {isHovered && (
                  <div className="flex gap-4 flex-shrink-0">
                    <button
                      onClick={handleEdit}
                      className="text-xs text-text-secondary hover:text-text-primary"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-xs text-text-secondary hover:text-text-primary"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Additional metadata for todos */}
            {item.type === 'todo' && (
              <></>
            )}

            {/* Additional metadata for routines */}
            {item.type === 'routine' && (
              <div className="mt-1 text-xs font-mono text-text-secondary">
                {(item as Routine).recurrencePattern.frequency === 'daily' && 'Every day'}
                {(item as Routine).streak > 0 && ` (Streak: ${(item as Routine).streak})`}
              </div>
            )}

            {/* Embedded notes preview */}
            {(item.type === 'todo' || item.type === 'event' || item.type === 'routine') &&
             'embeddedItems' in item && item.embeddedItems.length > 0 && (
              <div className="mt-1 space-y-1">
                {item.embeddedItems.map((noteId) => {
                  const embeddedNote = items.find(i => i.id === noteId && i.type === 'note');

                  if (!embeddedNote) {
                    // Broken link - note was deleted
                    return (
                      <div key={noteId} className="border border-border-subtle rounded-sm px-6 py-4 bg-hover-bg">
                        <p className="text-xs text-text-secondary italic">
                          [Note not found: {noteId}]
                        </p>
                      </div>
                    );
                  }

                  // Display embedded note preview
                  return (
                    <div key={noteId} className="border border-border-subtle rounded-sm px-6 py-4 bg-hover-bg">
                      <div className="flex items-start gap-4">
                        <span className="text-xs text-text-secondary">↝</span>
                        <p className="text-xs font-serif italic text-text-secondary">
                          {embeddedNote.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recursively render sub-items */}
      {subItems.length > 0 && (
        <div className="mt-1">
          {subItems.map(subItem => (
            <ItemDisplay
              key={subItem.id}
              item={subItem}
              depth={depth + 1}
              showTime={showTime}
              sourcePane={sourcePane}
            />
          ))}
        </div>
      )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Delete Item"
        message={confirmDelete.message}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, message: '', hasChildren: false })}
      />
    </>
  );
}

export default ItemDisplay;
