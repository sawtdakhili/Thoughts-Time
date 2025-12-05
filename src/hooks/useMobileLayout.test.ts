import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useMobileLayout } from './useMobileLayout';
import { MOBILE } from '../constants';

describe('useMobileLayout', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  it('should detect mobile layout when width < 768px', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });

    const { result } = renderHook(() => useMobileLayout());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.windowWidth).toBe(375);
    expect(result.current.windowHeight).toBe(667);
  });

  it('should detect tablet layout when width between 768px and 1023px', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 900,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 600,
    });

    const { result } = renderHook(() => useMobileLayout());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.windowWidth).toBe(900);
    expect(result.current.windowHeight).toBe(600);
  });

  it('should detect desktop layout when width >= 1024px', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1440,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 900,
    });

    const { result } = renderHook(() => useMobileLayout());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.windowWidth).toBe(1440);
    expect(result.current.windowHeight).toBe(900);
  });

  it('should use MOBILE.BREAKPOINT constant for mobile detection', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: MOBILE.BREAKPOINT - 1,
    });

    const { result } = renderHook(() => useMobileLayout());

    expect(result.current.isMobile).toBe(true);

    // Right at breakpoint should be tablet
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: MOBILE.BREAKPOINT,
    });

    const { result: result2 } = renderHook(() => useMobileLayout());
    expect(result2.current.isMobile).toBe(false);
    expect(result2.current.isTablet).toBe(true);
  });

  it('should update dimensions on window resize', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1440,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 900,
    });

    const { result } = renderHook(() => useMobileLayout());

    expect(result.current.isDesktop).toBe(true);

    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.windowWidth).toBe(375);
    expect(result.current.windowHeight).toBe(667);
  });

  it('should clean up resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useMobileLayout());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should handle rapid resize events', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1440,
    });

    const { result } = renderHook(() => useMobileLayout());

    // Simulate multiple rapid resize events
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      window.dispatchEvent(new Event('resize'));

      Object.defineProperty(window, 'innerWidth', { value: 600 });
      window.dispatchEvent(new Event('resize'));

      Object.defineProperty(window, 'innerWidth', { value: 400 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.windowWidth).toBe(400);
    expect(result.current.isMobile).toBe(true);
  });
});
