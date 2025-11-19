# Thoughts & Time - Development Roadmap

**Last Updated**: November 19, 2025
**Current Status**: MVP with core features ✅

---

## Overview

This roadmap tracks the implementation of features from the complete specification document. Features are organized by priority and implementation phase.

### Current Implementation Status

#### ✅ Completed Features (MVP)
- [x] Basic capture system with prefix detection (t, e, r, n)
- [x] Four item types: Todo, Event, Routine, Note
- [x] Tag extraction and display (#tag)
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

---

## Priority Features

### 🔴 High Priority (Phase 1)

#### 1. Daily Review Fixes ⚠️
**Status**: Partially implemented, needs correction

**Current Issue**: Daily Review shows only *unscheduled* todos from past days.

**Required Behavior** (per clarification):
- Show ALL undone (incomplete) todos from past days, regardless of scheduled status
- Include both scheduled and unscheduled todos that remain incomplete

**Implementation**:
```typescript
// Fix in DailyReview.tsx
// Change filter from:
todo.createdDate < today && !todo.scheduledTime && !todo.completedAt

// To:
todo.createdDate < today && !todo.completedAt
```

**Additional Requirements**:
- [ ] Completion linking (create CompletionLink on complete)
- [ ] Create completion entry in today's Thoughts when completed from review
- [ ] Track handled items for auto-completion
- [ ] Auto-complete Daily Review when all items handled
- [ ] Pagination for 20+ items ("Load next 20" button)
- [ ] Display subtasks nested in review items

**Files to modify**:
- `src/components/DailyReview.tsx`
- `src/store/useStore.ts` (add completion linking logic)
- `src/types.ts` (add CompletionLink interface if needed)

---

#### 2. Subtasks Enhancements (Feature 5)
**Status**: Partially implemented

**Completed**:
- [x] Tab/Shift+Tab for indent/outdent
- [x] Visual indent (32px)
- [x] Parent-child relationship in DB
- [x] Checking parent checks all children
- [x] Max 1 level depth enforcement

**Missing**:
- [ ] Drag parent brings all subtasks along
- [ ] Prevent dragging individual subtasks
- [ ] Metadata displays AFTER all subtasks (currently may not be consistent)
- [ ] Subtasks inherit parent tags
- [ ] Subtasks cannot have own deadlines (validation)
- [ ] Subtasks cannot have own scheduled times (validation)
- [ ] Completed subtasks show strikethrough but stay visible

**Files to modify**:
- `src/components/ItemDisplay.tsx`
- `src/store/useStore.ts` (add validation)
- Future: drag and drop integration

---

#### 3. Drag & Drop System (Feature 9) 🚀
**Status**: Not implemented

**Requirements**:

**Desktop**:
- [ ] Install @dnd-kit/core library
- [ ] Hover cursor changes to grab hand
- [ ] Item lifts with shadow, opacity 0.7, 2deg rotation
- [ ] Timeline shows drop zones with dashed borders
- [ ] Drop zone highlights on hover (background #1A1A1A)
- [ ] Schedule item on drop
- [ ] Item remains in Thoughts with time indicator

**Mobile**:
- [ ] Long-press detection (500ms)
- [ ] Haptic feedback on drag start
- [ ] Swipe right to Times pane while dragging
- [ ] Visual indicator for drop location
- [ ] Smooth animation on drop

**Constraints**:
- [ ] Cannot drag completed items (opacity 0.4, not draggable)
- [ ] Cannot drag items within Daily Review (use [↷] button)
- [ ] Cannot drag FROM Time TO Thoughts (cannot "unschedule" by dragging)
- [ ] Dragging parent todo brings all subtasks
- [ ] Cannot drag subtasks independently

**Validation**:
- [ ] Validate target date (past infinite, future max 1 year)
- [ ] Show error for invalid date ranges

**Files to create/modify**:
- Install: `npm install @dnd-kit/core @dnd-kit/utilities`
- `src/components/ThoughtsPane.tsx` (draggable items)
- `src/components/TimePane.tsx` (drop zones)
- `src/hooks/useDragAndDrop.ts` (new file)
- `src/styles/drag.css` (drag visual feedback)

---

### 🟡 Medium Priority (Phase 2)

#### 4. Search Functionality
**Status**: Not implemented

**Requirements**:
- [ ] Search icon in header (🔍)
- [ ] Keyboard shortcut: Cmd/Ctrl + F
- [ ] Scope: searches only active/focused pane
- [ ] Full-text search with PostgreSQL syntax
- [ ] Tag search with # symbol
- [ ] Results show date, time, full item with symbol, tags
- [ ] Highlight matching text
- [ ] Click result navigates to day and scrolls to item
- [ ] ESC / [×] button to close search
- [ ] Show "No results found" empty state

**Files to create/modify**:
- `src/components/Search.tsx` (new file)
- `src/components/Header.tsx` (add search button)
- `src/store/useStore.ts` (add search methods)

---

#### 5. Event Auto-Split Logic
**Status**: Not implemented

**Requirements**:
- [ ] Detect when items exist between event start and end times
- [ ] Split event into ⇤ (start) and ⇥ (end) markers
- [ ] Single ↹ symbol when no items between
- [ ] Start shows full duration
- [ ] End shows "(end)" marker
- [ ] Both show same tags
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

#### 6. Completion Linking System
**Status**: Partially implemented in store, not in UI

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
☑ ~~Call mom~~ #family
  completed on Oct 14 →

Oct 14 Thoughts:
☑ ~~Call mom (completed)~~ #family
  ← from Oct 12
```

**Files to create/modify**:
- `src/types.ts` (add CompletionLink interface)
- `src/store/useStore.ts` (add completion linking logic)
- `src/components/ItemDisplay.tsx` (show completion links)
- `src/components/DailyReview.tsx` (create links on complete)

---

#### 7. URL Link Previews for Notes
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

#### 8. Note Embedding in Todos
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
□ Meeting prep #work
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

#### 9. Database Backend (Supabase)
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

#### 10. Mobile Responsive Optimizations
**Status**: Partially responsive, needs improvements

**Requirements**:
- [ ] Swipeable panes (swipe left/right to switch)
- [ ] Touch gesture detection
- [ ] Long-press drag (500ms + haptic)
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

#### 11. Notifications System
**Status**: Not implemented

**Requirements**:
- [ ] Push notification setup
- [ ] Service worker registration
- [ ] Notification permission request
- [ ] Schedule notifications for events (X minutes before)
- [ ] Schedule notifications for routines
- [ ] Schedule notifications for deadlines
- [ ] Notification settings UI
- [ ] User preferences storage
- [ ] Dismiss handling

**Files to create/modify**:
- `public/service-worker.js` (new file)
- `src/utils/notifications.ts` (new file)
- `src/components/Settings.tsx` (add notification preferences)
- `src/store/useSettingsStore.ts` (add notification settings)

---

#### 12. Performance Optimizations
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
- Drag responsiveness: < 16ms (60fps)
- Timeline scroll: 60fps smooth
- Database query: < 100ms average

**Files to create/modify**:
- Install: `npm install @tanstack/react-virtual`
- `src/components/ThoughtsPane.tsx` (add virtualization)
- `src/components/TimePane.tsx` (add virtualization)
- `src/hooks/useVirtualScroll.ts` (new file)

---

#### 13. Accessibility Improvements
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
9. **Search scope** - Never both panes simultaneously
10. **Drag prohibition** - Cannot drag from Time to Thoughts
11. **Completion linking** - Always create both entries + link
12. **Waiting days** - Calculate from created_date, not scheduled_time
13. **Hierarchy validation** - Enforce depth limits and type constraints
14. **Order preservation** - Use order_index for sub-item sequencing

### Two Hierarchy Systems

**Todo Subtasks**:
- Parent todo → child todos (max 1 level)
- No prefixes (always todos)
- Checking parent checks all children
- All subtasks come along when dragging

**Note Sub-Items** (Org Mode):
- Parent note → any type via prefixes (max 2 levels)
- Prefixes: * (note), t (todo), e (event), r (routine)
- Independent items (checking doesn't cascade)
- Maximum flexibility

---

## Testing Requirements

### Unit Tests
- [ ] Item creation with prefixes
- [ ] Tag extraction
- [ ] Daily Review generation
- [ ] Subtask cascade completion
- [ ] Event splitting logic
- [ ] Time parsing edge cases
- [ ] Depth validation

### Integration Tests
- [ ] Capture to Timeline flow
- [ ] Daily Review to Completion flow
- [ ] Drag and drop scheduling
- [ ] Search and navigation

### E2E Tests (Playwright)
- [ ] User can create and schedule todo
- [ ] Daily Review workflow
- [ ] Drag and drop interaction
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
1. Fix Daily Review to show ALL undone todos (not just unscheduled)
2. Add completion linking functionality
3. Begin Drag & Drop implementation

### Short Term (Next 2 Weeks)
1. Complete Drag & Drop system (desktop + mobile)
2. Enhance subtasks (drag behavior, validation)
3. Implement search functionality
4. Add event auto-splitting

### Medium Term (Next Month)
1. Implement completion linking UI
2. Add URL link previews
3. Note embedding in todos
4. Mobile responsive optimizations

### Long Term (Next Quarter)
1. Database backend (Supabase)
2. Notifications system
3. Performance optimizations
4. Accessibility audit and improvements
5. Beta testing and polish

---

**Status Key**:
- ✅ Completed
- 🔴 High Priority
- 🟡 Medium Priority
- 🟢 Lower Priority
- ⚠️ Needs Attention
- 🚀 In Progress

---

Last updated: November 19, 2025
