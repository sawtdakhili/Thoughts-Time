import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLazyDates } from './useLazyDates';

describe('useLazyDates', () => {
  beforeEach(() => {
    // Mock date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial dates with default options', () => {
    const { result } = renderHook(() => useLazyDates());

    expect(result.current.dates).toHaveLength(15); // 7 past + today + 7 future
    expect(result.current.todayIndex).toBe(7);
    expect(result.current.canLoadMorePast).toBe(true);
    expect(result.current.canLoadMoreFuture).toBe(true);
  });

  it('should use custom initial days', () => {
    const { result } = renderHook(() =>
      useLazyDates({
        initialPastDays: 3,
        initialFutureDays: 5,
      })
    );

    expect(result.current.dates).toHaveLength(9); // 3 past + today + 5 future
    expect(result.current.todayIndex).toBe(3);
  });

  it('should include today in the correct format', () => {
    const { result } = renderHook(() => useLazyDates());

    const todayDate = result.current.dates[result.current.todayIndex];
    expect(todayDate).toBe('2024-06-15');
  });

  it('should load more past dates', () => {
    const { result } = renderHook(() =>
      useLazyDates({
        initialPastDays: 7,
        loadChunkSize: 7,
        maxPastDays: 30,
      })
    );

    const initialLength = result.current.dates.length;

    act(() => {
      result.current.loadMorePast();
    });

    expect(result.current.dates.length).toBe(initialLength + 7);
    expect(result.current.todayIndex).toBe(14); // Now 14 past days
  });

  it('should load more future dates', () => {
    const { result } = renderHook(() =>
      useLazyDates({
        initialFutureDays: 7,
        loadChunkSize: 7,
        maxFutureDays: 30,
      })
    );

    const initialLength = result.current.dates.length;

    act(() => {
      result.current.loadMoreFuture();
    });

    expect(result.current.dates.length).toBe(initialLength + 7);
  });

  it('should not exceed max past days', () => {
    const { result } = renderHook(() =>
      useLazyDates({
        initialPastDays: 5,
        loadChunkSize: 10,
        maxPastDays: 10,
      })
    );

    act(() => {
      result.current.loadMorePast();
    });

    // Should cap at maxPastDays
    expect(result.current.canLoadMorePast).toBe(false);
    expect(result.current.todayIndex).toBe(10);
  });

  it('should not exceed max future days', () => {
    const { result } = renderHook(() =>
      useLazyDates({
        initialFutureDays: 5,
        loadChunkSize: 10,
        maxFutureDays: 10,
      })
    );

    act(() => {
      result.current.loadMoreFuture();
    });

    expect(result.current.canLoadMoreFuture).toBe(false);
  });

  it('should return dates in chronological order', () => {
    const { result } = renderHook(() =>
      useLazyDates({
        initialPastDays: 2,
        initialFutureDays: 2,
      })
    );

    const dates = result.current.dates;
    expect(dates[0]).toBe('2024-06-13'); // 2 days ago
    expect(dates[1]).toBe('2024-06-14'); // yesterday
    expect(dates[2]).toBe('2024-06-15'); // today
    expect(dates[3]).toBe('2024-06-16'); // tomorrow
    expect(dates[4]).toBe('2024-06-17'); // 2 days from now
  });

  it('should handle multiple load calls', () => {
    const { result } = renderHook(() =>
      useLazyDates({
        initialPastDays: 3,
        initialFutureDays: 3,
        loadChunkSize: 5,
        maxPastDays: 20,
        maxFutureDays: 20,
      })
    );

    act(() => {
      result.current.loadMorePast();
      result.current.loadMoreFuture();
    });

    // 8 past + today + 8 future = 17
    expect(result.current.dates.length).toBe(17);
    expect(result.current.todayIndex).toBe(8);
  });
});
