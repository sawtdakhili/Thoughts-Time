# Mobile Implementation Guide

## Overview

The Thoughts & Time app now includes a complete mobile-responsive implementation designed for touchscreen devices. The mobile experience features:

- **Single-pane view** with swipe navigation
- **Bottom sheet** for input and interactions
- **Floating Action Button (FAB)** for quick capture
- **Haptic feedback** for tactile responses
- **Touch-optimized** UI with 44px minimum targets
- **Keyboard-aware** footer that hides when virtual keyboard appears

## Architecture

### Breakpoints

```typescript
MOBILE.BREAKPOINT = 768; // px

// Layouts
< 768px   = Mobile (single pane)
768-1023px = Tablet (dual pane, same as desktop)
≥ 1024px  = Desktop (dual pane)
```

### Mobile Detection

The app automatically detects mobile devices using the `useMobileLayout` hook:

```typescript
const { isMobile, isTablet, isDesktop } = useMobileLayout();
```

This hook:
- Uses `window.matchMedia` for optimal performance
- Listens to window resize events
- Updates reactively when viewport changes

## Core Mobile Components

### 1. MobileFooter

**Location**: Always fixed at bottom of screen
**Height**: 60px (from `MOBILE.FOOTER_HEIGHT`)
**Z-index**: 30

**Features**:
- Pane switcher with active indicator (→ or ←)
- Search button (🔍)
- Settings button (⚙️)
- Automatically hides when keyboard is visible
- iOS safe area padding

**Usage**:
```tsx
<MobileFooter
  activePane="thoughts" // or "time"
  onPaneSwitch={(pane) => setActiveMobilePane(pane)}
  onSearchClick={() => setIsSearchOpen(true)}
  onSettingsClick={() => setIsSettingsOpen(true)}
  isVisible={!isKeyboardVisible}
/>
```

### 2. FAB (Floating Action Button)

**Location**: Bottom-right, 16px above footer
**Size**: 56x56px (from `MOBILE.FAB_SIZE`)
**Z-index**: 40

**Features**:
- Circular button for quick actions
- Customizable icon and label
- Haptic feedback on tap
- Scale-in animation
- Can be positioned bottom-right or bottom-center

**Usage**:
```tsx
<FAB
  onClick={() => setIsInputSheetOpen(true)}
  icon="+"
  label="Add thought"
  position="bottom-right"
  hidden={false}
/>
```

### 3. BottomSheet

**Z-index**: Backdrop=50, Sheet=60
**Height**: 60% (half) or 90% (full) or custom percentage

**Features**:
- Slides up from bottom with animation
- Backdrop click to dismiss
- Escape key to close
- Drag handle for visual affordance
- Focus trap for accessibility
- Body scroll lock when open
- iOS safe area padding

**Usage**:
```tsx
<BottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add Thought"
  height="half" // or "full" or number (%)
  showHandle={true}
>
  <form>{/* Your content */}</form>
</BottomSheet>
```

## Mobile Hooks

### useMobileLayout

Detects screen size and returns layout information.

```typescript
const {
  isMobile,      // < 768px
  isTablet,      // 768-1023px
  isDesktop,     // ≥ 1024px
  windowWidth,   // Current width
  windowHeight   // Current height
} = useMobileLayout();
```

### useHapticFeedback

Provides tactile feedback using the Vibration API.

```typescript
const { triggerHaptic, isSupported } = useHapticFeedback();

// Patterns
triggerHaptic('light');    // 10ms
triggerHaptic('medium');   // 20ms
triggerHaptic('heavy');    // 30ms
triggerHaptic('success');  // [10, 50, 10]
triggerHaptic('warning');  // [20, 100, 20]
triggerHaptic('error');    // [30, 100, 30, 100, 30]
```

Gracefully degrades on unsupported devices (returns no-op).

### useSwipeGesture

Detects left/right swipe gestures on touch devices.

```typescript
const containerRef = useRef<HTMLDivElement>(null);

useSwipeGesture(containerRef, {
  onSwipeLeft: () => console.log('Swiped left'),
  onSwipeRight: () => console.log('Swiped right'),
  threshold: 50,           // px distance
  velocityThreshold: 0.3,  // px/ms
  preventScroll: false     // Allow vertical scroll
});
```

**Behavior**:
- Distinguishes horizontal swipes from vertical scrolls
- Requires swipe to be more horizontal than vertical
- Triggers on distance OR velocity threshold
- Handles touchcancel events

### useKeyboardDetection

Detects virtual keyboard visibility on mobile devices.

```typescript
const { isKeyboardVisible, keyboardHeight } = useKeyboardDetection();
```

**Implementation**:
- Uses `visualViewport` API for iOS
- Falls back to resize events for Android
- Threshold: 150px (from `MOBILE.KEYBOARD_HEIGHT_THRESHOLD`)

## Mobile User Experience

### Pane Navigation

**Swipe Gestures**:
- Swipe left → Switch to Time pane
- Swipe right → Switch to Thoughts pane

**Footer Navigation**:
- Tap "Thoughts & Time →" to switch panes
- Active pane shown in primary color
- Inactive pane shown in secondary color

### Input Methods

**Thoughts Pane**:
- Desktop: Fixed input at bottom
- Mobile: FAB + Bottom Sheet

**Time Pane**:
- Daily Review shows in bottom sheet on mobile (future)

### Touch Targets

All interactive elements meet **44x44px minimum** touch target size (iOS Human Interface Guidelines):
- Buttons
- Checkboxes
- Links
- Footer controls

### Accessibility

**Screen Readers**:
- Proper ARIA labels on all controls
- role="dialog" for bottom sheets
- aria-modal="true" for modals
- aria-hidden for decorative elements

**Keyboard Navigation**:
- Focus trap in bottom sheets
- Escape key closes sheets
- Tab navigation works correctly

**Reduced Motion**:
- All animations respect `prefers-reduced-motion`
- Animations disabled or shortened when requested

## Styling

### CSS Variables

```css
:root {
  /* Mobile dimensions */
  --mobile-footer-height: 60px;
  --mobile-fab-size: 56px;

  /* Z-index layers */
  --z-footer: 30;
  --z-fab: 40;
  --z-bottom-sheet-backdrop: 50;
  --z-bottom-sheet: 60;
}
```

### Animations

```css
/* Bottom sheet */
@keyframes slideUp { /* ... */ }
@keyframes slideDown { /* ... */ }

/* FAB */
@keyframes fabScale { /* ... */ }
```

### Utility Classes

```css
/* Touch targets */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* iOS safe areas */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Z-index */
.z-30, .z-40, .z-50, .z-60
```

### iOS-Specific

**Prevent Zoom on Input Focus**:
```css
@media (max-width: 767px) {
  input, textarea, select {
    font-size: 16px !important;
  }
}
```

**Safe Area Padding**:
```css
padding-bottom: env(safe-area-inset-bottom);
```

## State Management

### Settings Store

```typescript
// Active mobile pane persisted to localStorage
activeMobilePane: 'thoughts' | 'time'
setActiveMobilePane: (pane) => void
```

## Constants

All mobile constants are defined in `src/constants/index.ts`:

```typescript
export const MOBILE = {
  BREAKPOINT: 768,                    // Mobile breakpoint
  FOOTER_HEIGHT: 60,                  // Footer height in px
  FAB_SIZE: 56,                       // FAB diameter in px
  MIN_TOUCH_TARGET: 44,               // Minimum touch target
  SWIPE_THRESHOLD: 50,                // Swipe distance in px
  SWIPE_VELOCITY_THRESHOLD: 0.3,     // Swipe velocity px/ms
  BOTTOM_SHEET_DURATION: 300,        // Animation duration ms
  KEYBOARD_HEIGHT_THRESHOLD: 150,     // Keyboard detection px
} as const;
```

## Testing

### Unit Tests

**Hooks** (37 tests):
- `useMobileLayout.test.ts`
- `useHapticFeedback.test.ts`
- `useKeyboardDetection.test.ts`
- `useSwipeGesture.test.ts`

**Components** (72 tests):
- `FAB.test.tsx`
- `MobileFooter.test.tsx`
- `BottomSheet.test.tsx`

### Test Coverage

- **Total**: 388 tests, 100% pass rate
- **Mobile-specific**: 109 tests
- All edge cases, error handling, and cleanup tested

### Running Tests

```bash
# All tests
npm run test

# Mobile tests only
npm run test -- src/hooks/useMobileLayout.test.ts src/hooks/useHapticFeedback.test.ts src/hooks/useKeyboardDetection.test.ts src/hooks/useSwipeGesture.test.ts src/components/FAB.test.tsx src/components/MobileFooter.test.tsx src/components/BottomSheet.test.tsx

# With coverage
npm run test:coverage
```

## Performance

### Zero Impact on Desktop

All mobile code is behind `isMobile` flag:
- No mobile components render on desktop
- No mobile event listeners attached on desktop
- No performance penalty when `isMobile === false`

### Optimizations

- `useMemo` and `useCallback` for expensive operations
- Event listener cleanup on unmount
- Passive event listeners where appropriate
- Virtualization maintained for long lists

## Browser Support

### Required Features

- **Touch Events**: touchstart, touchmove, touchend, touchcancel
- **Visual Viewport API**: Preferred for keyboard detection (iOS)
- **Vibration API**: Optional, gracefully degrades

### Tested Browsers

- iOS Safari 14+
- Chrome Mobile 90+
- Firefox Mobile 90+

## Known Limitations

### Swipe Navigation

- Requires horizontal movement > vertical movement
- May conflict with browser navigation gestures on iOS
- Threshold: 50px distance OR 0.3 px/ms velocity

### Keyboard Detection

- Relies on visualViewport API (iOS) or resize events (Android)
- May not detect keyboard on older devices
- Fallback: Always assumes keyboard hidden

### Haptic Feedback

- Not supported on all devices
- iOS requires user interaction first (security)
- Gracefully degrades to no-op when unsupported

## Future Enhancements

Potential improvements for future versions:

1. **Daily Review Bottom Sheet** - Show Daily Review in bottom sheet on mobile
2. **Swipe to Indent** - Swipe right on text to indent, left to outdent
3. **Pull to Refresh** - Pull down to sync/refresh data
4. **Long Press Actions** - Context menu on long press
5. **Custom Gesture Zones** - Edge swipes for specific actions
6. **Offline Support** - Service worker for offline functionality
7. **Install Prompt** - PWA install prompt for add to home screen

## Troubleshooting

### Footer Not Hiding with Keyboard

Check that `useKeyboardDetection` is working:
```typescript
const { isKeyboardVisible } = useKeyboardDetection();
console.log('Keyboard visible:', isKeyboardVisible);
```

### Swipes Not Detected

Verify touch events are firing:
```typescript
useSwipeGesture(ref, {
  onSwipeLeft: () => console.log('Left swipe detected'),
  onSwipeRight: () => console.log('Right swipe detected'),
});
```

### Haptics Not Working

Check browser support:
```typescript
const { isSupported } = useHapticFeedback();
console.log('Haptics supported:', isSupported);
```

### Bottom Sheet Not Closing

Verify `onClose` is called:
```typescript
<BottomSheet
  isOpen={isOpen}
  onClose={() => {
    console.log('Bottom sheet closing');
    setIsOpen(false);
  }}
>
```

## Contributing

When adding new mobile features:

1. Use existing mobile hooks and components
2. Follow touch target size guidelines (44px min)
3. Add haptic feedback for interactions
4. Test on real devices (iOS and Android)
5. Write unit tests for new functionality
6. Update this documentation
7. Ensure desktop experience unchanged

## Resources

- [iOS Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/inputs/touchscreen-gestures/)
- [MDN - Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [MDN - Visual Viewport API](https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API)
- [MDN - Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- [Web Accessibility - Touch Targets](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
