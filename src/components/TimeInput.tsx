import { useState, useRef, useEffect } from 'react';

interface TimeInputProps {
  value: string; // HH:mm format
  onChange: (value: string) => void;
  timeFormat: '12h' | '24h';
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Custom time input that respects the app's time format setting.
 * Displays in 12h or 24h format based on setting.
 */
function TimeInput({ value, onChange, timeFormat, autoFocus, onKeyDown }: TimeInputProps) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);

  // Parse incoming value (HH:mm format)
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setMinutes(m.toString().padStart(2, '0'));

      if (timeFormat === '12h') {
        setPeriod(h >= 12 ? 'PM' : 'AM');
        const h12 = h % 12 || 12;
        setHours(h12.toString());
      } else {
        setHours(h.toString().padStart(2, '0'));
      }
    }
  }, [value, timeFormat]);

  // Auto-focus hours input
  useEffect(() => {
    if (autoFocus && hoursRef.current) {
      hoursRef.current.focus();
    }
  }, [autoFocus]);

  // Convert current state to HH:mm format
  const toValue = (h: string, m: string, p: 'AM' | 'PM'): string => {
    let hours24 = parseInt(h) || 0;

    if (timeFormat === '12h') {
      if (p === 'PM' && hours24 !== 12) {
        hours24 += 12;
      } else if (p === 'AM' && hours24 === 12) {
        hours24 = 0;
      }
    }

    const mins = parseInt(m) || 0;
    return `${hours24.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    const max = timeFormat === '12h' ? 12 : 23;

    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= max)) {
      setHours(val);

      // Auto-advance to minutes after 2 digits
      if (val.length === 2) {
        minutesRef.current?.focus();
      }

      onChange(toValue(val, minutes, period));
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');

    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
      setMinutes(val);
      onChange(toValue(hours, val, period));
    }
  };

  const handlePeriodToggle = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM';
    setPeriod(newPeriod);
    onChange(toValue(hours, minutes, newPeriod));
  };

  const handleHoursBlur = () => {
    if (hours) {
      const padded = timeFormat === '24h'
        ? hours.padStart(2, '0')
        : hours;
      setHours(padded);
    }
  };

  const handleMinutesBlur = () => {
    if (minutes) {
      setMinutes(minutes.padStart(2, '0'));
    }
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent) => {
    // Pass through to parent handler
    onKeyDown?.(e);

    // Handle backspace to go back to hours
    if (e.key === 'Backspace' && e.currentTarget === minutesRef.current && minutes === '') {
      hoursRef.current?.focus();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center bg-hover-bg border border-border-subtle rounded-sm px-12 py-8">
        <input
          ref={hoursRef}
          type="text"
          inputMode="numeric"
          value={hours}
          onChange={handleHoursChange}
          onBlur={handleHoursBlur}
          onKeyDown={handleKeyDownInternal}
          placeholder={timeFormat === '24h' ? '00' : '12'}
          className="w-[2ch] bg-transparent font-mono text-sm text-center outline-none placeholder-text-secondary"
          maxLength={2}
        />
        <span className="font-mono text-sm text-text-secondary mx-1">:</span>
        <input
          ref={minutesRef}
          type="text"
          inputMode="numeric"
          value={minutes}
          onChange={handleMinutesChange}
          onBlur={handleMinutesBlur}
          onKeyDown={handleKeyDownInternal}
          placeholder="00"
          className="w-[2ch] bg-transparent font-mono text-sm text-center outline-none placeholder-text-secondary"
          maxLength={2}
        />
      </div>

      {timeFormat === '12h' && (
        <button
          type="button"
          onClick={handlePeriodToggle}
          className="px-8 py-8 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm hover:border-text-secondary transition-colors"
        >
          {period}
        </button>
      )}
    </div>
  );
}

export default TimeInput;
