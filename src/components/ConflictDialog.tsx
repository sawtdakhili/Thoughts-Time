import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { Item } from '../types';

interface ConflictDialogProps {
  isOpen: boolean;
  localItem: Item;
  serverItem: Item;
  onUseLocal: () => void;
  onUseServer: () => void;
  onCancel: () => void;
}

/**
 * Dialog for resolving conflicts when an item was modified on another device.
 * Shows both versions and lets the user choose which to keep.
 */
function ConflictDialog({
  isOpen,
  localItem,
  serverItem,
  onUseLocal,
  onUseServer,
  onCancel,
}: ConflictDialogProps) {
  const serverButtonRef = useRef<HTMLButtonElement>(null);
  const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (isOpen && serverButtonRef.current) {
      // Focus the server version button (safer default)
      serverButtonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Handle Escape key to cancel
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-dialog-title"
        aria-describedby="conflict-dialog-description"
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border border-border-subtle rounded-sm shadow-lg z-50 w-[600px] max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="border-b border-border-subtle px-24 py-16">
          <h2 id="conflict-dialog-title" className="text-base font-serif">
            Sync Conflict
          </h2>
        </div>

        {/* Content */}
        <div className="px-24 py-24">
          <p id="conflict-dialog-description" className="text-sm leading-relaxed mb-24 text-text-secondary">
            This item was modified on another device. Choose which version to keep:
          </p>

          {/* Version comparison */}
          <div className="grid grid-cols-2 gap-16 mb-24">
            {/* Local version */}
            <div className="border border-border-subtle rounded-sm p-16">
              <div className="mb-12">
                <div className="text-xs font-mono text-text-secondary mb-4">Your Version</div>
                <div className="text-xs font-mono text-text-secondary opacity-60">
                  Modified {format(new Date(localItem.updatedAt), 'MMM d, h:mm a')}
                </div>
              </div>
              <div className="text-sm font-serif leading-relaxed border-t border-border-subtle pt-12 mt-12">
                {localItem.content}
              </div>
            </div>

            {/* Server version */}
            <div className="border border-border-subtle rounded-sm p-16 bg-hover-bg">
              <div className="mb-12">
                <div className="text-xs font-mono text-text-secondary mb-4">
                  Other Device Version
                </div>
                <div className="text-xs font-mono text-text-secondary opacity-60">
                  Modified {format(new Date(serverItem.updatedAt), 'MMM d, h:mm a')}
                </div>
              </div>
              <div className="text-sm font-serif leading-relaxed border-t border-border-subtle pt-12 mt-12">
                {serverItem.content}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-12 justify-end">
            <button
              onClick={onCancel}
              className="px-16 py-8 text-sm font-mono border border-border-subtle rounded-sm hover:border-text-secondary transition-colors"
              aria-label="Cancel and keep local version"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onUseLocal();
                onCancel();
              }}
              className="px-16 py-8 text-sm font-mono border border-border-subtle rounded-sm hover:border-text-secondary transition-colors"
              aria-label="Use your local version"
            >
              Use Your Version
            </button>
            <button
              ref={serverButtonRef}
              onClick={() => {
                onUseServer();
                onCancel();
              }}
              className="px-16 py-8 text-sm font-mono bg-text-primary text-background border border-text-primary rounded-sm hover:opacity-90 transition-opacity"
              aria-label="Use version from other device (recommended)"
            >
              Use Other Device Version
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConflictDialog;
