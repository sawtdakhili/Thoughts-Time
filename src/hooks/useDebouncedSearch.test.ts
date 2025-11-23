import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedSearch } from './useDebouncedSearch';

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedSearch('initial'));

    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedSearch(value, 300), {
      initialProps: { value: 'initial' },
    });

    // Update value
    rerender({ value: 'updated' });

    // Value should not have changed yet
    expect(result.current).toBe('initial');

    // Advance timers
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('should use default delay of 300ms', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedSearch(value), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });

    // At 299ms, should still be initial
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    // At 300ms, should be updated
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedSearch(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'abc' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'abcd' });

    // Should still be 'a' as we keep resetting
    expect(result.current).toBe('a');

    // After full delay from last change
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('abcd');
  });

  it('should handle custom delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedSearch(value, 500), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('updated');
  });

  it('should handle empty string', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedSearch(value, 300), {
      initialProps: { value: 'search' },
    });

    rerender({ value: '' });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('');
  });

  it('should cleanup timer on unmount', () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebouncedSearch(value, 300), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });

    // Unmount before timer fires
    unmount();

    // This should not throw
    act(() => {
      vi.advanceTimersByTime(300);
    });
  });

  it('should handle delay of 0', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedSearch(value, 0), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe('updated');
  });
});
