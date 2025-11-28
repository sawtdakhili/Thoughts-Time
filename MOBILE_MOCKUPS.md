# Mobile Responsive Design - Mockups

## Design Philosophy
- **No header** - maximize content space, all controls in footer
- **Single pane view** - switch between Thoughts and Time panes
- **Footer navigation** - thumb-zone optimized with text labels + arrows
- **Swipe anywhere** - natural gesture navigation (except footer area)
- **Floating action button (FAB)** - quick capture (Thoughts pane only)
- **Bottom sheet** - Daily Review doesn't block content
- **All controls reachable** - search, settings, navigation all in thumb zone

---

## 📱 Screen 1: Thoughts Pane (Portrait)

```
┌─────────────────────────────────────┐
│                                     │ ← No header! More content space
│  WEDNESDAY, NOV 20, 2025            │
│                                     │
│  9:00 AM                            │
│  □ Plan weekend family outing       │
│    □ Check botanical garden hours   │
│    □ Pack picnic supplies           │
│                                     │
│  9:00 AM                            │
│  ↝ Remember to bring sketchbook to  │
│    botanical garden - great...      │
│                                     │
│  THURSDAY, NOV 27, 2025             │
│                                     │
│  ⋮                                  │
│                                     │
│  ⋮ (scroll more content)            │
│   ⋮                                 │
│    ⋮                                │
│     ⋮                               │
│      [+]                            │ ← FAB (Floating Action Button)
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Type here... (tap to expand)    │ │ ← Input bar
│ └─────────────────────────────────┘ │
│ Thoughts & Time →          [🔍][⚙️] │ ← Footer: ALL controls in thumb zone
└─────────────────────────────────────┘
  ^^^^^^^^ ^^^^^^ ^           ^^^^^^^^
  active   greyed arrow       buttons
  (white)  (shows where       (right)
           swipe goes)

  👆 Swipe left anywhere → to go to Time pane
```

---

## 📱 Screen 2: Input Expanded (Portrait)

```
┌─────────────────────────────────────┐
│                                     │
│  [Dimmed background overlay]        │
│      (tap backdrop to close)        │
│                                     │
│                                     │
│                                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ t Main task at 2pm              │ │ ← Full screen input
│ │ t   Subtask 1                   │ │
│ │ │                               │ │
│ │ │ [Tab] indent [↵] submit      │ │
│ │ │ [Shift+↵] new line           │ │
│ │ └───────────────────────────────┘ │
│ │                         [Send ✓]│ │
│ └─────────────────────────────────┘ │
│                                     │
│                                     │
│              [Keyboard]             │
└─────────────────────────────────────┘
   Footer hidden during input to maximize
   keyboard space (iOS safe area considered)
```

---

## 📱 Screen 3: TimePane (Portrait)

```
┌─────────────────────────────────────┐
│                                     │ ← No header! Content fills screen
│  ■ Daily Review              [3] ▼  │ ← Tap to expand bottom sheet
│                                     │
│  WEDNESDAY, NOV 27, 2025            │
│                                     │
│  9:00 AM                            │
│  □ Plan weekend family outing       │
│    □ Check botanical garden hours   │
│    □ Pack picnic supplies           │
│                                     │
│  10:00 AM                           │
│  □ Start new commission - pet       │
│    □ Study reference photos         │
│    □ Rough sketch proportions       │
│    □ Email client with initial...   │
│                                     │
│  2:00 PM                            │
│  □ Order more Payne's Gray and...   │
│                                     │
│  4:00 PM - 5:30 PM                  │
│  ↹ Emma art show at school          │
│                                     │
│  ⋮ (scroll more content)            │
│   ⋮                                 │
│    ⋮                                │
│                                     │
│ ← Thoughts & Time          [🔍][⚙️] │ ← Footer: ALL controls here
└─────────────────────────────────────┘
  ^ ^^^^^^^^^ ^^^^           ^^^^^^^^
  arrow greyed  active        buttons
        (shows  (white)       (right)
         where
         swipe goes)

  👉 Swipe right anywhere ← to go to Thoughts pane
     (to add new items - no input on Time pane)
```

---

## 📱 Screen 4: Daily Review Bottom Sheet

```
┌─────────────────────────────────────┐
│  [Dimmed overlay - tap to close]    │
│                                     │
│  WEDNESDAY, NOV 27, 2025            │
│                                     │
│  10:00 AM                           │
│  □ Start new commission...          │
│    □ Study reference photos         │
│                                     │
├═════════════════════════════════════┤ ← Drag handle (swipe down)
│ ═══   Daily Review                  │
├─────────────────────────────────────┤
│ • Work on Martinez commission       │
│   (9 days old)          [↻][✓][×]  │
│                                     │
│ • Reply to gallery inquiry          │
│   (4 days old)          [↻][✓][×]  │
│                                     │
│ • Update Instagram with work        │
│   (3 days old)          [↻][✓][×]  │
│                                     │
│ • Send invoice to Martinez          │
│   (2 days old)          [↻][✓][×]  │
│                                     │
│         [Show 2 more...]            │
│                                     │
│ ← Thoughts & Time          [🔍][⚙️] │ ← Footer visible even with sheet
└─────────────────────────────────────┘
    👆 Swipe down on handle to dismiss
       or tap dimmed area above
```

---

## 📱 Screen 5: Landscape Mode

```
┌───────────────────────────────────────────────────────────────────┐
│  Thoughts & Time                              [🔍] [⚙️]           │
├──────────────────────────────┬────────────────────────────────────┤
│ THOUGHTS                     │ TIME PANE                          │
│ ─────────                    │ ──────────                         │
│                              │                                    │
│ WEDNESDAY, NOV 27, 2025      │ ■ Daily Review         [3] ▼       │
│                              │                                    │
│ 9:00 AM                      │ WEDNESDAY, NOV 27, 2025            │
│ □ Plan weekend family outing │                                    │
│   □ Check botanical garden..│ 9:00 AM                            │
│   □ Pack picnic supplies     │ □ Plan weekend family outing       │
│                              │   □ Check botanical garden hours   │
│ 9:00 AM                      │   □ Pack picnic supplies           │
│ ↝ Remember to bring...       │                                    │
│                              │ 10:00 AM                           │
│ ⋮                            │ □ Start new commission - pet       │
│                              │   □ Study reference photos         │
│                              │   ⋮                                │
│                              │                                    │
├──────────────────────────────┴────────────────────────────────────┤
│ Type here... (Tab to indent, Shift+Enter for new line)      [→]  │
└───────────────────────────────────────────────────────────────────┘
         👆 Dual pane in landscape (like desktop)
```

---

## 🎨 Design Specs

### Breakpoints
- **Mobile Portrait**: < 768px (single pane)
- **Tablet/Landscape**: 768px - 1024px (optional dual pane or larger single)
- **Desktop**: > 1024px (current dual pane layout)

### Navigation (100% Thumb-Zone)
**Footer Layout:**
```
Thoughts & Time →          [🔍][⚙️]   (Thoughts pane)
^^^^^^^^ ^^^^^^ ^          ^^^^^^^^
active   greyed arrow      buttons

← Thoughts & Time          [🔍][⚙️]   (Time pane)
^ ^^^^^^^^^ ^^^^           ^^^^^^^^
arrow greyed  active       buttons
```

**Navigation Methods:**
1. **Swipe anywhere** (PRIMARY): Swipe left/right to switch panes
   - Works on entire content area (not footer)
   - Natural, discoverable gesture
   - Arrow in footer shows swipe direction

2. **Tap text labels** (ALTERNATIVE): Tap greyed text to switch
   - "& Time →" on Thoughts pane = tap to go to Time
   - "← Thoughts &" on Time pane = tap to go to Thoughts
   - For users who prefer tapping over swiping

3. **No header**: Removed entirely - maximizes content, all controls in footer

### Input Behavior
- **Collapsed**: Sticky bar at bottom, tap to expand
- **Expanded**: Full screen overlay with dimmed background
- **Keyboard shortcuts**: Still work (Tab, Shift+Enter, etc.)
- **Submit**: Tap checkmark or Enter key

### Daily Review
- **Bottom sheet**: Swipe up to open, down to close
- **Drag handle**: Visual affordance at top
- **Backdrop tap**: Close sheet
- **Actions inline**: [↻ Reschedule] [✓ Complete] [× Cancel]

### Touch Targets
- **Minimum 44x44px**: All interactive elements
- **Spacing**: 8px between touch targets
- **Checkboxes**: 32x32px active area (larger than visual)

### Gestures (All Thumb-Friendly)
```
Swipe left (anywhere on content) → Go to Time pane
Swipe right (anywhere on content) → Go to Thoughts pane
Tap greyed text in footer → Switch panes (alternative)
Tap search button [🔍] → Open search
Tap settings button [⚙️] → Open settings
Tap input bar → Expand full screen input (Thoughts only)
Tap FAB [+] → Open input (Thoughts only)
Swipe up on Daily Review badge → Open bottom sheet
Swipe down on sheet handle → Close sheet
Long press on item → Context menu (edit/delete)
```

**Critical Design Rule**:
- Swipe works on **content area only** (not footer)
- Footer is safe zone for taps (buttons, text labels)
- This prevents accidental navigation while tapping footer controls

### Floating Action Button (FAB)
- **Position**: Bottom right, above input bar
- **Action**: Quick capture (opens input immediately)
- **Animation**: Bounce in on page load
- **Hide on scroll down**: Shows on scroll up

### Bottom Input Bar
- **Collapsed**: 52px height, shows placeholder
- **Expanded**: Full screen overlay, auto-focus
- **Backdrop**: Semi-transparent black (opacity 0.5)
- **Animation**: Slide up with ease-out

---

## 🎯 Key Mobile UX Principles

### Thumb Zone First
Modern smartphones (6"+ screens) make top header unreachable with one hand. All primary navigation moved to bottom:

```
┌─────────────────────────────┐
│ ← Unreachable (hard zone)   │  Header: Display only
│                             │
│                             │
│                             │
│ ← Stretch (medium zone)     │  Content: Scrollable
│                             │
│                             │
│ ← Natural (easy zone)       │
├─────────────────────────────┤
│ ● ○  Input...          [+]  │  ← ALL controls here
└─────────────────────────────┘  Bottom: Thumb-friendly
```

**Design Decision**: Swipe gestures + bottom indicators instead of top header arrows.

### Other Principles

1. **Thumb Zone**: Most important actions within thumb reach (bottom third)
2. **One-handed operation**: Everything accessible with one hand
3. **Gestures over buttons**: Swipe to navigate, not multiple taps
4. **Progressive disclosure**: Don't show everything at once
5. **Clear affordances**: Visual hints for swipeable elements
6. **Fast input**: Minimize taps to create items
7. **Undo visible**: Toasts with undo buttons (already implemented)

---

## 📐 Visual Hierarchy (Mobile)

### Thoughts Pane
```
(No Header - maximizes content!)
  ↓
Content Area (scrollable)        Fill (entire height)
  ↓
Input Bar (collapsed)            52px
  ↓
Footer (navigation + buttons)    48px
  ↓
Safe Area (iOS notch, etc)       Auto
```

### Time Pane (Read-only)
```
(No Header - maximizes content!)
  ↓
Content Area (scrollable)        Fill (entire height)
  ↓
Footer (navigation + buttons)    48px
  ↓
Safe Area (iOS notch, etc)       Auto
```
*No input bar on TimePane - only in footer for navigation*

**Space Saved**: ~60px by removing header = 2-3 extra items visible!

---

## 🎭 Example Flow: Creating a Task on Mobile

1. **User on Thoughts pane** (input available here)
2. Taps input bar OR taps FAB
3. Input expands full screen, keyboard shows
4. Types: `t Buy groceries at 5pm`
5. Taps Tab, types: `Milk, eggs, bread`
6. Taps Send ✓
7. Input collapses, item appears in Thoughts list
8. Swipes left to see it in Time pane at 5pm

**Note**: If user is on Time pane and wants to add an item:
- **Swipe right anywhere** on content (primary method), OR
- **Tap "← Thoughts &"** greyed text in footer
- Both methods go back to Thoughts pane where input is available

**Ergonomics**: Swipe is natural, tap text is precise alternative - both thumb-friendly!

---

## 🚨 Edge Cases & Solutions

### 1. Footer Crowding (Thoughts Pane)

**Issue**: Input bar (52px) + Footer (48px) = 100px of bottom UI

**Solution**:
- Hide footer on scroll down (show on scroll up)
- When input is expanded full screen, footer is hidden entirely
- Sticky footer reappears when scrolling up or input closes
- Maximizes content space while keeping controls accessible

**Implementation**:
```javascript
// Detect scroll direction
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  if (currentScroll > lastScroll) {
    // Scrolling down - hide footer
    footer.classList.add('hidden');
  } else {
    // Scrolling up - show footer
    footer.classList.remove('hidden');
  }
  lastScroll = currentScroll;
});
```

---

### 2. Text Length / Internationalization

**Issue**: "Thoughts & Time" might be too long in other languages

**Solution**:
- Responsive text truncation with ellipsis
- Priority: Active pane (full) > Buttons > Inactive pane (truncate)
- Fallback: Abbreviate to "Thoughts →" if space < 360px

**Breakpoints**:
```
≥ 390px: "Thoughts & Time →"
360-389px: "Thoughts →" + "← Time"
< 360px: Icons "📝 →" + "← ⏰"
```

---

### 3. Accidental Taps

**Issue**: Tappable greyed text too close to input bar

**Solution**:
- 8px visual separator (1px border) between input and footer
- 44px minimum touch targets with padding
- Haptic feedback on pane switch (confirms intentional action)
- Debounce taps (300ms) to prevent double-switches

**Visual**:
```
│ Type here...                    │
├─────────────────────────────────┤ ← 8px separator
│ Thoughts & Time →      [🔍][⚙️] │
  ^^^^^^^^^^^^^^^^
  44px touch target
```

---

### 4. Swipe Gesture Conflicts

**Issue**: Horizontal scrollable content (carousels, tables) conflicts with pane swipe

**Solution**:
- Detect `overflow-x: scroll` or `overflow-x: auto` elements
- Disable pane swipe when touch starts on scrollable element
- Require faster velocity (>0.5px/ms) for pane switching
- 20px dead zone at left/right edges (swipe works in middle 80%)

**Implementation**:
```javascript
// Detect if touch target has horizontal scroll
const isScrollable = (el) => {
  return el.scrollWidth > el.clientWidth;
};

// Only allow pane swipe if not on scrollable element
if (!isScrollable(touchTarget)) {
  handlePaneSwipe();
}
```

---

### 5. Daily Review Bottom Sheet Conflict

**Issue**: Bottom sheet overlaps footer navigation area

**Solution**:
- Footer remains visible behind dimmed overlay (accessible)
- Pane switching disabled while sheet is open
- Sheet has its own "Done" or close button
- Swipe down on sheet handle or tap overlay to dismiss
- Once dismissed, footer navigation re-enabled

**States**:
```
Sheet Closed: Footer navigation active ✓
Sheet Open: Footer visible but navigation disabled
Sheet Dismissing: Footer re-enabled when sheet < 50% visible
```

---

### 6. Keyboard + Footer Behavior

**Issue**: iOS keyboard pushes footer up, feels awkward

**Solution**:
- **When input bar tapped**: Footer hidden, input goes full screen
- **When keyboard shows**: Footer automatically hidden
- **When keyboard dismisses**: Footer reappears after 200ms delay
- Input overlay has its own "Send" button (no footer needed)

**CSS**:
```css
/* Hide footer when keyboard is visible */
body.keyboard-visible .footer {
  transform: translateY(100%);
  transition: transform 0.2s ease-out;
}
```

---

### 7. Discoverability

**Issue**: Users might not understand swipe gesture or tappable text

**Solution**:
- **First launch**: Subtle animation on arrow (pulse 3 times)
- **Onboarding tooltip**: "Swipe to see timeline →" (appears once, dismissible)
- **Visual hint**: Arrow slightly animates on page load
- **Fallback**: If user doesn't swipe within 5 seconds, tooltip appears

**Animation**:
```css
@keyframes arrow-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; transform: translateX(4px); }
}

.footer-arrow {
  animation: arrow-pulse 1.5s ease-in-out 3;
}
```

---

### 8. Accessibility

**Issue**: Screen readers, color-blind users, voice control

**Solution**:
- **ARIA labels**:
  - Active text: `aria-label="Current pane: Thoughts"`
  - Inactive text: `aria-label="Switch to Time pane"`
  - Buttons: `aria-label="Search"` and `aria-label="Settings"`
- **Visual indicators**: Subtle underline on tappable greyed text
- **Voice commands**: Register "Go to Time" / "Go to Thoughts"
- **Focus order**: Tab through footer controls logically

**HTML**:
```html
<footer>
  <button aria-label="Current pane: Thoughts" aria-current="page">
    Thoughts
  </button>
  <button aria-label="Switch to Time pane">
    & Time →
  </button>
  <button aria-label="Search"><svg>🔍</svg></button>
  <button aria-label="Settings"><svg>⚙️</svg></button>
</footer>
```

---

### 9. Search/Settings Modals

**Issue**: When modals open, footer visibility unclear

**Solution**:
- Modals take full screen (cover footer entirely)
- Modals have own navigation: "< Back" button top-left
- Or: Swipe down to dismiss modal (returns to footer)
- Modal backdrop is semi-transparent (can see footer dimmed)

**Hierarchy**:
```
Modal Open:
  ┌─────────────────────────────┐
  │ [< Back]    Search          │
  │                             │
  │ [Search results...]         │
  │                             │
  │ [Dimmed footer behind]      │
  └─────────────────────────────┘
```

---

### 10. Long Text Truncation

**Issue**: Very long pane names in some languages

**Solution**:
- CSS `text-overflow: ellipsis` with `max-width`
- Responsive max-width based on screen size:
  - Small (< 360px): 80px max per pane name
  - Medium (360-390px): 100px max
  - Large (≥ 390px): No truncation

**CSS**:
```css
.footer-nav-text {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 360px) {
  .footer-nav-text {
    max-width: 80px;
  }
}
```

---

### 11. Landscape Mode

**Issue**: Footer navigation doesn't make sense when both panes visible

**Solution**:
- **Switch to desktop layout** in landscape (≥ 768px width)
- Both panes visible side-by-side
- Footer becomes status bar: "Thoughts & Time" centered, buttons on right
- No navigation controls (both panes always visible)

**Landscape Layout**:
```
┌──────────────────┬──────────────────┐
│ Thoughts         │ Time             │
│                  │                  │
└──────────────────┴──────────────────┘
│     Thoughts & Time         [🔍][⚙️] │
      ^^^^^^^^^^^^^^
      Status only (not nav)
```

---

### 12. Animation & Performance

**Issue**: Pane transitions need to be smooth and responsive

**Solution**:
- Use CSS transforms (GPU accelerated)
- Swipe gesture shows live preview (pane moves with finger)
- Spring animation on release (natural feeling)
- Velocity-based: fast swipe = quick transition, slow = can cancel

**Animation Timing**:
```css
.pane-transition {
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.pane-transition-fast {
  transition: transform 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

---

### 13. Footer Z-Index Issues

**Issue**: FAB, toasts, modals might be behind or in front of footer

**Solution**:
- **Z-index hierarchy**:
  - Modals: 1000
  - Toasts: 900
  - Daily Review sheet: 800
  - FAB: 700
  - Footer: 600
  - Input bar: 550
  - Content: 1

**CSS**:
```css
.modal { z-index: 1000; }
.toast { z-index: 900; }
.daily-review-sheet { z-index: 800; }
.fab { z-index: 700; }
.footer { z-index: 600; }
```

---

### 14. Safe Area (iOS Notch/Home Indicator)

**Issue**: iPhone notch and home indicator might overlap footer

**Solution**:
- Use `padding-bottom: env(safe-area-inset-bottom)`
- Footer respects safe area automatically
- Home indicator doesn't overlap controls
- Works on all iOS devices (notched and non-notched)

**CSS**:
```css
.footer {
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

/* viewport meta tag required */
<meta name="viewport" content="viewport-fit=cover">
```

---

## 💡 Additional Mobile Considerations

### Offline Support
- Service worker for offline access
- Queue items when offline
- Sync icon shows status

### Performance
- Virtual scrolling already implemented ✓
- Lazy load images (if attachments added)
- Minimize animations on low-end devices

### Native Feel
- Use system fonts for better performance
- Haptic feedback on actions (if available)
- Respect system dark/light mode
- Safe area insets for notch/home indicator

### Accessibility
- Touch targets meet 44x44px minimum
- High contrast mode support
- Screen reader announcements for state changes
- Focus management for keyboard users
