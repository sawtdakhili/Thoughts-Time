import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useHapticFeedback } from './useHapticFeedback';

describe('useHapticFeedback', () => {
  let originalVibrate: typeof navigator.vibrate | undefined;

  beforeEach(() => {
    originalVibrate = navigator.vibrate;
  });

  afterEach(() => {
    if (originalVibrate) {
      Object.defineProperty(navigator, 'vibrate', {
        value: originalVibrate,
        writable: true,
        configurable: true,
      });
    }
  });

  it('should detect vibration support when available', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());

    expect(result.current.isSupported).toBe(true);
  });

  it('should detect no vibration support when unavailable', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());

    expect(result.current.isSupported).toBe(false);
  });

  it('should trigger light haptic pattern (10ms)', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());

    result.current.triggerHaptic('light');

    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it('should trigger medium haptic pattern (20ms)', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());

    result.current.triggerHaptic('medium');

    expect(vibrateMock).toHaveBeenCalledWith(20);
  });

  it('should trigger heavy haptic pattern (30ms)', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());

    result.current.triggerHaptic('heavy');

    expect(vibrateMock).toHaveBeenCalledWith(30);
  });

  it('should trigger success haptic pattern (sequence)', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());

    result.current.triggerHaptic('success');

    expect(vibrateMock).toHaveBeenCalledWith([10, 50, 10]);
  });

  it('should trigger warning haptic pattern (sequence)', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());

    result.current.triggerHaptic('warning');

    expect(vibrateMock).toHaveBeenCalledWith([20, 100, 20]);
  });

  it('should trigger error haptic pattern (sequence)', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());

    result.current.triggerHaptic('error');

    expect(vibrateMock).toHaveBeenCalledWith([30, 100, 30, 100, 30]);
  });

  it('should not throw when vibrate is unsupported', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());

    expect(() => {
      result.current.triggerHaptic('light');
      result.current.triggerHaptic('success');
      result.current.triggerHaptic('error');
    }).not.toThrow();
  });

  it('should handle multiple rapid haptic triggers', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());

    result.current.triggerHaptic('light');
    result.current.triggerHaptic('medium');
    result.current.triggerHaptic('heavy');

    expect(vibrateMock).toHaveBeenCalledTimes(3);
    expect(vibrateMock).toHaveBeenNthCalledWith(1, 10);
    expect(vibrateMock).toHaveBeenNthCalledWith(2, 20);
    expect(vibrateMock).toHaveBeenNthCalledWith(3, 30);
  });

  it('should gracefully handle vibrate function throwing errors', () => {
    const vibrateMock = vi.fn(() => {
      throw new Error('Vibration failed');
    });
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useHapticFeedback());

    // Should not throw even if navigator.vibrate throws
    expect(() => {
      result.current.triggerHaptic('light');
    }).not.toThrow();
  });
});
