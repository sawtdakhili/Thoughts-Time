import { useState, useEffect, useRef } from 'react';
import { prefixToSymbol, symbolToPrefix as symbolToPrefixMap } from '../utils/formatting';

interface ItemEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

/**
 * Inline editor component for editing item content.
 * Supports multi-line editing with Tab/Shift+Tab for indentation.
 */
function ItemEditor({ initialContent, onSave, onCancel }: ItemEditorProps) {
  const [editContent, setEditContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditContent(initialContent);
  }, [initialContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editContent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    // Check if a space was just added on current line
    if (newValue.length > editContent.length && newValue[cursorPos - 1] === ' ') {
      // Find start of current line
      const lineStart = newValue.lastIndexOf('\n', cursorPos - 2) + 1;
      const beforeSpace = newValue.substring(lineStart, cursorPos - 1).trim();

      // Check if it matches a prefix (only at line start)
      if (prefixToSymbol[beforeSpace] && beforeSpace.length === 1) {
        const symbol = prefixToSymbol[beforeSpace];
        const updatedValue =
          newValue.substring(0, lineStart) + symbol + ' ' + newValue.substring(cursorPos);
        setEditContent(updatedValue);

        setTimeout(() => {
          const textarea = textareaRef.current;
          if (textarea) {
            const newCursorPos = lineStart + symbol.length + 1;
            textarea.selectionStart = textarea.selectionEnd = newCursorPos;
          }
        }, 0);
        return;
      }
    }

    setEditContent(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

    // Enter without Shift saves, Shift+Enter adds new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave(editContent);
      return;
    }

    if (e.key === 'Escape') {
      onCancel();
      return;
    }

    // Tab: add tab character after symbol
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();

      // Find the current line
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const lineEnd = value.indexOf('\n', selectionStart);
      const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
      const currentLine = value.substring(lineStart, actualLineEnd);

      // Find position after symbol (if any)
      const symbolMatch = currentLine.match(/^[↹□☑↻↝]/);
      const insertPos = symbolMatch ? lineStart + 1 : selectionStart;

      const newValue = value.substring(0, insertPos) + '\t' + value.substring(insertPos);
      setEditContent(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = insertPos + 1;
      }, 0);
      return;
    }

    // Shift+Tab: remove tab after symbol
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();

      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const lineEnd = value.indexOf('\n', selectionStart);
      const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
      const currentLine = value.substring(lineStart, actualLineEnd);

      // Find and remove first tab after symbol
      const tabMatch = currentLine.match(/^([↹□☑↻↝])(\t+)/);
      if (tabMatch) {
        const symbol = tabMatch[1];
        const tabs = tabMatch[2];
        if (tabs.length > 0) {
          const newLine =
            symbol + tabs.substring(1) + currentLine.substring(symbol.length + tabs.length);
          const newValue = value.substring(0, lineStart) + newLine + value.substring(actualLineEnd);
          setEditContent(newValue);

          setTimeout(() => {
            const newCursor = Math.max(lineStart, selectionStart - 1);
            textarea.selectionStart = textarea.selectionEnd = newCursor;
          }, 0);
        }
      }
      return;
    }

    // Backspace: check if we need to revert symbol to prefix
    if (e.key === 'Backspace' && selectionStart === selectionEnd) {
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const posInLine = selectionStart - lineStart;

      if (posInLine === 2) {
        const charBeforeCursor = value[selectionStart - 1];
        const charBeforeThat = value[selectionStart - 2];

        if (charBeforeCursor === ' ' && symbolToPrefixMap[charBeforeThat]) {
          e.preventDefault();
          const prefix = symbolToPrefixMap[charBeforeThat];
          const newValue = value.substring(0, lineStart) + prefix + value.substring(selectionStart);
          setEditContent(newValue);

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart + prefix.length;
          }, 0);
          return;
        }
      }
    }
  };

  const isMultiLine = initialContent.includes('\n');

  return (
    <div className="flex items-start gap-8">
      <textarea
        ref={textareaRef}
        value={editContent}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="flex-1 px-8 py-4 bg-hover-bg border border-border-subtle rounded-sm font-serif text-base resize-none overflow-hidden"
        rows={isMultiLine ? 3 : 1}
        autoFocus
      />
      <div className="flex flex-col gap-4">
        <button
          onClick={() => onSave(editContent)}
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
    </div>
  );
}

export default ItemEditor;
