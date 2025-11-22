import { useRef, useEffect, useCallback } from 'react';
import { ANIMATION } from '../constants';

interface UseWheelNavigationOptions {
  scrollRef: React.RefObject<HTMLDivElement>;
  viewMode: 'infinite' | 'book';
  onNextDay?: () => void;
  onPreviousDay?: () => void;
  setIsPageFlipping: (flipping: boolean) => void;
}

/**
 * Hook to handle wheel-based navigation in book mode.
 * Detects over-scroll at boundaries and triggers day navigation.
 */
export function useWheelNavigation({
  scrollRef,
  viewMode,
  onNextDay,
  onPreviousDay,
  setIsPageFlipping,
}: UseWheelNavigationOptions) {
  const isTransitioning = useRef(false);
  const wheelDeltaY = useRef(0);
  const lastScrollTop = useRef(0);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (
        !scrollRef.current ||
        viewMode !== 'book' ||
        !onNextDay ||
        !onPreviousDay ||
        isTransitioning.current
      )
        return;

      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isScrollable = scrollHeight > clientHeight;

      // Detect if we're at boundaries
      const atBottom = scrollTop + clientHeight >= scrollHeight - 5;
      const atTop = scrollTop <= 5;

      // For non-scrollable content OR at boundaries, use wheel delta accumulation
      if (!isScrollable || atBottom || atTop) {
        wheelDeltaY.current += e.deltaY;

        // Threshold to prevent accidental triggers - requires intentional over-scroll
        if (wheelDeltaY.current > ANIMATION.WHEEL_DELTA_THRESHOLD) {
          // Scroll down = next day
          wheelDeltaY.current = 0;
          isTransitioning.current = true;
          setIsPageFlipping(true);
          setTimeout(() => {
            onNextDay();
            setTimeout(() => {
              if (scrollRef.current) scrollRef.current.scrollTop = 0;
              setTimeout(() => {
                setIsPageFlipping(false);
                isTransitioning.current = false;
              }, ANIMATION.PAGE_FLIP_DURATION);
            }, ANIMATION.SCROLL_RESET_DELAY);
          }, ANIMATION.SCROLL_RESET_DELAY);
        } else if (wheelDeltaY.current < -ANIMATION.WHEEL_DELTA_THRESHOLD) {
          // Scroll up = previous day
          wheelDeltaY.current = 0;
          isTransitioning.current = true;
          setIsPageFlipping(true);
          setTimeout(() => {
            onPreviousDay();
            setTimeout(() => {
              if (scrollRef.current) scrollRef.current.scrollTop = 0;
              setTimeout(() => {
                setIsPageFlipping(false);
                isTransitioning.current = false;
              }, ANIMATION.PAGE_FLIP_DURATION);
            }, ANIMATION.SCROLL_RESET_DELAY);
          }, ANIMATION.SCROLL_RESET_DELAY);
        }
      } else {
        // Reset delta when scrolling normally (not at boundaries)
        wheelDeltaY.current = 0;
      }
    },
    [scrollRef, viewMode, onNextDay, onPreviousDay, setIsPageFlipping]
  );

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    lastScrollTop.current = scrollRef.current.scrollTop;
  }, [scrollRef]);

  // Add wheel event listener for book mode
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl && viewMode === 'book') {
      scrollEl.addEventListener('wheel', handleWheel as EventListener);
      return () => scrollEl.removeEventListener('wheel', handleWheel as EventListener);
    }
  }, [viewMode, handleWheel, scrollRef]);

  return { handleScroll };
}
