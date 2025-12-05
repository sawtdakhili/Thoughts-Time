/**
 * Animation and interaction constants
 */
export const ANIMATION = {
  /** Wheel delta threshold for page flip trigger */
  WHEEL_DELTA_THRESHOLD: 150,
  /** Duration of page flip animation in ms */
  PAGE_FLIP_DURATION: 600,
  /** Delay before scroll reset after page flip */
  SCROLL_RESET_DELAY: 50,
  /** Toast notification duration in ms */
  TOAST_DURATION: 3000,
  /** Debounce delay for search in ms */
  SEARCH_DEBOUNCE: 300,
} as const;

/**
 * Date range constants
 */
export const DATE_RANGE = {
  /** Number of past days to show */
  PAST_DAYS: 30,
  /** Number of future days to show */
  FUTURE_DAYS: 30,
} as const;

/**
 * Item depth limits
 */
export const LIMITS = {
  /** Maximum nesting depth for todos */
  MAX_TODO_DEPTH: 1,
  /** Maximum nesting depth for notes */
  MAX_NOTE_DEPTH: 2,
  /** Maximum number of undo/redo actions to keep */
  MAX_HISTORY_ACTIONS: 20,
} as const;

/**
 * Scroll detection thresholds
 */
export const SCROLL = {
  /** Pixel threshold for detecting bottom of scroll */
  BOTTOM_THRESHOLD: 50,
  /** Pixel threshold for boundary detection */
  BOUNDARY_THRESHOLD: 5,
} as const;

/**
 * Mobile responsive constants
 */
export const MOBILE = {
  /** Mobile breakpoint in pixels */
  BREAKPOINT: 768,
  /** Footer height in pixels */
  FOOTER_HEIGHT: 60,
  /** FAB size in pixels */
  FAB_SIZE: 56,
  /** Minimum touch target size */
  MIN_TOUCH_TARGET: 44,
  /** Swipe gesture threshold in pixels */
  SWIPE_THRESHOLD: 50,
  /** Swipe velocity threshold (px/ms) */
  SWIPE_VELOCITY_THRESHOLD: 0.3,
  /** Bottom sheet slide duration in ms */
  BOTTOM_SHEET_DURATION: 300,
  /** Keyboard detection threshold in pixels */
  KEYBOARD_HEIGHT_THRESHOLD: 150,
} as const;
