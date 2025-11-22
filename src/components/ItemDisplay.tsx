import { useState, memo } from 'react';
import { format } from 'date-fns';
import { Item, Todo, Routine, Event } from '../types';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { parseInput, parseMultiLine } from '../utils/parser';
import { createItem } from '../utils/itemFactory';
import { symbolsToPrefix, formatTimeForDisplay, typeToSymbol } from '../utils/formatting';
import { useToast } from '../hooks/useToast';
import { useHistory } from '../store/useHistory';
import { highlightMatches } from '../utils/search.tsx';
import ConfirmDialog from './ConfirmDialog';
import TimePromptModal from './TimePromptModal';
import ItemEditor from './ItemEditor';
import ItemActions from './ItemActions';

interface ItemDisplayProps {
  item: Item;
  depth?: number;
  showTime?: boolean;
  sourcePane?: 'thoughts' | 'time';
  searchQuery?: string;
  onJumpToSource?: (item: Item) => void;
  onNavigateToDate?: (date: string) => void;
  highlightedItemId?: string | null;
}

/**
 * Renders a single item with its content, actions, and nested sub-items.
 * Handles editing, deletion, completion toggling, and time prompts.
 */
function ItemDisplay({
  item,
  depth = 0,
  showTime = true,
  sourcePane = 'thoughts',
  searchQuery = '',
  onJumpToSource,
  onNavigateToDate,
  highlightedItemId,
}: ItemDisplayProps) {
  const toggleTodoComplete = useStore((state) => state.toggleTodoComplete);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);
  const addItemDirect = useStore((state) => state.addItemDirect);
  const items = useStore((state) => state.items);
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const addToast = useToast((state) => state.addToast);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [timePrompt, setTimePrompt] = useState<{ content: string; isEvent: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    message: string;
    hasChildren: boolean;
  }>({
    isOpen: false,
    message: '',
    hasChildren: false,
  });

  const getSymbol = () => {
    switch (item.type) {
      case 'todo':
        return (item as Todo).completedAt ? '☑' : '□';
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
    if (depth === 0 && showTime) {
      const formatPattern = timeFormat === '24h' ? 'HH:mm' : 'h:mm a';
      return format(new Date(item.createdAt), formatPattern);
    }
    return null;
  };

  const handleToggleComplete = () => {
    if (item.type === 'todo') {
      toggleTodoComplete(item.id);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  // Serialize item and all children into multi-line format with tabs
  const serializeItemWithChildren = (
    targetItem: Item,
    allItems: Item[],
    level: number = 0
  ): string => {
    const symbol = typeToSymbol[targetItem.type] || '';
    const tabs = '\t'.repeat(level);
    let line =
      level === 0 ? `${symbol} ${targetItem.content}` : `${symbol}${tabs} ${targetItem.content}`;

    const childIds =
      'children' in targetItem ? (targetItem as { children: string[] }).children : [];
    if (childIds.length > 0) {
      const childLines = childIds
        .map((childId: string) => allItems.find((i) => i.id === childId))
        .filter(Boolean)
        .map((child) => serializeItemWithChildren(child as Item, allItems, level + 1));
      line += '\n' + childLines.join('\n');
    }

    return line;
  };

  const getEditInitialContent = () => {
    return serializeItemWithChildren(item, items, 0);
  };

  const handleSaveEdit = (editContent: string) => {
    if (!editContent.trim()) {
      setIsEditing(false);
      return;
    }

    // Convert symbols to prefixes for each line
    const lines = editContent.split('\n').map((line) => symbolsToPrefix(line));
    const contentWithPrefix = lines.join('\n');

    // Check if this is multi-line content
    if (lines.length > 1) {
      // Parse multi-line content
      const { lines: parsedLines, errors } = parseMultiLine(contentWithPrefix);

      if (errors.length > 0) {
        addToast(errors[0], 'error');
        return;
      }

      if (parsedLines.length === 0) {
        setIsEditing(false);
        return;
      }

      // Delete old children first
      const oldChildIds = 'children' in item ? (item as { children: string[] }).children : [];
      oldChildIds.forEach((childId: string) => {
        deleteItem(childId);
      });

      // Update main item with first parsed line
      const firstLine = parsedLines[0];
      const mainUpdates: Partial<Item> = {
        content: firstLine.content,
        children: [],
      };

      if (item.type === 'todo') {
        Object.assign(mainUpdates, {
          scheduledTime: firstLine.scheduledTime ?? (item as Todo).scheduledTime,
          hasTime: firstLine.hasTime,
        });
      } else if (item.type === 'event') {
        Object.assign(mainUpdates, {
          startTime: firstLine.scheduledTime || (item as Event).startTime,
          endTime: firstLine.endTime || firstLine.scheduledTime || (item as Event).endTime,
          hasTime: firstLine.hasTime,
        });
      }

      updateItem(item.id, mainUpdates);

      // Create children using addItems with proper parenting
      if (parsedLines.length > 1) {
        const childContent = parsedLines
          .slice(1)
          .map((line) => {
            const prefix =
              line.type === 'note'
                ? 'n'
                : line.type === 'todo'
                  ? 't'
                  : line.type === 'event'
                    ? 'e'
                    : 'r';
            const tabs = '\t'.repeat(line.level);
            return `${prefix}${tabs} ${line.content}`;
          })
          .join('\n');

        // We need to add these as children of the current item
        const addItems = useStore.getState().addItems;
        const result = addItems(childContent, item.id, item.depthLevel);

        if (result.errors.length > 0) {
          addToast(result.errors[0], 'error');
        }
      }

      setIsEditing(false);
      return;
    }

    // Single line edit - use original logic
    const parsed = parseInput(contentWithPrefix);

    if (parsed.needsTimePrompt) {
      setTimePrompt({
        content: editContent.trim(),
        isEvent: parsed.type === 'event',
      });
      return;
    }

    applyEdit(parsed);
    setIsEditing(false);
  };

  const applyEdit = (parsed: ReturnType<typeof parseInput>) => {
    if (parsed.type !== item.type) {
      const newItemData = createItem({
        content: parsed.content,
        createdAt: item.createdAt,
        createdDate: item.createdDate,
        parsed,
        userId: item.userId,
      });

      deleteItem(item.id);
      addItemDirect({ ...newItemData, id: item.id });
    } else {
      const updates: Partial<Item> = { content: parsed.content };

      if (item.type === 'todo') {
        Object.assign(updates, {
          scheduledTime:
            parsed.scheduledTime !== null ? parsed.scheduledTime : (item as Todo).scheduledTime,
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
          scheduledTime: parsed.scheduledTime
            ? format(parsed.scheduledTime, 'HH:mm')
            : (item as Routine).scheduledTime,
          hasTime: parsed.hasTime,
          recurrencePattern: parsed.recurrencePattern || (item as Routine).recurrencePattern,
        });
      }

      updateItem(item.id, updates);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleTimePromptSubmit = (time: string, endTime?: string) => {
    if (!timePrompt) return;

    let updatedContent: string;
    if (timePrompt.isEvent && endTime) {
      updatedContent =
        timePrompt.content +
        ' from ' +
        formatTimeForDisplay(time, timeFormat) +
        ' to ' +
        formatTimeForDisplay(endTime, timeFormat);
    } else {
      updatedContent = timePrompt.content + ' at ' + formatTimeForDisplay(time, timeFormat);
    }

    const contentWithPrefix = symbolsToPrefix(updatedContent);
    const parsed = parseInput(contentWithPrefix);
    applyEdit(parsed);

    setTimePrompt(null);
    setIsEditing(false);
  };

  const handleTimePromptCancel = () => {
    setTimePrompt(null);
  };

  const handleDelete = () => {
    const childIds = 'children' in item ? item.children : [];

    const hasChildren = childIds.length > 0;
    let message = 'Are you sure you want to delete this item?';
    if (hasChildren) {
      message = `This will also delete ${childIds.length} sub-item${childIds.length > 1 ? 's' : ''}. Continue?`;
    }

    setConfirmDelete({ isOpen: true, message, hasChildren });
  };

  const handleConfirmDelete = () => {
    deleteItem(item.id);
    const performUndo = useHistory.getState().performUndo;
    addToast('Item deleted', 'success', 4000, performUndo || undefined);
  };

  const isCompleted = item.type === 'todo' && (item as Todo).completedAt;

  const childIds = 'children' in item ? item.children : [];

  const subItems = childIds
    .map((id: string) => items.find((i) => i.id === id))
    .filter(Boolean) as Item[];

  const indentPx = depth * 16;

  const renderContent = () => {
    if (searchQuery) {
      return highlightMatches(item.content, searchQuery);
    }
    return item.content;
  };

  return (
    <>
      <TimePromptModal
        isOpen={!!timePrompt}
        isEvent={timePrompt?.isEvent || false}
        content={timePrompt?.content || ''}
        timeFormat={timeFormat}
        onSubmit={handleTimePromptSubmit}
        onCancel={handleTimePromptCancel}
      />

      <div className="group">
        <div
          style={{ marginLeft: `${indentPx}px` }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={highlightedItemId === item.id ? 'highlight-flash' : ''}
        >
          {depth === 0 && (
            <div className="text-xs font-mono text-text-secondary mt-3 mb-0.5">
              {getTimeDisplay()}
            </div>
          )}

          <div className={`flex items-start gap-3 ${isCompleted ? 'opacity-40' : ''}`}>
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

            <div className="flex-1">
              {isEditing ? (
                <ItemEditor
                  initialContent={getEditInitialContent()}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <div className="flex items-start gap-8">
                  <p
                    className={`flex-1 text-base font-serif leading-book ${
                      item.type === 'note' ? 'italic' : ''
                    } ${item.type === 'event' ? 'font-semibold' : ''} ${
                      isCompleted ? 'line-through' : ''
                    }`}
                  >
                    {renderContent()}
                  </p>
                  {isHovered && (
                    <ItemActions
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onJumpToSource={
                        sourcePane === 'time' && onJumpToSource
                          ? () => onJumpToSource(item)
                          : undefined
                      }
                    />
                  )}
                </div>
              )}

              {item.type === 'routine' && (
                <div className="mt-1 text-xs font-mono text-text-secondary">
                  {(item as Routine).recurrencePattern.frequency === 'daily' && 'Every day'}
                  {(item as Routine).streak > 0 && ` (Streak: ${(item as Routine).streak})`}
                </div>
              )}

              {/* Completion link for completed todos */}
              {item.type === 'todo' && (item as Todo).completedAt && (
                <div className="mt-1 text-xs font-mono text-text-secondary">
                  {(item as Todo).completionLinkId ? (
                    <button
                      onClick={() => {
                        const linkedItem = items.find(
                          (i) => i.id === (item as Todo).completionLinkId
                        );
                        if (linkedItem && onNavigateToDate) {
                          onNavigateToDate(linkedItem.createdDate);
                        }
                      }}
                      className="hover:text-text-primary transition-colors"
                    >
                      completed on {format(new Date((item as Todo).completedAt!), 'MMM d')} →
                    </button>
                  ) : (
                    <span>completed {format(new Date((item as Todo).completedAt!), 'MMM d')}</span>
                  )}
                </div>
              )}

              {(item.type === 'todo' || item.type === 'event' || item.type === 'routine') &&
                'embeddedItems' in item &&
                item.embeddedItems.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {item.embeddedItems.map((noteId) => {
                      const embeddedNote = items.find((i) => i.id === noteId && i.type === 'note');

                      if (!embeddedNote) {
                        return (
                          <div
                            key={noteId}
                            className="border border-border-subtle rounded-sm px-6 py-4 bg-hover-bg"
                          >
                            <p className="text-xs text-text-secondary italic">
                              [Note not found: {noteId}]
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={noteId}
                          className="border border-border-subtle rounded-sm px-6 py-4 bg-hover-bg"
                        >
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

        {subItems.length > 0 && (
          <div className="mt-1">
            {subItems.map((subItem) => (
              <ItemDisplay
                key={subItem.id}
                item={subItem}
                depth={depth + 1}
                showTime={showTime}
                sourcePane={sourcePane}
                searchQuery={searchQuery}
                onJumpToSource={onJumpToSource}
                onNavigateToDate={onNavigateToDate}
                highlightedItemId={highlightedItemId}
              />
            ))}
          </div>
        )}
      </div>

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

export default memo(ItemDisplay, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.updatedAt === nextProps.item.updatedAt &&
    prevProps.item.content === nextProps.item.content &&
    prevProps.highlightedItemId === nextProps.highlightedItemId &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.showTime === nextProps.showTime &&
    prevProps.sourcePane === nextProps.sourcePane &&
    prevProps.depth === nextProps.depth
  );
});
