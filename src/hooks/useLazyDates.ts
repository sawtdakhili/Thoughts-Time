import { useState, useCallback, useMemo } from 'react';
import { format, subDays, addDays } from 'date-fns';

interface UseLazyDatesOptions {
  initialPastDays?: number;
  initialFutureDays?: number;
  loadChunkSize?: number;
  maxPastDays?: number;
  maxFutureDays?: number;
}

interface UseLazyDatesResult {
  dates: string[];
  loadMorePast: () => void;
  loadMoreFuture: () => void;
  canLoadMorePast: boolean;
  canLoadMoreFuture: boolean;
  todayIndex: number;
}

/**
 * Hook for lazy loading dates in chunks for better performance.
 * Starts with a small window and expands as user scrolls.
 */
export function useLazyDates({
  initialPastDays = 7,
  initialFutureDays = 7,
  loadChunkSize = 7,
  maxPastDays = 90,
  maxFutureDays = 90,
}: UseLazyDatesOptions = {}): UseLazyDatesResult {
  const [pastDays, setPastDays] = useState(initialPastDays);
  const [futureDays, setFutureDays] = useState(initialFutureDays);

  const dates = useMemo(() => {
    const result: string[] = [];
    for (let i = -pastDays; i <= futureDays; i++) {
      const date =
        i === 0 ? new Date() : i < 0 ? subDays(new Date(), Math.abs(i)) : addDays(new Date(), i);
      result.push(format(date, 'yyyy-MM-dd'));
    }
    return result;
  }, [pastDays, futureDays]);

  const loadMorePast = useCallback(() => {
    setPastDays((prev) => Math.min(prev + loadChunkSize, maxPastDays));
  }, [loadChunkSize, maxPastDays]);

  const loadMoreFuture = useCallback(() => {
    setFutureDays((prev) => Math.min(prev + loadChunkSize, maxFutureDays));
  }, [loadChunkSize, maxFutureDays]);

  const canLoadMorePast = pastDays < maxPastDays;
  const canLoadMoreFuture = futureDays < maxFutureDays;

  // Today is at index equal to pastDays (0-indexed from start)
  const todayIndex = pastDays;

  return {
    dates,
    loadMorePast,
    loadMoreFuture,
    canLoadMorePast,
    canLoadMoreFuture,
    todayIndex,
  };
}
