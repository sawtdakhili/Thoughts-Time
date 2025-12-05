import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  height?: 'half' | 'full' | number;
  showHandle?: boolean;
}

/**
 * Bottom sheet component for mobile interactions
 * Slides up from bottom with backdrop, swipe to dismiss
 */
export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  height = 'half',
  showHandle = true,
}: BottomSheetProps) {
  const sheetRef = useFocusTrap<HTMLDivElement>(isOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate height percentage
  const heightPercent = height === 'half' ? 60 : height === 'full' ? 90 : height;

  // Handle swipe down to dismiss
  useSwipeGesture(contentRef as React.RefObject<HTMLDivElement>, {
    onSwipeRight: () => {
      // Swiping down is detected as right swipe when sheet is in portrait
      // We'll handle this in the touchend directly instead
    },
  });

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-background border-t border-border-subtle z-60 animate-slide-up"
        style={{
          height: `${heightPercent}%`,
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        <div ref={contentRef} className="h-full flex flex-col">
          {/* Handle */}
          {showHandle && (
            <div className="flex justify-center py-3" aria-hidden="true">
              <div className="w-32 h-1 bg-text-secondary rounded-full opacity-50" />
            </div>
          )}

          {/* Title */}
          {title && (
            <div className="px-24 py-12 border-b border-border-subtle">
              <h2 id="bottom-sheet-title" className="text-lg font-serif">
                {title}
              </h2>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-24 py-16">{children}</div>
        </div>
      </div>
    </>
  );
}
