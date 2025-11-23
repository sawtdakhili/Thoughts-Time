import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWheelNavigation } from './useWheelNavigation';
import { ANIMATION } from '../constants';

describe('useWheelNavigation', () => {
  let scrollRef: React.RefObject<HTMLDivElement>;
  let scrollElement: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();

    // Create a mock scroll element
    scrollElement = document.createElement('div');
    Object.defineProperties(scrollElement, {
      scrollTop: { value: 0, writable: true },
      scrollHeight: { value: 500, writable: true },
      clientHeight: { value: 300, writable: true },
    });
    document.body.appendChild(scrollElement);

    scrollRef = { current: scrollElement };
  });

  afterEach(() => {
    document.body.removeChild(scrollElement);
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should return handleScroll function', () => {
    const setIsPageFlipping = vi.fn();

    const { result } = renderHook(() =>
      useWheelNavigation({
        scrollRef,
        viewMode: 'book',
        onNextDay: vi.fn(),
        onPreviousDay: vi.fn(),
        setIsPageFlipping,
      })
    );

    expect(result.current.handleScroll).toBeDefined();
    expect(typeof result.current.handleScroll).toBe('function');
  });

  it('should not handle wheel in infinite mode', () => {
    const onNextDay = vi.fn();
    const onPreviousDay = vi.fn();
    const setIsPageFlipping = vi.fn();

    renderHook(() =>
      useWheelNavigation({
        scrollRef,
        viewMode: 'infinite',
        onNextDay,
        onPreviousDay,
        setIsPageFlipping,
      })
    );

    // Simulate wheel event
    const wheelEvent = new WheelEvent('wheel', { deltaY: 200 });
    scrollElement.dispatchEvent(wheelEvent);

    expect(onNextDay).not.toHaveBeenCalled();
    expect(onPreviousDay).not.toHaveBeenCalled();
  });

  it('should trigger next day on scroll down at bottom', () => {
    const onNextDay = vi.fn();
    const onPreviousDay = vi.fn();
    const setIsPageFlipping = vi.fn();

    // Set element at bottom
    Object.defineProperty(scrollElement, 'scrollTop', { value: 200, writable: true });

    renderHook(() =>
      useWheelNavigation({
        scrollRef,
        viewMode: 'book',
        onNextDay,
        onPreviousDay,
        setIsPageFlipping,
      })
    );

    // Simulate scroll down past threshold
    const wheelEvent = new WheelEvent('wheel', { deltaY: ANIMATION.WHEEL_DELTA_THRESHOLD + 10 });
    scrollElement.dispatchEvent(wheelEvent);

    // Should set page flipping
    expect(setIsPageFlipping).toHaveBeenCalledWith(true);

    // Advance timers for the delayed call
    vi.advanceTimersByTime(ANIMATION.SCROLL_RESET_DELAY);
    expect(onNextDay).toHaveBeenCalled();
  });

  it('should trigger previous day on scroll up at top', () => {
    const onNextDay = vi.fn();
    const onPreviousDay = vi.fn();
    const setIsPageFlipping = vi.fn();

    // Set element at top
    Object.defineProperty(scrollElement, 'scrollTop', { value: 0, writable: true });

    renderHook(() =>
      useWheelNavigation({
        scrollRef,
        viewMode: 'book',
        onNextDay,
        onPreviousDay,
        setIsPageFlipping,
      })
    );

    // Simulate scroll up past threshold
    const wheelEvent = new WheelEvent('wheel', { deltaY: -(ANIMATION.WHEEL_DELTA_THRESHOLD + 10) });
    scrollElement.dispatchEvent(wheelEvent);

    expect(setIsPageFlipping).toHaveBeenCalledWith(true);

    vi.advanceTimersByTime(ANIMATION.SCROLL_RESET_DELAY);
    expect(onPreviousDay).toHaveBeenCalled();
  });

  it('should not trigger navigation when not at boundary', () => {
    const onNextDay = vi.fn();
    const onPreviousDay = vi.fn();
    const setIsPageFlipping = vi.fn();

    // Set element in middle of scroll
    Object.defineProperty(scrollElement, 'scrollTop', { value: 100, writable: true });

    renderHook(() =>
      useWheelNavigation({
        scrollRef,
        viewMode: 'book',
        onNextDay,
        onPreviousDay,
        setIsPageFlipping,
      })
    );

    const wheelEvent = new WheelEvent('wheel', { deltaY: 200 });
    scrollElement.dispatchEvent(wheelEvent);

    expect(onNextDay).not.toHaveBeenCalled();
    expect(onPreviousDay).not.toHaveBeenCalled();
  });

  it('should handle non-scrollable content', () => {
    const onNextDay = vi.fn();
    const setIsPageFlipping = vi.fn();

    // Make content non-scrollable (height equals client height)
    Object.defineProperty(scrollElement, 'scrollHeight', { value: 300, writable: true });

    renderHook(() =>
      useWheelNavigation({
        scrollRef,
        viewMode: 'book',
        onNextDay,
        onPreviousDay: vi.fn(),
        setIsPageFlipping,
      })
    );

    // Should still trigger on wheel since content is non-scrollable
    const wheelEvent = new WheelEvent('wheel', { deltaY: ANIMATION.WHEEL_DELTA_THRESHOLD + 10 });
    scrollElement.dispatchEvent(wheelEvent);

    expect(setIsPageFlipping).toHaveBeenCalledWith(true);
    vi.advanceTimersByTime(ANIMATION.SCROLL_RESET_DELAY);
    expect(onNextDay).toHaveBeenCalled();
  });

  it('should accumulate wheel delta before triggering', () => {
    const onNextDay = vi.fn();
    const setIsPageFlipping = vi.fn();

    Object.defineProperty(scrollElement, 'scrollTop', { value: 200, writable: true });

    renderHook(() =>
      useWheelNavigation({
        scrollRef,
        viewMode: 'book',
        onNextDay,
        onPreviousDay: vi.fn(),
        setIsPageFlipping,
      })
    );

    // Small wheel events that don't exceed threshold
    const smallWheel = new WheelEvent('wheel', { deltaY: 50 });
    scrollElement.dispatchEvent(smallWheel);
    expect(onNextDay).not.toHaveBeenCalled();

    scrollElement.dispatchEvent(smallWheel);
    expect(onNextDay).not.toHaveBeenCalled();

    // This should push it over the threshold
    scrollElement.dispatchEvent(smallWheel);
    scrollElement.dispatchEvent(smallWheel);

    vi.advanceTimersByTime(ANIMATION.SCROLL_RESET_DELAY);
    expect(onNextDay).toHaveBeenCalled();
  });

  it('should handle scroll event updates', () => {
    const setIsPageFlipping = vi.fn();

    const { result } = renderHook(() =>
      useWheelNavigation({
        scrollRef,
        viewMode: 'book',
        onNextDay: vi.fn(),
        onPreviousDay: vi.fn(),
        setIsPageFlipping,
      })
    );

    // Should not throw
    expect(() => {
      result.current.handleScroll();
    }).not.toThrow();
  });

  it('should handle null scrollRef', () => {
    const onNextDay = vi.fn();
    const nullRef = { current: null };

    renderHook(() =>
      useWheelNavigation({
        scrollRef: nullRef as React.RefObject<HTMLDivElement>,
        viewMode: 'book',
        onNextDay,
        onPreviousDay: vi.fn(),
        setIsPageFlipping: vi.fn(),
      })
    );

    // Should not throw even with null ref
    expect(onNextDay).not.toHaveBeenCalled();
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(scrollElement, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useWheelNavigation({
        scrollRef,
        viewMode: 'book',
        onNextDay: vi.fn(),
        onPreviousDay: vi.fn(),
        setIsPageFlipping: vi.fn(),
      })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function));
  });
});
