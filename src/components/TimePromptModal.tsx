import { useState, useRef } from 'react';
import TimeInput from './TimeInput';
import { useFocusTrap } from '../hooks/useFocusTrap';

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
function TimePromptModal({
  isOpen,
  isEvent,
  content,
  timeFormat = '12h',
  onSubmit,
  onCancel,
}: TimePromptModalProps) {
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen);

  // Use refs to track latest values for immediate access in handlers
  const timeRef = useRef('');
  const endTimeRef = useRef('');

  if (!isOpen) return null;

  const handleTimeChange = (value: string) => {
    setTime(value);
    timeRef.current = value;
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    endTimeRef.current = value;
  };

  const handleSubmit = () => {
    // Use refs for immediate access to latest values
    const currentTime = timeRef.current;
    const currentEndTime = endTimeRef.current;

    if (!currentTime) return;
    if (isEvent && !currentEndTime) return;
    onSubmit(currentTime, isEvent ? currentEndTime : undefined);
    setTime('');
    setEndTime('');
    timeRef.current = '';
    endTimeRef.current = '';
  };

  const handleCancel = () => {
    setTime('');
    setEndTime('');
    timeRef.current = '';
    endTimeRef.current = '';
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Direct submit handlers that receive the value immediately
  const handleTimeEnter = (value: string) => {
    if (!isEvent) {
      // For non-events, submit immediately - modal will close from onSubmit
      onSubmit(value);
    } else {
      // For events, store start time and wait for end time
      timeRef.current = value;
      setTime(value);
    }
  };

  const handleEndTimeEnter = (value: string) => {
    // For events, submit when we have both times
    if (timeRef.current) {
      onSubmit(timeRef.current, value);
    } else {
      // Store end time if start time not set yet
      endTimeRef.current = value;
      setEndTime(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="time-modal-title"
        className="bg-background border border-border-subtle rounded-sm p-24 max-w-md w-full mx-16"
      >
        <h3 id="time-modal-title" className="text-base font-serif mb-16">
          {isEvent ? 'When does it start and end?' : 'What time?'}
        </h3>
        <p className="text-sm text-text-secondary mb-16 font-serif">{content}</p>

        {isEvent ? (
          <div className="space-y-12">
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-4">Start time</label>
              <TimeInput
                value={time}
                onChange={handleTimeChange}
                timeFormat={timeFormat}
                autoFocus
                onKeyDown={handleKeyDown}
                onEnterWithValue={handleTimeEnter}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-4">End time</label>
              <TimeInput
                value={endTime}
                onChange={handleEndTimeChange}
                timeFormat={timeFormat}
                onKeyDown={handleKeyDown}
                onEnterWithValue={handleEndTimeEnter}
              />
            </div>
          </div>
        ) : (
          <div className="mb-16">
            <TimeInput
              value={time}
              onChange={handleTimeChange}
              timeFormat={timeFormat}
              autoFocus
              onKeyDown={handleKeyDown}
              onEnterWithValue={handleTimeEnter}
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
