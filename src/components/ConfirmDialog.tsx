import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      // Focus the confirm button when dialog opens for keyboard accessibility
      confirmButtonRef.current.focus();
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border border-border-subtle rounded-sm shadow-lg z-50 w-[400px]"
      >
        {/* Header */}
        <div className="border-b border-border-subtle px-24 py-16">
          <h2 id="dialog-title" className="text-base font-serif">
            {title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-24 py-24">
          <p id="dialog-description" className="text-sm leading-relaxed mb-24">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-12 justify-end">
            <button
              onClick={onCancel}
              className="px-16 py-8 text-sm font-mono border border-border-subtle rounded-sm hover:border-text-secondary transition-colors"
              aria-label="Cancel action"
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={`px-16 py-8 text-sm font-mono border rounded-sm transition-colors ${
                isDangerous
                  ? 'bg-[#3A0A0A] text-[#FF6B6B] border-[#5A1A1A] hover:bg-[#4A0A0A]'
                  : 'bg-text-primary text-background border-text-primary hover:opacity-90'
              }`}
              aria-label={isDangerous ? 'Confirm dangerous action' : 'Confirm action'}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConfirmDialog;
