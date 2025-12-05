import { useState, useEffect } from 'react';
import { MOBILE } from '../constants';

interface UseMobileLayoutReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  windowWidth: number;
  windowHeight: number;
}

/**
 * Hook to detect mobile/tablet/desktop layouts based on screen size
 * Uses window.matchMedia for optimal performance
 */
export function useMobileLayout(): UseMobileLayoutReturn {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };

    // Listen to window resize
    window.addEventListener('resize', handleResize);

    // Initial check
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = windowWidth < MOBILE.BREAKPOINT;
  const isTablet = windowWidth >= MOBILE.BREAKPOINT && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  return {
    isMobile,
    isTablet,
    isDesktop,
    windowWidth,
    windowHeight,
  };
}
