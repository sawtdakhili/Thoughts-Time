import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, isModKey } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call handler when shortcut is triggered', () => {
    const handler = vi.fn();

    renderHook(() => useKeyboardShortcuts([{ key: 'a', handler }]));

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not call handler when different key is pressed', () => {
    const handler = vi.fn();

    renderHook(() => useKeyboardShortcuts([{ key: 'a', handler }]));

    const event = new KeyboardEvent('keydown', { key: 'b', bubbles: true });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle Ctrl modifier', () => {
    const handler = vi.fn();

    renderHook(() => useKeyboardShortcuts([{ key: 'z', ctrlKey: true, handler }]));

    // Without Ctrl
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }));
    expect(handler).not.toHaveBeenCalled();

    // With Ctrl
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle Meta modifier (Cmd on Mac)', () => {
    const handler = vi.fn();

    renderHook(() => useKeyboardShortcuts([{ key: 'z', metaKey: true, handler }]));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle both Ctrl and Meta for cross-platform support', () => {
    const handler = vi.fn();

    renderHook(() => useKeyboardShortcuts([{ key: 'z', ctrlKey: true, metaKey: true, handler }]));

    // Ctrl+Z (Windows/Linux)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    // Cmd+Z (Mac)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('should handle Shift modifier', () => {
    const handler = vi.fn();

    renderHook(() => useKeyboardShortcuts([{ key: 'z', shiftKey: true, handler }]));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', shiftKey: true, bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle Alt modifier', () => {
    const handler = vi.fn();

    renderHook(() => useKeyboardShortcuts([{ key: 'a', altKey: true, handler }]));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', altKey: true, bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should be case insensitive', () => {
    const handler = vi.fn();

    renderHook(() => useKeyboardShortcuts([{ key: 'A', handler }]));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should prevent default browser behavior', () => {
    const handler = vi.fn();

    renderHook(() => useKeyboardShortcuts([{ key: 'f', ctrlKey: true, handler }]));

    const event = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should ignore shortcuts when disabled', () => {
    const handler = vi.fn();

    renderHook(() => useKeyboardShortcuts([{ key: 'a', handler }], false));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('should ignore shortcuts when focused on input elements', () => {
    const handler = vi.fn();

    renderHook(() => useKeyboardShortcuts([{ key: 'a', handler }]));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    Object.defineProperty(event, 'target', { value: input });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('should ignore shortcuts when focused on textarea', () => {
    const handler = vi.fn();

    renderHook(() => useKeyboardShortcuts([{ key: 'a', handler }]));

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    Object.defineProperty(event, 'target', { value: textarea });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it('should only trigger one shortcut per key press', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts([
        { key: 'a', handler: handler1 },
        { key: 'a', handler: handler2 },
      ])
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should clean up event listener on unmount', () => {
    const handler = vi.fn();
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useKeyboardShortcuts([{ key: 'a', handler }]));

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});

describe('isModKey', () => {
  it('should return true for Ctrl key', () => {
    const event = new KeyboardEvent('keydown', { ctrlKey: true });
    expect(isModKey(event)).toBe(true);
  });

  it('should return true for Meta key', () => {
    const event = new KeyboardEvent('keydown', { metaKey: true });
    expect(isModKey(event)).toBe(true);
  });

  it('should return false when neither is pressed', () => {
    const event = new KeyboardEvent('keydown', {});
    expect(isModKey(event)).toBe(false);
  });
});
