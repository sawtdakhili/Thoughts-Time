import { useState } from 'react';
import { formatTimeForDisplay } from '../utils/formatting';

interface TimePromptModalProps {
  isOpen: boolean;
  isEvent: boolean;
  content: string;
  timeFormat?: '12h' | '24h';
  onSubmit: (time: string, endTime?: string) => void;
  onCancel: () => void;
}

/**
 * Modal dialog for prompting users to enter time(s) for items.
 * Shows single time input for todos/routines, or start/end for events.
 */
function TimePromptModal({ isOpen, isEvent, content, timeFormat = '12h', onSubmit, onCancel }: TimePromptModalProps) {
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Format time for display in user's preferred format
  const formatPreview = (t: string) => t ? formatTimeForDisplay(t, timeFormat) : '';

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!time) return;
    if (isEvent && !endTime) return;
    onSubmit(time, isEvent ? endTime : undefined);
    setTime('');
    setEndTime('');
  };

  const handleCancel = () => {
    setTime('');
    setEndTime('');
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border border-border-subtle rounded-sm p-24 max-w-md w-full mx-16">
        <h3 className="text-base font-serif mb-16">
          {isEvent ? 'When does it start and end?' : 'What time?'}
        </h3>
        <p className="text-sm text-text-secondary mb-16 font-serif">{content}</p>

        {isEvent ? (
          <div className="space-y-12">
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-4">Start time</label>
              <div className="flex items-center gap-8">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex-1 px-12 py-8 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm"
                  autoFocus
                  onKeyDown={handleKeyDown}
                />
                {time && (
                  <span className="text-sm font-mono text-text-secondary whitespace-nowrap">
                    {formatPreview(time)}
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-4">End time</label>
              <div className="flex items-center gap-8">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1 px-12 py-8 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm"
                  onKeyDown={handleKeyDown}
                />
                {endTime && (
                  <span className="text-sm font-mono text-text-secondary whitespace-nowrap">
                    {formatPreview(endTime)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-8 mb-16">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 px-12 py-8 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm"
              autoFocus
              onKeyDown={handleKeyDown}
            />
            {time && (
              <span className="text-sm font-mono text-text-secondary whitespace-nowrap">
                {formatPreview(time)}
              </span>
            )}
          </div>
        )}

        <div className="flex gap-8 justify-end mt-16">
          <button
            onClick={handleCancel}
            className="px-16 py-8 text-sm font-mono text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-16 py-8 text-sm font-mono text-text-primary border border-border-subtle rounded-sm hover:bg-hover-bg"
          >
            {isEvent ? 'Add Times' : 'Add Time'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TimePromptModal;
