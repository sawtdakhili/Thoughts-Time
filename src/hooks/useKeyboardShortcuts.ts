import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
}

/**
 * Hook to register keyboard shortcuts
 * @param shortcuts Array of keyboard shortcut configurations
 * @param enabled Whether shortcuts are currently enabled (default: true)
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();

        // For ctrl/meta, if both are specified as true, match if either is pressed (cross-platform support)
        let modifierMatches = true;
        if (shortcut.ctrlKey === true && shortcut.metaKey === true) {
          modifierMatches = event.ctrlKey || event.metaKey;
        } else {
          const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
          const metaMatches = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;
          modifierMatches = ctrlMatches && metaMatches;
        }

        const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey;

        // Check if the shortcut matches
        if (keyMatches && modifierMatches && shiftMatches && altMatches) {
          // Prevent default browser behavior (like Cmd+F opening browser search)
          event.preventDefault();
          shortcut.handler(event);
          break; // Only trigger one shortcut per key press
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

/**
 * Utility to check if Cmd (Mac) or Ctrl (Windows/Linux) key is pressed
 */
export function isModKey(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey;
}
