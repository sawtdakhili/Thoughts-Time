import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSwipeGesture } from './useSwipeGesture';
import { MOBILE } from '../constants';
import { RefObject } from 'react';

describe('useSwipeGesture', () => {
  const createTouchEvent = (type: string, clientX: number, clientY: number): TouchEvent => {
    return {
      type,
      touches: [{ clientX, clientY }] as Touch[],
      preventDefault: vi.fn(),
    } as unknown as TouchEvent;
  };

  const createMockElement = () => {
    const listeners: Record<string, Function> = {};
    return {
      addEventListener: vi.fn((event: string, handler: Function) => {
        listeners[event] = handler;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: (event: TouchEvent) => {
        const handler = listeners[event.type];
        if (handler) handler(event);
      },
      _listeners: listeners,
    } as unknown as HTMLElement;
  };

  it('should detect swipe right', () => {
    const onSwipeRight = vi.fn();
    const mockElement = createMockElement();
    const ref = { current: mockElement } as RefObject<HTMLElement>;

    renderHook(() => useSwipeGesture(ref, { onSwipeRight }));

    // Simulate swipe right
    const startEvent = createTouchEvent('touchstart', 100, 300);
    mockElement.dispatchEvent(startEvent);

    const moveEvent = createTouchEvent('touchmove', 200, 305);
    mockElement.dispatchEvent(moveEvent);

    const endEvent = { type: 'touchend' } as TouchEvent;
    (mockElement as any)._listeners.touchend();

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it('should detect swipe left', () => {
    const onSwipeLeft = vi.fn();
    const mockElement = createMockElement();
    const ref = { current: mockElement } as RefObject<HTMLElement>;

    renderHook(() => useSwipeGesture(ref, { onSwipeLeft }));

    // Simulate swipe left
    const startEvent = createTouchEvent('touchstart', 200, 300);
    mockElement.dispatchEvent(startEvent);

    const moveEvent = createTouchEvent('touchmove', 100, 305);
    mockElement.dispatchEvent(moveEvent);

    (mockElement as any)._listeners.touchend();

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });

  it('should not trigger swipe when distance below threshold', () => {
    const onSwipeRight = vi.fn();
    const onSwipeLeft = vi.fn();
    const mockElement = createMockElement();
    const ref = { current: mockElement } as RefObject<HTMLElement>;

    renderHook(() =>
      useSwipeGesture(ref, {
        onSwipeRight,
        onSwipeLeft,
        threshold: MOBILE.SWIPE_THRESHOLD,
      })
    );

    // Simulate short swipe (below threshold)
    const startEvent = createTouchEvent('touchstart', 100, 300);
    mockElement.dispatchEvent(startEvent);

    const moveEvent = createTouchEvent('touchmove', 120, 305); // Only 20px
    mockElement.dispatchEvent(moveEvent);

    (mockElement as any)._listeners.touchend();

    expect(onSwipeRight).not.toHaveBeenCalled();
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('should not trigger swipe when movement is more vertical than horizontal', () => {
    const onSwipeRight = vi.fn();
    const mockElement = createMockElement();
    const ref = { current: mockElement } as RefObject<HTMLElement>;

    renderHook(() => useSwipeGesture(ref, { onSwipeRight }));

    // Simulate vertical movement (scroll)
    const startEvent = createTouchEvent('touchstart', 100, 100);
    mockElement.dispatchEvent(startEvent);

    const moveEvent = createTouchEvent('touchmove', 120, 300); // 20px horizontal, 200px vertical
    mockElement.dispatchEvent(moveEvent);

    (mockElement as any)._listeners.touchend();

    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('should use custom threshold', () => {
    const onSwipeRight = vi.fn();
    const customThreshold = 100;
    const mockElement = createMockElement();
    const ref = { current: mockElement } as RefObject<HTMLElement>;

    renderHook(() =>
      useSwipeGesture(ref, {
        onSwipeRight,
        threshold: customThreshold,
      })
    );

    // Swipe just below custom threshold
    const startEvent = createTouchEvent('touchstart', 100, 300);
    mockElement.dispatchEvent(startEvent);

    const moveEvent = createTouchEvent('touchmove', 199, 305);
    mockElement.dispatchEvent(moveEvent);

    (mockElement as any)._listeners.touchend();

    expect(onSwipeRight).not.toHaveBeenCalled();

    // Swipe above custom threshold
    const startEvent2 = createTouchEvent('touchstart', 100, 300);
    mockElement.dispatchEvent(startEvent2);

    const moveEvent2 = createTouchEvent('touchmove', 201, 305);
    mockElement.dispatchEvent(moveEvent2);

    (mockElement as any)._listeners.touchend();

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it('should trigger when distance meets threshold', () => {
    const onSwipeRight = vi.fn();
    const mockElement = createMockElement();
    const ref = { current: mockElement } as RefObject<HTMLElement>;

    renderHook(() =>
      useSwipeGesture(ref, {
        onSwipeRight,
        threshold: MOBILE.SWIPE_THRESHOLD,
      })
    );

    // Simulate swipe that meets threshold
    const startEvent = createTouchEvent('touchstart', 100, 300);
    mockElement.dispatchEvent(startEvent);

    const moveEvent = createTouchEvent('touchmove', 100 + MOBILE.SWIPE_THRESHOLD + 10, 305);
    mockElement.dispatchEvent(moveEvent);

    (mockElement as any)._listeners.touchend();

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it('should preventDefault on touchmove when preventScroll is true and horizontal swipe detected', () => {
    const mockElement = createMockElement();
    const ref = { current: mockElement } as RefObject<HTMLElement>;

    renderHook(() =>
      useSwipeGesture(ref, {
        onSwipeRight: vi.fn(),
        preventScroll: true,
      })
    );

    const startEvent = createTouchEvent('touchstart', 100, 300);
    mockElement.dispatchEvent(startEvent);

    const moveEvent = createTouchEvent('touchmove', 120, 305); // More horizontal than vertical
    mockElement.dispatchEvent(moveEvent);

    expect(moveEvent.preventDefault).toHaveBeenCalled();
  });

  it('should not preventDefault when preventScroll is false', () => {
    const mockElement = createMockElement();
    const ref = { current: mockElement } as RefObject<HTMLElement>;

    renderHook(() =>
      useSwipeGesture(ref, {
        onSwipeRight: vi.fn(),
        preventScroll: false,
      })
    );

    const startEvent = createTouchEvent('touchstart', 100, 300);
    mockElement.dispatchEvent(startEvent);

    const moveEvent = createTouchEvent('touchmove', 120, 305);
    mockElement.dispatchEvent(moveEvent);

    expect(moveEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should handle touchcancel event', () => {
    const onSwipeRight = vi.fn();
    const mockElement = createMockElement();
    const ref = { current: mockElement } as RefObject<HTMLElement>;

    renderHook(() => useSwipeGesture(ref, { onSwipeRight }));

    const startEvent = createTouchEvent('touchstart', 100, 300);
    mockElement.dispatchEvent(startEvent);

    const moveEvent = createTouchEvent('touchmove', 200, 305);
    mockElement.dispatchEvent(moveEvent);

    // Cancel instead of end
    (mockElement as any)._listeners.touchcancel();

    // Touchend after cancel should not trigger swipe
    (mockElement as any)._listeners.touchend();

    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('should clean up event listeners on unmount', () => {
    const mockElement = createMockElement();
    const ref = { current: mockElement } as RefObject<HTMLElement>;

    const { unmount } = renderHook(() =>
      useSwipeGesture(ref, {
        onSwipeRight: vi.fn(),
      })
    );

    unmount();

    expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
    expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
    expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function));
  });

  it('should not throw when ref.current is null', () => {
    const ref = { current: null } as RefObject<HTMLElement>;

    expect(() => {
      renderHook(() =>
        useSwipeGesture(ref, {
          onSwipeRight: vi.fn(),
        })
      );
    }).not.toThrow();
  });

  it('should handle multiple consecutive swipes', () => {
    const onSwipeRight = vi.fn();
    const onSwipeLeft = vi.fn();
    const mockElement = createMockElement();
    const ref = { current: mockElement } as RefObject<HTMLElement>;

    renderHook(() => useSwipeGesture(ref, { onSwipeRight, onSwipeLeft }));

    // First swipe right
    mockElement.dispatchEvent(createTouchEvent('touchstart', 100, 300));
    mockElement.dispatchEvent(createTouchEvent('touchmove', 200, 305));
    (mockElement as any)._listeners.touchend();

    // Second swipe left
    mockElement.dispatchEvent(createTouchEvent('touchstart', 200, 300));
    mockElement.dispatchEvent(createTouchEvent('touchmove', 100, 305));
    (mockElement as any)._listeners.touchend();

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });
});
