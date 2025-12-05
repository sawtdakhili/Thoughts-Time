import { useCallback, useMemo } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface UseHapticFeedbackReturn {
  triggerHaptic: (pattern: HapticPattern) => void;
  isSupported: boolean;
}

/**
 * Hook to trigger haptic feedback on supported devices
 * Gracefully degrades on unsupported browsers
 */
export function useHapticFeedback(): UseHapticFeedbackReturn {
  // Check if Vibration API is supported
  const isSupported = useMemo(() => {
    return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
  }, []);

  const triggerHaptic = useCallback(
    (pattern: HapticPattern) => {
      if (!isSupported) return;

      // Map patterns to vibration durations (in milliseconds)
      const patternMap: Record<HapticPattern, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 30,
        success: [10, 50, 10], // Short, pause, short
        warning: [20, 100, 20], // Medium, pause, medium
        error: [30, 100, 30, 100, 30], // Heavy, pause, heavy, pause, heavy
      };

      const vibrationPattern = patternMap[pattern];

      try {
        if (Array.isArray(vibrationPattern)) {
          navigator.vibrate(vibrationPattern);
        } else {
          navigator.vibrate(vibrationPattern);
        }
      } catch (error) {
        // Silently fail if vibration fails
        console.warn('Haptic feedback failed:', error);
      }
    },
    [isSupported]
  );

  return {
    triggerHaptic,
    isSupported,
  };
}
