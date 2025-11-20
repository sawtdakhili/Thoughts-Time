# Thoughts & Time - Development Roadmap

**Last Updated**: November 20, 2025
**Current Status**: MVP with core features ✅

---

## Overview

This roadmap tracks the implementation of features from the complete specification document. Features are organized by priority and implementation phase.

### Core Philosophy

**"Not Scheduled = Won't Be Done"**

This app enforces a strict scheduling philosophy: **every single task, event, and routine must have a date and time**. There are no "unscheduled" items in this system. If something doesn't have a specific time assigned, it doesn't exist in the app. This intentional constraint encourages mindful planning and prevents the accumulation of vague, never-completed tasks.

### Current Implementation Status

#### ✅ Completed Features (MVP)
- [x] Basic capture system with prefix detection (t, e, r, n)
- [x] Four item types: Todo, Event, Routine, Note
- [x] Natural language time parsing (via chrono library)
- [x] Todo subtasks (1 level deep, checking parent checks children)
- [x] Note sub-items (2 levels deep, Org Mode style with prefixes)
- [x] Depth validation and enforcement
- [x] Two view modes: Infinite Scrolling & Book Style
- [x] Theme system (Light/Dark)
- [x] LocalStorage persistence
- [x] Item editing with type conversion
- [x] Item deletion
- [x] Basic Daily Review (unscheduled todos)
- [x] Two-pane layout (Thoughts & Time)
- [x] Item display with symbols
- [x] Serif typography (Crimson Text)
- [x] Search functionality (filters both panes)
- [x] Time format setting (12-hour vs 24-hour)
- [x] Cascade delete (parent deletion removes all children)
- [x] Type-safe item factories (removed 'as any' assertions)
- [x] Shared formatting utilities (reduced code duplication)
- [x] Toast notification system (success, error, info, warning)
- [x] Custom confirmation dialogs (replaced browser confirm)
- [x] Error boundary with graceful error handling
- [x] Keyboard shortcuts (Cmd/Ctrl+F, Escape, Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
- [x] Accessibility improvements (ARIA labels, focus indicators)
- [x] Comprehensive test suite (115 tests with Vitest)
- [x] Undo/Redo system (tracks all actions with Cmd/Ctrl+Z/Shift+Z)
- [x] Undo button in delete toasts

---

## Priority Features

### 🔴 High Priority (Phase 1)

#### 1. Daily Review Enhancements ✅
**Status**: Completed

**Current Behavior**: Daily Review shows incomplete todos from past days.

**Philosophy Alignment**: Since all items in this app must be scheduled (see Core Philosophy above), Daily Review shows all incomplete scheduled todos from previous days that need to be rescheduled or completed.

**Completed**:
- [x] Track handled items (items disappear after action)
- [x] Pagination for 10+ items ("Show more" button)
- [x] Header indicator (■→□) when all handled
- [x] Auto-complete Daily Review when all items handled
- [x] Display subtasks nested in review items

**Files modified**:
- `src/components/DailyReview.tsx`

---

#### 2. Subtasks Enhancements
**Status**: Completed ✅

**Completed**:
- [x] Tab/Shift+Tab for indent/outdent
- [x] Visual indent (32px)
- [x] Parent-child relationship in DB
- [x] Checking parent checks all children
- [x] Max 1 level depth enforcement

**Note**: Metadata positioning item removed as todos no longer have metadata to display, and routines don't have subtasks.

---

#### 3. Time Format Setting
**Status**: Completed ✅

**Completed**:
- [x] Setting UI toggle for 12-hour vs 24-hour format
- [x] Persistent preference storage
- [x] Applied to item creation timestamps in ThoughtsPane
- [x] Applied to all timeline displays in TimePane
- [x] Applied to time prompt displays
- [x] Shared utility function for consistent formatting

**Files modified**:
- `src/store/useSettingsStore.ts` (added timeFormat state)
- `src/components/Settings.tsx` (added UI toggle)
- `src/utils/formatting.ts` (formatTimeForDisplay function)
- `src/components/ItemDisplay.tsx` (timestamp formatting)
- `src/components/ThoughtsPane.tsx` (time prompt formatting)
- `src/components/TimePane.tsx` (timeline formatting)

---

#### 4. Testing Infrastructure
**Status**: Completed ✅

**Completed**:
- [x] Vitest testing framework with Happy DOM environment
- [x] Test setup with @testing-library/react and jest-dom matchers
- [x] Test scripts (test, test:ui, test:coverage)
- [x] Coverage reporting with v8 provider
- [x] 115 comprehensive tests covering utilities and store logic

**Test Coverage**:
- `formatting.ts` (33 tests): Symbol conversion, time formatting
- `parser.ts` (54 tests): Type detection, recurrence patterns, date parsing
- `itemFactory.ts` (15 tests): Type-safe item creation
- `useStore.ts` (13 tests): Cascade delete, todo completion

**Files created**:
- `vite.config.ts` (test configuration)
- `src/test/setup.ts` (test setup file)
- `src/utils/formatting.test.ts`
- `src/utils/parser.test.ts`
- `src/utils/itemFactory.test.ts`
- `src/store/useStore.test.ts`

---

#### 5. Error Handling & User Feedback
**Status**: Completed ✅

**Completed**:
- [x] Toast notification system with multiple types (success, error, info, warning)
- [x] Custom ConfirmDialog component replacing browser confirm()
- [x] ErrorBoundary component with graceful error handling
- [x] Delete confirmations with context-aware messages
- [x] Success toast feedback after actions
- [x] Focus management and keyboard accessibility in dialogs

**Components Created**:
- `src/components/Toast.tsx` - Toast notification display
- `src/hooks/useToast.ts` - Toast state management with Zustand
- `src/components/ConfirmDialog.tsx` - Custom confirmation dialog
- `src/components/ErrorBoundary.tsx` - React Error Boundary
- `src/hooks/useKeyboardShortcuts.ts` - Keyboard shortcut management

**Accessibility Improvements**:
- [x] ARIA labels on all interactive elements
- [x] Focus indicators with `:focus-visible` styles
- [x] Keyboard shortcuts (Cmd/Ctrl+F for search, Escape to close)
- [x] Screen reader support with aria-live regions
- [x] Proper dialog roles and aria attributes

**Files Modified**:
- `src/App.tsx` (added ToastContainer, keyboard shortcuts)
- `src/main.tsx` (wrapped with ErrorBoundary)
- `src/components/ItemDisplay.tsx` (replaced confirm() with ConfirmDialog)
- `src/index.css` (added focus indicators and animations)

---

#### 6. Undo/Redo System
**Status**: Completed ✅

**Completed**:
- [x] Action history store with undo/redo stacks
- [x] Tracks create, delete, edit, complete actions
- [x] Keyboard shortcuts: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo)
- [x] Undo button in delete toasts
- [x] Cascade undo/redo for deletions (restores parent-child relationships)
- [x] Max 20 actions in history (memory management)
- [x] Skip history flag prevents infinite loops during undo/redo

**Components Created**:
- `src/store/useHistory.ts` - History management with Zustand
- `src/hooks/useUndoRedo.ts` - Undo/redo integration hook

**Files Modified**:
- `src/store/useStore.ts` (added history recording to all mutations)
- `src/App.tsx` (integrated undo/redo hook, keyboard shortcuts)
- `src/hooks/useToast.ts` (added onUndo callback support)
- `src/components/Toast.tsx` (added Undo button UI)
- `src/components/ItemDisplay.tsx` (connected delete toast to undo)

---

### 🟡 Medium Priority (Phase 2)

#### 7. Search Functionality
**Status**: Completed ✅

**Completed**:
- [x] Search input in header
- [x] Scope: searches both panes simultaneously (Thoughts & Time)
- [x] Full-text search capability
- [x] Recursive search (includes subtasks and sub-items)
- [x] Filters both panes and daily review
- [x] Hides empty days in book mode when searching
- [x] Clear search with × button

**Not implemented** (lower priority):
- [ ] Keyboard shortcut: Cmd/Ctrl + F
- [ ] Highlight matching text
- [ ] Click result navigates to day and scrolls to item
- [ ] Show "No results found" empty state

**Files modified**:
- `src/components/Header.tsx` (search input)
- `src/components/ThoughtsPane.tsx` (search filtering)
- `src/components/TimePane.tsx` (search filtering)
- `src/components/DailyReview.tsx` (search filtering)

---

#### 8. Event Auto-Split Logic
**Status**: Not implemented

**Requirements**:
- [ ] Detect when items exist between event start and end times
- [ ] Split event into ⇤ (start) and ⇥ (end) markers
- [ ] Single ↹ symbol when no items between
- [ ] Start shows full duration
- [ ] End shows "(end)" marker
- [ ] Editing start updates end automatically
- [ ] Deleting start deletes end
- [ ] Cache split state for performance

**Implementation**:
```typescript
// On timeline render:
const itemsDuring = items.filter(item =>
  item.scheduledTime >= event.startTime &&
  item.scheduledTime <= event.endTime &&
  item.id !== event.id
);

if (itemsDuring.length > 0) {
  renderSplitEvent(event); // ⇤ ... ⇥
} else {
  renderSingleEvent(event); // ↹
}
```

**Files to modify**:
- `src/components/TimePane.tsx`
- `src/types.ts` (Event interface already has splitStartId/splitEndId)

---

#### 9. URL Link Previews for Notes
**Status**: Not implemented

**Requirements**:
- [ ] Auto-detect URLs in note content
- [ ] Background fetch metadata (Open Graph, Twitter cards)
- [ ] Store in `linkPreviews` JSONB field
- [ ] Collapsed state: title + domain only (60px height)
- [ ] Expanded state: thumbnail (280×160px) + title + description + domain
- [ ] Click anywhere to expand/collapse
- [ ] Max width: 400px (desktop), 100% (mobile)

**Card Specs**:
```css
border: 1px solid #1A1A1A
background: #0A0A0A
padding: 16px
border-radius: 8px

thumbnail: 280×160px, object-fit: cover
title: 16px semibold, 2 lines max
description: 14px, 2 lines max, #F5F5F5
domain: 13px, #6A6A6A
```

**Files to create/modify**:
- `src/utils/linkPreview.ts` (new file - fetch metadata)
- `src/components/LinkPreviewCard.tsx` (new file)
- `src/components/ItemDisplay.tsx` (render link previews)

---

#### 10. Note Embedding in Todos
**Status**: Not implemented

**Requirements**:
- [ ] Click "Link" button on note → copies ID to clipboard
- [ ] Paste link into todo content
- [ ] Detect link pattern in todo
- [ ] Display embedded note as preview card
- [ ] Show "View full note →" link
- [ ] Broken link display when note deleted

**Card Specs**:
```
□ Meeting prep
  ┌─────────────────────────────┐
  │ ↝ Agenda points from Oct 12 │
  │   [View full note →]        │
  └─────────────────────────────┘
```

**Files to create/modify**:
- `src/components/ItemDisplay.tsx` (add Link button, detect embedded)
- `src/components/EmbeddedNoteCard.tsx` (new file)
- `src/utils/parser.ts` (detect embedded note links)

---

### 🟢 Lower Priority (Phase 3)

#### 11. Completion Linking System
**Status**: Partially implemented in store, not in UI - **Not a priority**

**Requirements**:
- [ ] Create CompletionLink on todo completion
- [ ] Original item shows "completed on Oct 14 →"
- [ ] Completion entry created in today's Thoughts
- [ ] Completion entry shows "← from Oct 12"
- [ ] Click links to navigate between days
- [ ] Uncompleting removes completion entry and link
- [ ] Deleting original deletes completion entry
- [ ] Deleting completion reverts original to uncompleted

**Visual Specs**:
```
Oct 12 Thoughts:
☑ ~~Call mom~~
  completed on Oct 14 →

Oct 14 Thoughts:
☑ ~~Call mom (completed)~~
  ← from Oct 12
```

**Files to create/modify**:
- `src/types.ts` (add CompletionLink interface)
- `src/store/useStore.ts` (add completion linking logic)
- `src/components/ItemDisplay.tsx` (show completion links)
- `src/components/DailyReview.tsx` (create links on complete)

---

#### 12. Database Backend (Supabase)
**Status**: Not implemented (currently localStorage only)

**Requirements**:
- [ ] Supabase project setup
- [ ] Database schema migration (see spec for full schema)
- [ ] User authentication
- [ ] Row-level security policies
- [ ] Switch from localStorage to Supabase
- [ ] Sync queue implementation
- [ ] Optimistic updates
- [ ] Conflict resolution (last-write-wins)
- [ ] Offline mode handling

**Schema Tables**:
- `users`
- `items` (polymorphic for all types)
- `routine_occurrences`
- `completion_links`
- `notification_settings`

**Files to create/modify**:
- `supabase/migrations/` (new directory)
- `src/lib/supabase.ts` (new file - client setup)
- `src/store/useStore.ts` (replace localStorage with Supabase)
- `src/utils/sync.ts` (new file - sync queue)

---

#### 13. Mobile Responsive Optimizations
**Status**: Partially responsive, needs improvements

**Requirements**:
- [ ] Swipeable panes (swipe left/right to switch)
- [ ] Touch gesture detection
- [ ] Mobile tap targets (44×44px minimum)
- [ ] Mobile-optimized spacing (24px instead of 48px)
- [ ] Virtual keyboard handling
- [ ] iOS Safari fixes (viewport, scroll bounce)
- [ ] Android Chrome fixes

**Files to modify**:
- `src/App.tsx` (add swipe detection)
- `src/components/*.tsx` (adjust tap target sizes)
- `src/styles/index.css` (mobile-specific styles)
- Add: `src/hooks/useSwipeGesture.ts` (new file)

---

#### 14. Notifications System
**Status**: Not implemented

**Requirements**:
- [ ] Push notification setup
- [ ] Service worker registration
- [ ] Notification permission request
- [ ] Schedule notifications for events (X minutes before)
- [ ] Schedule notifications for routines
- [ ] Notification settings UI
- [ ] User preferences storage
- [ ] Dismiss handling

**Files to create/modify**:
- `public/service-worker.js` (new file)
- `src/utils/notifications.ts` (new file)
- `src/components/Settings.tsx` (add notification preferences)
- `src/store/useSettingsStore.ts` (add notification settings)

---

#### 15. Performance Optimizations
**Status**: Not implemented

**Requirements**:
- [ ] Virtualized lists with @tanstack/react-virtual
- [ ] Only render visible items
- [ ] Overscan 5 items above/below viewport
- [ ] Lazy loading (30 days at a time)
- [ ] Debounced search (300ms)
- [ ] Memoize Daily Review generation
- [ ] Memoize event split detection
- [ ] Database indexes (if using Supabase)

**Performance Targets**:
- Initial load: < 2s
- Search results: < 500ms
- Timeline scroll: 60fps smooth
- Database query: < 100ms average

**Files to create/modify**:
- Install: `npm install @tanstack/react-virtual`
- `src/components/ThoughtsPane.tsx` (add virtualization)
- `src/components/TimePane.tsx` (add virtualization)
- `src/hooks/useVirtualScroll.ts` (new file)

---

#### 16. Accessibility Improvements
**Status**: Basic accessibility, needs WCAG 2.1 compliance

**Requirements**:
- [ ] WCAG 2.1 Level AA compliance
- [ ] Keyboard navigation for all actions
- [ ] ARIA labels for interactive elements
- [ ] Focus indicators
- [ ] Screen reader support
- [ ] Alt text for symbols
- [ ] Color contrast validation (currently good with monochrome)
- [ ] Reduced motion support

**Files to modify**:
- All component files (add ARIA labels)
- `src/styles/index.css` (focus indicators, reduced motion)

---

## Design System Specifications

### Typography
- **Content**: "Crimson Text", Lora, Georgia, serif
- **Metadata**: "Courier Prime", "Courier New", monospace
- **Base size**: 18px
- **Line height**: 1.7 (book-like spacing)

### Colors (Monochrome)
```css
--background: #0A0A0A
--text-primary: #F5F5F5
--text-secondary: #6A6A6A
--border-subtle: #1A1A1A
--hover-bg: #0F0F0F
```

### Spacing (8px grid)
- 6px: Minimal
- 12px: Close
- 16px: Comfortable
- 24px: Paragraph (mobile)
- 32px: Section (desktop, item spacing)
- 48px: Large (desktop margins)
- 64px: Major sections

### Symbols (18px)
- □ Todo (unchecked) - U+25A1
- ☑ Todo (checked) - U+2611
- ↹ Event (single) - U+21B9
- ⇤ Event (start) - U+21E4
- ⇥ Event (end) - U+21E5
- ↻ Routine - U+21BB
- ↝ Note - U+219D
- ■ Daily Review - U+25A0
- * Note sub-item - U+002A

---

## Feature Implementation Notes

### Critical Implementation Points (from spec)

1. **Input at bottom** - Most important UX change from typical apps
2. **Prefix requires space** - "t " not "t" (strict parsing)
3. **Oldest to newest** - Items flow upward in Thoughts pane
4. **Daily Review auto-completion** - Only when ALL items handled
5. **Event splitting is dynamic** - Recalculate on every render
6. **Todo subtasks: max depth 1, todos only** - No prefixes, always todos
7. **Note sub-items: max depth 2, any type** - Use prefixes * t e r
8. **Org Mode inspiration** - Freedom to mix types within notes
9. **Search scope** - Searches both panes simultaneously (Thoughts & Time)
10. **No unscheduled items** - Every task, event, and routine must have a date and time
11. **Waiting days** - Calculate from created_date, not scheduled_time
12. **Hierarchy validation** - Enforce depth limits and type constraints
13. **Order preservation** - Use order_index for sub-item sequencing

### Two Hierarchy Systems

**Todo Subtasks**:
- Parent todo → child todos (max 1 level)
- No prefixes (always todos)
- Checking parent checks all children

**Note Sub-Items** (Org Mode):
- Parent note → any type via prefixes (max 2 levels)
- Prefixes: * (note), t (todo), e (event), r (routine)
- Independent items (checking doesn't cascade)
- Maximum flexibility

---

## Testing Requirements

### Unit Tests
- [ ] Item creation with prefixes
- [ ] Daily Review generation
- [ ] Subtask cascade completion
- [ ] Event splitting logic
- [ ] Time parsing edge cases
- [ ] Depth validation

### Integration Tests
- [ ] Capture to Timeline flow
- [ ] Daily Review to Completion flow
- [ ] Search and navigation

### E2E Tests (Playwright)
- [ ] User can create and schedule todo
- [ ] Daily Review workflow
- [ ] Theme switching
- [ ] View mode switching

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Android 90+

---

## Next Steps

### Immediate (This Week)
1. Enhance Daily Review (pagination at 10+ items, auto-completion)
2. Complete subtask enhancements (validation, metadata display)
3. Begin search functionality implementation

### Short Term (Next 2 Weeks)
1. Implement search functionality (both panes simultaneously)
2. Add event auto-splitting logic
3. URL link previews for notes
4. Note embedding in todos

### Medium Term (Next Month)
1. Mobile responsive optimizations
2. Performance optimizations
3. Consider completion linking system (if needed)

### Long Term (Next Quarter)
1. Database backend (Supabase)
2. Notifications system
3. Accessibility audit and improvements
4. Beta testing and polish

---

**Status Key**:
- ✅ Completed
- 🔴 High Priority
- 🟡 Medium Priority
- 🟢 Lower Priority
- ⚠️ Needs Attention
- 🚀 In Progress

---

Last updated: November 20, 2025
