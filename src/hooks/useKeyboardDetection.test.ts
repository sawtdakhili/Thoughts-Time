import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useKeyboardDetection } from './useKeyboardDetection';
import { MOBILE } from '../constants';

describe('useKeyboardDetection', () => {
  let originalVisualViewport: VisualViewport | null;

  beforeEach(() => {
    originalVisualViewport = window.visualViewport;
  });

  afterEach(() => {
    Object.defineProperty(window, 'visualViewport', {
      value: originalVisualViewport,
      writable: true,
      configurable: true,
    });
  });

  it('should initially detect no keyboard visible', () => {
    const mockViewport = {
      height: 800,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as VisualViewport;

    Object.defineProperty(window, 'visualViewport', {
      value: mockViewport,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useKeyboardDetection());

    expect(result.current.isKeyboardVisible).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
  });

  it('should detect keyboard visible when viewport height significantly smaller than window height', () => {
    const listeners: Record<string, Function> = {};
    const mockViewport = {
      height: 400,
      addEventListener: vi.fn((event: string, handler: Function) => {
        listeners[event] = handler;
      }),
      removeEventListener: vi.fn(),
    } as unknown as VisualViewport;

    Object.defineProperty(window, 'visualViewport', {
      value: mockViewport,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useKeyboardDetection());

    // Simulate viewport change
    act(() => {
      mockViewport.height = 400;
      if (listeners.resize) {
        listeners.resize();
      }
    });

    const expectedHeight = 800 - 400;
    expect(result.current.keyboardHeight).toBe(expectedHeight);
    expect(result.current.isKeyboardVisible).toBe(expectedHeight > MOBILE.KEYBOARD_HEIGHT_THRESHOLD);
  });

  it('should use KEYBOARD_HEIGHT_THRESHOLD constant for detection', () => {
    const listeners: Record<string, Function> = {};
    const mockViewport = {
      height: 800,
      addEventListener: vi.fn((event: string, handler: Function) => {
        listeners[event] = handler;
      }),
      removeEventListener: vi.fn(),
    } as unknown as VisualViewport;

    Object.defineProperty(window, 'visualViewport', {
      value: mockViewport,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useKeyboardDetection());

    // Keyboard height just below threshold
    act(() => {
      mockViewport.height = 800 - MOBILE.KEYBOARD_HEIGHT_THRESHOLD + 1;
      if (listeners.resize) {
        listeners.resize();
      }
    });

    expect(result.current.isKeyboardVisible).toBe(false);

    // Keyboard height at threshold
    act(() => {
      mockViewport.height = 800 - MOBILE.KEYBOARD_HEIGHT_THRESHOLD;
      if (listeners.resize) {
        listeners.resize();
      }
    });

    expect(result.current.isKeyboardVisible).toBe(false);

    // Keyboard height above threshold
    act(() => {
      mockViewport.height = 800 - MOBILE.KEYBOARD_HEIGHT_THRESHOLD - 1;
      if (listeners.resize) {
        listeners.resize();
      }
    });

    expect(result.current.isKeyboardVisible).toBe(true);
  });

  it('should handle keyboard hiding', () => {
    const listeners: Record<string, Function> = {};
    const mockViewport = {
      height: 400,
      addEventListener: vi.fn((event: string, handler: Function) => {
        listeners[event] = handler;
      }),
      removeEventListener: vi.fn(),
    } as unknown as VisualViewport;

    Object.defineProperty(window, 'visualViewport', {
      value: mockViewport,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useKeyboardDetection());

    // Show keyboard
    act(() => {
      mockViewport.height = 400;
      if (listeners.resize) {
        listeners.resize();
      }
    });

    expect(result.current.isKeyboardVisible).toBe(true);

    // Hide keyboard
    act(() => {
      mockViewport.height = 800;
      if (listeners.resize) {
        listeners.resize();
      }
    });

    expect(result.current.isKeyboardVisible).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerMock = vi.fn();
    const mockViewport = {
      height: 800,
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerMock,
    } as unknown as VisualViewport;

    Object.defineProperty(window, 'visualViewport', {
      value: mockViewport,
      writable: true,
      configurable: true,
    });

    const { unmount } = renderHook(() => useKeyboardDetection());

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should handle missing visualViewport (fallback to window resize)', () => {
    Object.defineProperty(window, 'visualViewport', {
      value: null,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useKeyboardDetection());

    // Should still work with window resize events
    expect(result.current.isKeyboardVisible).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);

    // Simulate window resize
    act(() => {
      Object.defineProperty(window, 'innerHeight', {
        value: 400,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event('resize'));
    });

    // Without visualViewport, it should still report keyboard as not visible
    // since we can't accurately detect it
    expect(result.current.isKeyboardVisible).toBe(false);
  });

  it('should handle rapid keyboard show/hide events', () => {
    const listeners: Record<string, Function> = {};
    const mockViewport = {
      height: 800,
      addEventListener: vi.fn((event: string, handler: Function) => {
        listeners[event] = handler;
      }),
      removeEventListener: vi.fn(),
    } as unknown as VisualViewport;

    Object.defineProperty(window, 'visualViewport', {
      value: mockViewport,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useKeyboardDetection());

    // Rapid show/hide
    act(() => {
      mockViewport.height = 400;
      if (listeners.resize) listeners.resize();

      mockViewport.height = 800;
      if (listeners.resize) listeners.resize();

      mockViewport.height = 350;
      if (listeners.resize) listeners.resize();
    });

    expect(result.current.isKeyboardVisible).toBe(true);
    expect(result.current.keyboardHeight).toBe(800 - 350);
  });
});
