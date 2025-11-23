import { useState, useRef, useEffect } from 'react';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  timeFormat: '12h' | '24h';
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onEnterWithValue?: (value: string) => void;
}

/**
 * Custom time input that respects the app's time format setting.
 */
function TimeInput({
  onChange,
  timeFormat,
  autoFocus,
  onKeyDown,
  onEnterWithValue,
}: TimeInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(''); // Track value for immediate access in handlers

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const parseTime = (val: string): string | null => {
    const match = val.match(/^(\d{1,2}):?(\d{0,2})$/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;

      const maxHours = timeFormat === '12h' ? 12 : 23;
      if (hours <= maxHours && minutes <= 59) {
        const h24 = timeFormat === '12h' ? hours % 12 : hours;
        return `${h24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Allow digits and colon only
    val = val.replace(/[^\d:]/g, '');

    // Auto-insert colon after 2 digits if not present
    if (val.length === 2 && !val.includes(':')) {
      val = val + ':';
    }

    // Limit to HH:MM format (5 chars max)
    if (val.length > 5) {
      val = val.slice(0, 5);
    }

    setInputValue(val);
    valueRef.current = val; // Update ref immediately

    const parsed = parseTime(val);
    if (parsed) {
      onChange(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseTime(valueRef.current);
      if (parsed) {
        // Call onEnterWithValue with the parsed value directly
        // This bypasses any ref timing issues
        onEnterWithValue?.(parsed);
        return; // Don't call onKeyDown for Enter - we handled it
      }
    }
    // Pass other key events to parent handler
    onKeyDown?.(e);
  };

  const placeholder = timeFormat === '24h' ? '00:00' : '12:00';

  return (
    <div className="flex items-center gap-8">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-20 px-12 py-12 bg-hover-bg border border-border-subtle rounded-sm font-mono text-base text-center outline-none placeholder-text-secondary focus:border-text-secondary"
      />
      {timeFormat === '12h' && (
        <select
          className="px-12 py-12 bg-hover-bg border border-border-subtle rounded-sm font-mono text-base"
          onChange={(e) => {
            // Re-parse with new period
            const match = valueRef.current.match(/^(\d{1,2}):?(\d{0,2})$/);
            if (match) {
              let hours = parseInt(match[1]) || 0;
              const minutes = parseInt(match[2]) || 0;

              if (e.target.value === 'PM' && hours !== 12) {
                hours += 12;
              } else if (e.target.value === 'AM' && hours === 12) {
                hours = 0;
              }

              onChange(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
              );
            }
          }}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      )}
    </div>
  );
}

export default TimeInput;
