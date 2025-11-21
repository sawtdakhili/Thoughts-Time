import { useState } from 'react';
import TimeInput from './TimeInput';

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
              <TimeInput
                value={time}
                onChange={setTime}
                timeFormat={timeFormat}
                autoFocus
                onKeyDown={handleKeyDown}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-4">End time</label>
              <TimeInput
                value={endTime}
                onChange={setEndTime}
                timeFormat={timeFormat}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        ) : (
          <div className="mb-16">
            <TimeInput
              value={time}
              onChange={setTime}
              timeFormat={timeFormat}
              autoFocus
              onKeyDown={handleKeyDown}
            />
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
