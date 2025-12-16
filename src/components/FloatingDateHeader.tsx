import { memo } from 'react';
import { format, parseISO } from 'date-fns';

interface FloatingDateHeaderProps {
  date: string;
  isToday: boolean;
}

/**
 * Floating date header for infinite scroll mode.
 * Memoized to prevent re-renders when scrolling.
 */
export const FloatingDateHeader = memo(function FloatingDateHeader({ date, isToday }: FloatingDateHeaderProps) {
  return (
    <div
      className={`sticky top-0 z-30 bg-background py-3 border-b border-border-subtle ${
        isToday ? 'text-text-primary' : 'text-text-secondary'
      }`}
      style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}
    >
      <h3 className="text-base font-serif uppercase tracking-wide px-24">
        {format(parseISO(date), 'EEEE, MMM d, yyyy')}
        {isToday && ' (Today)'}
      </h3>
    </div>
  );
});
