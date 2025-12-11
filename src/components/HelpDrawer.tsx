import { useState, useEffect, useRef } from 'react';

interface PrefixInfo {
  prefix: string;
  symbol: string;
  name: string;
  description: string;
  example: string;
}

const prefixes: PrefixInfo[] = [
  {
    prefix: 't',
    symbol: '□',
    name: 'Todo',
    description: 'Creates a task that can be checked off',
    example: 't Buy groceries tomorrow at 5pm',
  },
  {
    prefix: 'e',
    symbol: '↹',
    name: 'Event',
    description: 'Creates a calendar event with start/end time',
    example: 'e Meeting with team from 2pm to 3pm',
  },
  {
    prefix: 'r',
    symbol: '↻',
    name: 'Routine',
    description: 'Creates a recurring task or event',
    example: 'r Morning standup every weekday at 9am',
  },
  {
    prefix: 'n',
    symbol: '↝',
    name: 'Note',
    description: 'Creates a simple note or thought',
    example: 'n Remember to follow up on the proposal',
  },
];

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpDrawer({ isOpen, onClose }: HelpDrawerProps) {
  const [selectedPrefix, setSelectedPrefix] = useState<PrefixInfo | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPrefix) {
          setSelectedPrefix(null);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedPrefix]);

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        if (selectedPrefix) {
          setSelectedPrefix(null);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, selectedPrefix]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" aria-hidden="true" />

      {/* Drawer - positioned below the ? button on the right */}
      <div
        ref={drawerRef}
        className="fixed top-[60px] right-12 z-50 w-72 bg-background border border-border-subtle rounded-lg shadow-lg animate-drawer-in"
        role="dialog"
        aria-modal="true"
        aria-label="Input prefix help"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-serif">Input Prefixes</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors p-1"
              aria-label="Close help"
            >
              ✕
            </button>
          </div>

          <p className="text-text-secondary text-xs mb-4">
            Start your input with a prefix to create different item types.
          </p>

          {/* Prefix buttons - vertical stack */}
          <div className="flex flex-col gap-2">
            {prefixes.map((p) => (
              <button
                key={p.prefix}
                onClick={() => setSelectedPrefix(p)}
                className="group flex items-center gap-3 p-3 rounded-lg border border-border-subtle hover:border-text-secondary hover:bg-hover-bg transition-all text-left"
              >
                <span className="text-xl font-mono w-6">{p.symbol}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-text-primary">{p.prefix}</span>
                    <span className="text-xs text-text-secondary">— {p.name}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Prefix Detail Popup */}
        {selectedPrefix && (
          <PrefixPopup prefix={selectedPrefix} onClose={() => setSelectedPrefix(null)} />
        )}
      </div>
    </>
  );
}

interface PrefixPopupProps {
  prefix: PrefixInfo;
  onClose: () => void;
}

function PrefixPopup({ prefix, onClose }: PrefixPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    popupRef.current?.focus();
  }, []);

  return (
    <>
      {/* Popup backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} aria-hidden="true" />

      {/* Popup */}
      <div
        ref={popupRef}
        tabIndex={-1}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-background border border-border-subtle rounded-lg shadow-xl max-w-md w-[90%] animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefix-popup-title"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-mono">{prefix.symbol}</span>
              <div>
                <h3 id="prefix-popup-title" className="text-lg font-serif">
                  {prefix.name}
                </h3>
                <span className="text-sm font-mono text-text-secondary">
                  Prefix: <code className="bg-hover-bg px-2 py-0.5 rounded">{prefix.prefix}</code>
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors p-2"
              aria-label="Close popup"
            >
              ✕
            </button>
          </div>

          {/* Description */}
          <p className="text-text-secondary mb-4">{prefix.description}</p>

          {/* Example */}
          <div className="bg-hover-bg border border-border-subtle rounded-lg p-4">
            <span className="text-xs text-text-secondary uppercase tracking-wider mb-2 block">
              Example
            </span>
            <code className="font-mono text-sm text-text-primary block">{prefix.example}</code>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="mt-6 w-full py-2 px-4 bg-text-primary text-background rounded hover:opacity-90 transition-opacity font-serif"
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
}
