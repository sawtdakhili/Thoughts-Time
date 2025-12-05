import { useState, useEffect } from 'react';
import { MOBILE } from '../constants';

interface UseKeyboardDetectionReturn {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
}

/**
 * Hook to detect virtual keyboard visibility on mobile devices
 * Works for both iOS (visualViewport API) and Android (resize events)
 */
export function useKeyboardDetection(): UseKeyboardDetectionReturn {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        // iOS and modern browsers
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const diff = windowHeight - viewportHeight;

        setKeyboardHeight(diff);
        setIsKeyboardVisible(diff > MOBILE.KEYBOARD_HEIGHT_THRESHOLD);
      } else {
        // Fallback for older browsers - can't reliably detect keyboard without visualViewport
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    };

    // Listen to visualViewport changes (iOS)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    // Listen to window resize (Android)
    window.addEventListener('resize', handleViewportChange);

    // Initial check
    handleViewportChange();

    // Cleanup
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  return {
    isKeyboardVisible,
    keyboardHeight,
  };
}
