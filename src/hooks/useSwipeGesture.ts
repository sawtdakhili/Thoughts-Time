import { useEffect, useRef, RefObject } from 'react';
import { MOBILE } from '../constants';

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  velocityThreshold?: number;
  preventScroll?: boolean;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
}

/**
 * Hook to detect swipe gestures on touch devices
 * Distinguishes between horizontal swipes and vertical scrolls
 */
export function useSwipeGesture<T extends HTMLElement>(
  ref: RefObject<T>,
  options: UseSwipeGestureOptions
): void {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = MOBILE.SWIPE_THRESHOLD,
    velocityThreshold = MOBILE.SWIPE_VELOCITY_THRESHOLD,
    preventScroll = false,
  } = options;

  const touchData = useRef<TouchData | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchData.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        currentX: touch.clientX,
        currentY: touch.clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchData.current) return;

      const touch = e.touches[0];
      touchData.current.currentX = touch.clientX;
      touchData.current.currentY = touch.clientY;

      // Calculate deltas
      const deltaX = Math.abs(touch.clientX - touchData.current.startX);
      const deltaY = Math.abs(touch.clientY - touchData.current.startY);

      // If horizontal swipe is more significant than vertical, prevent scroll
      if (preventScroll && deltaX > deltaY && deltaX > 10) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!touchData.current) return;

      const { startX, startY, startTime, currentX, currentY } = touchData.current;

      // Calculate distance and time
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      const deltaTime = Date.now() - startTime;

      // Calculate absolute distances
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Calculate velocity (pixels per millisecond)
      const velocity = deltaTime > 0 ? absDeltaX / deltaTime : 0;

      // Determine if this is a horizontal swipe (not vertical scroll)
      // Swipe must be more horizontal than vertical
      const isHorizontalSwipe = absDeltaX > absDeltaY;

      // Check if swipe meets threshold requirements
      const meetsThreshold = absDeltaX > threshold;
      const meetsVelocity = velocity > velocityThreshold;

      if (isHorizontalSwipe && (meetsThreshold || meetsVelocity)) {
        if (deltaX > 0 && onSwipeRight) {
          // Swiped right
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          // Swiped left
          onSwipeLeft();
        }
      }

      // Reset touch data
      touchData.current = null;
    };

    const handleTouchCancel = () => {
      touchData.current = null;
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [ref, onSwipeLeft, onSwipeRight, threshold, velocityThreshold, preventScroll]);
}
