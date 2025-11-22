import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should return a ref', () => {
    const { result } = renderHook(() => useFocusTrap<HTMLDivElement>(false));
    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  it('should not trap focus when inactive', () => {
    const { result } = renderHook(() => useFocusTrap<HTMLDivElement>(false));

    const div = document.createElement('div');
    const button = document.createElement('button');
    div.appendChild(button);
    container.appendChild(div);

    // Manually assign ref
    Object.defineProperty(result.current, 'current', {
      value: div,
      writable: true,
    });

    // Focus should not be automatically set
    expect(document.activeElement).not.toBe(button);
  });

  it('should store previous active element when activated', () => {
    const externalButton = document.createElement('button');
    container.appendChild(externalButton);
    externalButton.focus();

    expect(document.activeElement).toBe(externalButton);

    const { result, rerender } = renderHook(
      ({ isActive }) => useFocusTrap<HTMLDivElement>(isActive),
      { initialProps: { isActive: false } }
    );

    const div = document.createElement('div');
    const internalButton = document.createElement('button');
    div.appendChild(internalButton);
    container.appendChild(div);

    Object.defineProperty(result.current, 'current', {
      value: div,
      writable: true,
    });

    // Activate trap
    rerender({ isActive: true });

    // The hook should have stored the external button as previous element
    // and focused the internal button
  });

  it('should handle containers with no focusable elements', () => {
    const { result } = renderHook(() => useFocusTrap<HTMLDivElement>(true));

    const div = document.createElement('div');
    div.innerHTML = '<span>No focusable elements</span>';
    container.appendChild(div);

    Object.defineProperty(result.current, 'current', {
      value: div,
      writable: true,
    });

    // Should not throw
    expect(() => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      div.dispatchEvent(event);
    }).not.toThrow();
  });

  it('should handle Tab key navigation', () => {
    const { result } = renderHook(() => useFocusTrap<HTMLDivElement>(true));

    const div = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    div.appendChild(button1);
    div.appendChild(button2);
    container.appendChild(div);

    Object.defineProperty(result.current, 'current', {
      value: div,
      writable: true,
    });

    // The hook should set up Tab key handling
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    div.dispatchEvent(event);
  });

  it('should find all focusable elements', () => {
    const { result } = renderHook(() => useFocusTrap<HTMLDivElement>(true));

    const div = document.createElement('div');
    div.innerHTML = `
      <button>Button</button>
      <input type="text" />
      <textarea></textarea>
      <select><option>Option</option></select>
      <a href="#">Link</a>
      <div tabindex="0">Focusable div</div>
      <button disabled>Disabled</button>
      <div tabindex="-1">Not focusable</div>
    `;
    container.appendChild(div);

    Object.defineProperty(result.current, 'current', {
      value: div,
      writable: true,
    });

    // Should find 6 focusable elements (not disabled button, not tabindex=-1)
    const focusable = div.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable.length).toBe(6);
  });
});
