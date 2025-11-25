# Thoughts & Time - Development Roadmap

**Last Updated**: November 23, 2025
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
- [x] Unified children field for all item types
- [x] Multi-line input with Tab-based hierarchy (max 2 levels)
- [x] Edit mode shows item + children in textarea
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
- [x] Accessibility improvements (ARIA labels, focus indicators, keyboard navigation)
- [x] Comprehensive test suite (278 tests with Vitest)
- [x] Store helper functions extracted (itemHelpers.ts)
- [x] Undo/Redo system (tracks all actions with Cmd/Ctrl+Z/Shift+Z)
- [x] Undo button in delete toasts
- [x] Custom TimeInput component (replaces native browser picker)
- [x] Event auto-split (shows ⇤/⇥ markers when items exist within event)
- [x] Virtualized lists for both panes (via @tanstack/react-virtual)
- [x] Data export/import (JSON backup in Settings)
- [x] E2E tests with Playwright (15 test cases)
- [x] Jump to Source (↸ button to navigate from Time pane to original item in Thoughts)

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

#### 2. Hierarchy System

**Status**: Refactored ✅

**Completed**:

- [x] Tab/Shift+Tab for indent/outdent
- [x] Visual indent with left border styling
- [x] Unified `children` field for all item types
- [x] Type constraints (which children each type can have)
- [x] Max 2 levels depth for all types
- [x] Multi-line input with Shift+Enter
- [x] Edit mode shows item + all children

**Type Constraints**:

- Todo → todos, notes
- Note → todos, notes, events
- Event → todos, notes (displayed within event timeframe)
- Routine → notes

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
- [x] Custom TimeInput component (replaces native browser picker)
- [x] TimeInput respects 12h/24h setting with matching aesthetics
- [x] 24h time format parsing (at HH:MM patterns)
- [x] Enter key submission in time prompt modal

**Files modified**:

- `src/store/useSettingsStore.ts` (added timeFormat state)
- `src/components/Settings.tsx` (added UI toggle)
- `src/utils/formatting.ts` (formatTimeForDisplay function)
- `src/components/ItemDisplay.tsx` (timestamp formatting)
- `src/components/ThoughtsPane.tsx` (time prompt formatting, closure fix)
- `src/components/TimePane.tsx` (timeline formatting)
- `src/components/TimeInput.tsx` (new custom time input component)
- `src/components/TimePromptModal.tsx` (updated to use TimeInput)
- `src/utils/parser.ts` (24h time format recognition)

---

#### 4. Testing Infrastructure

**Status**: Completed ✅

**Completed**:

- [x] Vitest testing framework with Happy DOM environment
- [x] Test setup with @testing-library/react and jest-dom matchers
- [x] Test scripts (test, test:ui, test:coverage)
- [x] Coverage reporting with v8 provider
- [x] 158 comprehensive tests covering utilities, store, and components

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

**Completed** (November 2025 update):

- [x] Keyboard shortcut: Cmd/Ctrl + F
- [x] Highlight matching text in results
- [x] Show "No results found" empty state

**Files modified**:

- `src/components/Header.tsx` (search input)
- `src/components/ThoughtsPane.tsx` (search filtering)
- `src/components/TimePane.tsx` (search filtering)
- `src/components/DailyReview.tsx` (search filtering)

---

#### 8. Event Auto-Split Logic

**Status**: Completed ✅

**Completed**:

- [x] Detect when items exist between event start and end times
- [x] Split event into ⇤ (start) and ⇥ (end) markers
- [x] Single ↹ symbol when no items between
- [x] Start shows full duration with time range
- [x] End shows "(end)" marker
- [x] Dynamic calculation on render

**Files modified**:

- `src/components/TimePane.tsx` (hasItemsWithinEvent function, split rendering)

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

**Status**: Replaced by Jump to Source ✅

**Note**: Instead of embedding notes in todos, we implemented "Jump to Source" (↸ button) which allows users to navigate from any Time pane item to its original location in the Thoughts pane. This provides context viewing without the complexity of note embedding.

**Original Requirements** (not implemented):

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

#### 11. Database Backend (Supabase)

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

#### 12. Mobile Responsive Optimizations

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

#### 13. Notifications System

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

**Status**: Partially completed ✅

**Completed**:

- [x] Virtualized lists with @tanstack/react-virtual (both panes)
- [x] Only render visible items in infinite scroll mode
- [x] Overscan 3 items above/below viewport
- [x] Debounced search (300ms)
- [x] Memoized Daily Review generation
- [x] Memoized event split detection

**Remaining**:

- [x] Lazy loading (14 days initially, expanding in chunks up to 90 days)
- [ ] Database indexes (if using Supabase)

**Performance Targets**:

- Initial load: < 2s
- Search results: < 500ms
- Timeline scroll: 60fps smooth
- Database query: < 100ms average

**Files modified**:

- `src/components/TimePane.tsx` (virtualization with useVirtualizer)

---

#### 15. Accessibility Improvements

**Status**: Significantly improved ✅

**Completed**:

- [x] Keyboard navigation for all actions
- [x] ARIA labels for all interactive elements
- [x] Focus indicators (`:focus-visible` styles)
- [x] Screen reader support with ARIA live regions
- [x] Alt text for symbols
- [x] Color contrast validation (good with monochrome)
- [x] Reduced motion support (`prefers-reduced-motion` media query)
- [x] Focus trap in all modals (Settings, ConfirmDialog, TimePromptModal)
- [x] ARIA dialog roles and labels
- [x] Meaningful aria-labels on todo checkboxes (e.g., "Mark 'Task' as complete")
- [x] aria-pressed state for toggle buttons
- [x] Keyboard-accessible item actions (show on focus, not just hover)
- [x] Proper form labeling with aria-describedby for input hints
- [x] Screen reader hints explaining input syntax

**Remaining for full WCAG 2.1 AA**:

- [x] Skip navigation link (added November 2025)
- [ ] Full accessibility audit (manual testing with screen readers)

**Files modified**:

- `src/components/Settings.tsx` - Focus trap, ARIA labels
- `src/components/ConfirmDialog.tsx` - Focus trap
- `src/components/TimePromptModal.tsx` - Focus trap, ARIA labels
- `src/components/ItemDisplay.tsx` - Meaningful aria-labels, keyboard focus handling
- `src/components/ThoughtsPane.tsx` - Input labeling and screen reader hints
- `src/index.css` - Reduced motion support
- `src/hooks/useFocusTrap.ts` - New focus trap hook

---

## Design System Specifications

### Typography

- **Content**: "Crimson Text", Lora, Georgia, serif
- **Metadata**: "Courier Prime", "Courier New", monospace
- **Base size**: 18px
- **Line height**: 1.7 (book-like spacing)

### Colors (Monochrome)

```css
--background: #0a0a0a --text-primary: #f5f5f5 --text-secondary: #6a6a6a --border-subtle: #1a1a1a
  --hover-bg: #0f0f0f;
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
- ↸ Jump to Source - U+21B8

---

## Feature Implementation Notes

### Critical Implementation Points (from spec)

1. **Input at bottom** - Most important UX change from typical apps
2. **Prefix requires space** - "t " not "t" (strict parsing)
3. **Oldest to newest** - Items flow upward in Thoughts pane
4. **Daily Review auto-completion** - Only when ALL items handled
5. **Event splitting is dynamic** - Recalculate on every render
6. **Unified children field** - All item types use `children` array
7. **Max 2 levels for all types** - Use prefixes n t e r with Tab indentation
8. **Org Mode inspiration** - Freedom to mix types within items (with constraints)
9. **Search scope** - Searches both panes simultaneously (Thoughts & Time)
10. **No unscheduled items** - Every task, event, and routine must have a date and time
11. **Waiting days** - Calculate from created_date, not scheduled_time
12. **Type constraints** - Enforce which child types are allowed per parent
13. **Order preservation** - Use order_index for sub-item sequencing

### Unified Hierarchy System

**All item types now use the same `children` field and hierarchy rules**:

- Max 2 levels of nesting for all types
- Prefixes: `n` (note), `t` (todo), `e` (event), `r` (routine)
- Tab after prefix indicates nesting level
- Multi-line input with Shift+Enter, batch submit with Enter

**Type Constraints for Children**:

- Todo → notes, todos
- Note → todos, notes, events
- Event → todos, notes (displayed within event timeframe in TimePane)
- Routine → notes

**Input Format** (Org Mode inspired):

```
t Main task
t	First subtask (Tab = level 1)
n		Subnote (two Tabs = level 2)
```

**Edit Mode**:

- Shows item + all children in textarea
- Tab/Shift+Tab for indentation control
- Enter saves, Shift+Enter adds new line

---

## Testing Requirements

### Unit Tests ✅

- [x] Item creation with prefixes (parser.test.ts)
- [x] Daily Review generation
- [x] Subtask cascade completion (useStore.test.ts)
- [x] Event splitting logic
- [x] Time parsing edge cases (parser.test.ts - 54 tests)
- [x] Depth validation
- [x] 158 tests total with Vitest

### Integration Tests ✅

- [x] Capture to Timeline flow (todo with time, event, note)
- [x] Daily Review to Completion flow (complete/uncomplete todos)
- [x] Undo/Redo multi-step flows (multiple actions, delete undo, completion undo)
- [x] Edit flow with persistence
- [x] Search flow (filtering, clearing)
- [x] Cross-pane interaction (jump to source)
- [x] Data persistence flow (items and settings)

**Files created**:

- `e2e/integration.spec.ts` - Comprehensive integration test suite

### E2E Tests (Playwright) ✅

- [x] App loads with header and two panes
- [x] User can create todo, event, note items
- [x] Toggle todo completion
- [x] Delete items with confirmation
- [x] Open/close settings
- [x] Theme switching (dark/light)
- [x] View mode switching (infinite/book)
- [x] Time format switching (12h/24h)
- [x] Search functionality
- [x] Undo/redo with keyboard shortcuts
- [x] Export/import data buttons visible

**Files created**:

- `playwright.config.ts`
- `e2e/app.spec.ts` (15 test cases)

**Scripts**:

- `npm run test:e2e` - Run E2E tests
- `npm run test:e2e:ui` - Run with UI
- `npm run test:e2e:headed` - Run in headed mode

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Android 90+

---

## Code Quality Improvements (November 2025)

### ✅ Completed Improvements

#### 1. Accessibility Enhancements

- [x] Added `aria-label` attributes to all icon buttons in ItemActions
- [x] Improved screen reader support for action buttons (Edit, Delete, Jump to Source)

#### 2. Performance Optimizations

- [x] Added custom comparator to React.memo in ItemDisplay to prevent unnecessary re-renders
- [x] Memoized dates array generation in TimePane and ThoughtsPane
- [x] Optimized re-render cycles by comparing specific item properties

#### 3. Input Validation & Error Handling

- [x] Added time range validation in parser (auto-corrects invalid end times)
- [x] Added comprehensive import validation in Settings:
  - Validates required fields (id, type, content, createdDate)
  - Detects duplicate IDs
  - Validates parent references exist
  - Validates item types are valid
- [x] Added localStorage quota exceeded error handling

#### 4. Type Safety Improvements

- [x] Fixed unsafe double casting in useUndoRedo hook
- [x] Improved type assertions with proper type guards

#### 5. Developer Experience

- [x] Set up Prettier code formatter with consistent config
- [x] Set up Husky pre-commit hooks with lint-staged
- [x] Added format and format:check npm scripts
- [x] Added 18 new unit tests (176 total tests passing)
- [x] Created test files for Settings and ItemActions components

**Files Modified:**

- `src/components/ItemActions.tsx` - Added aria-labels
- `src/components/ItemDisplay.tsx` - Added React.memo comparator
- `src/components/Settings.tsx` - Added import validation and error handling
- `src/components/TimePane.tsx` - Memoized dates array
- `src/components/ThoughtsPane.tsx` - Memoized dates array
- `src/utils/parser.ts` - Added time range validation
- `src/hooks/useUndoRedo.ts` - Fixed type safety
- `package.json` - Added Prettier, Husky, lint-staged

**Files Created:**

- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files to ignore
- `.husky/pre-commit` - Pre-commit hook
- `src/components/Settings.test.tsx` - Settings tests
- `src/components/ItemActions.test.tsx` - ItemActions tests

---

## Accessibility & Performance Improvements (November 2025)

### ✅ Completed Improvements

#### 1. Integration Tests

- [x] Created comprehensive integration test suite in `e2e/integration.spec.ts`
- [x] Tests cover: Capture→Timeline, Daily Review→Completion, Undo/Redo, Edit, Search, Cross-pane, Persistence

#### 2. Focus Trap for Modals

- [x] Created `useFocusTrap` hook for keyboard accessibility
- [x] Applied to Settings, ConfirmDialog, and TimePromptModal
- [x] Restores focus to previous element on close
- [x] Traps Tab/Shift+Tab within modal

#### 3. ARIA Live Regions

- [x] Toast container has `aria-live="polite"` for screen reader announcements
- [x] Individual toasts have `role="alert"` and `aria-atomic="true"`
- [x] All modals have proper `role="dialog"` and `aria-modal="true"`

#### 4. Reduced Motion Support

- [x] Added `@media (prefers-reduced-motion: reduce)` styles
- [x] Disables all animations for users who prefer reduced motion
- [x] Applies to page-flip, slide-in, and highlight-flash animations

#### 5. Lazy Loading for Dates

- [x] Created `useLazyDates` hook for performance
- [x] Starts with 14 days past/future (28 total vs previous 60)
- [x] Loads more in chunks of 14 days as user navigates
- [x] Maximum 90 days past/future (180 total)
- [x] Automatic loading when near date boundaries in book mode

**Files Created:**

- `src/hooks/useFocusTrap.ts` - Focus trap hook
- `src/hooks/useLazyDates.ts` - Lazy date loading hook
- `e2e/integration.spec.ts` - Integration tests

**Files Modified:**

- `src/components/Settings.tsx` - Focus trap, ARIA labels
- `src/components/ConfirmDialog.tsx` - Focus trap
- `src/components/TimePromptModal.tsx` - Focus trap, ARIA labels
- `src/index.css` - Reduced motion support
- `src/App.tsx` - Lazy date loading integration

---

## TimePane Subtask Display (November 25, 2025)

### ✅ Completed Improvements

#### 1. Show Subtasks Under Parent Todos

- [x] Display todo subtasks under parent todos in TimePane (inherit parent's time/date)
- [x] Notes do NOT appear in TimePane - only todo subtasks are shown
- [x] Visual hierarchy with left border and indentation (matching event children style)
- [x] Interactive subtask completion (checkboxes for todo children)
- [x] Daily Review simplified to show only parent tasks (not children)
- [x] Subtasks never have their own scheduled time - they follow parent everywhere

**Files Modified:**

- `src/components/TimePane.tsx` - Added children display for todos, filtered to only show todo children
- `src/components/DailyReview.tsx` - Removed subtasks display to keep it compact

**Key Features:**

- **Only todo subtasks appear in TimePane** (notes are filtered out)
- Subtasks inherit parent's time/date (no independent scheduling)
- Clickable checkboxes to complete individual subtasks
- Search highlights work in both parent and child content
- Visual consistency with event children (left border, smaller font)
- Daily Review shows only parent (compact view)

---

## Edit Box Enhancement with CodeMirror 6 (November 25, 2025)

### ✅ Completed Improvements

#### 1. CodeMirror 6 Integration

- [x] Installed CodeMirror 6 packages (@codemirror/state, @codemirror/view, @codemirror/commands, @codemirror/language)
- [x] Created `SymbolEditor` component with custom keymaps
- [x] Proper Tab/Shift+Tab indentation with hierarchy enforcement
- [x] Prefix-to-symbol auto-conversion (e.g., `t ` → `□ `)
- [x] Matches app aesthetic (Crimson Text font at 18px with 1.3 line height)
- [x] Custom theme with proper cursor styling

**Files Created:**

- `src/components/SymbolEditor.tsx` - CodeMirror 6-based editor component

**Files Modified:**

- `src/components/ItemEditor.tsx` - Refactored to use SymbolEditor
- `src/components/ItemDisplay.tsx` - Fixed child creation (relative level), hide buttons on children
- `src/utils/formatting.ts` - Added convertToParserFormat() shared function
- `src/components/ThoughtsPane.tsx` - Uses shared conversion function
- `package.json` - Added CodeMirror 6 dependencies

**Key Features:**

- Tab cycles through indent levels (0 → 1 → 2 → 0) with hierarchy enforcement
- First line cannot be indented
- Child indent level cannot exceed parent + 1 (max 2 tabs)
- Enter submits, Shift+Enter adds new line
- Escape cancels
- Edit box only appears on parent items (depth === 0)
- Children are hidden during edit and edited together with parent

---

## Code Quality Improvements (November 22, 2025)

### ✅ Completed Improvements

#### 1. Hook Test Coverage

- [x] Added comprehensive tests for `useHistory.ts` (14 tests)
- [x] Added tests for `useFocusTrap.ts` (6 tests)
- [x] Added tests for `useKeyboardShortcuts.ts` (17 tests)
- [x] Total test count increased from 176 to 238 tests

**Files Created:**

- `src/store/useHistory.test.ts`
- `src/hooks/useFocusTrap.test.ts`
- `src/hooks/useKeyboardShortcuts.test.ts`

#### 2. Accessibility Improvements

- [x] Added skip navigation link for keyboard users
- [x] Changed main content wrapper to `<main>` with `id="main-content"`

**Files Modified:**

- `src/App.tsx` - Added skip nav link, semantic main element

#### 3. Component-Level Error Boundaries

- [x] Created `PaneErrorBoundary` component for isolating pane errors
- [x] Wrapped ThoughtsPane and TimePane with error boundaries
- [x] One pane can crash without affecting the other

**Files Created:**

- `src/components/PaneErrorBoundary.tsx`

**Files Modified:**

- `src/App.tsx` - Wrapped panes with error boundaries

#### 4. Refactored Duplicated Code

- [x] Extracted wheel navigation logic into `useWheelNavigation` hook
- [x] Removed ~120 lines of duplicated code from ThoughtsPane and TimePane

**Files Created:**

- `src/hooks/useWheelNavigation.ts`

**Files Modified:**

- `src/components/ThoughtsPane.tsx` - Uses shared hook
- `src/components/TimePane.tsx` - Uses shared hook

#### 5. Completion Linking UI

- [x] Added completion date display for completed todos
- [x] Clickable "completed on [date] →" links when `completionLinkId` exists
- [x] Added `onNavigateToDate` prop to ItemDisplay

**Files Modified:**

- `src/components/ItemDisplay.tsx`

#### 6. Component Tests for Complex UI

- [x] Added tests for `DailyReview` component (11 tests)
- [x] Added tests for `ThoughtsPane` component (7 tests)
- [x] Added tests for `TimePane` component (7 tests)
- [x] Tests cover rendering, props, accessibility, interactions

**Files Created:**

- `src/components/DailyReview.test.tsx`
- `src/components/ThoughtsPane.test.tsx`
- `src/components/TimePane.test.tsx`

#### 7. DailyReview Accessibility

- [x] Added ARIA labels to action buttons (Reschedule, Complete, Cancel)
- [x] Added semantic structure with `<section>` and heading
- [x] Added `role="group"` for related action buttons
- [x] Used `aria-hidden` on decorative icons

**Files Modified:**

- `src/components/DailyReview.tsx`

---

## Input System Refactoring (November 22, 2025)

### ✅ Completed Changes

#### 1. Unified Children Field

- [x] Replaced `subtasks` and `subItems` with unified `children` field
- [x] All item types (Todo, Event, Routine, Note) now use `children`
- [x] Updated types.ts with new field structure
- [x] Updated all store operations for new field

#### 2. Multi-Line Input System

- [x] Created `parseMultiLine()` function for batch parsing
- [x] Tab-based hierarchy detection (Tab = level 1, Tab+Tab = level 2)
- [x] Shift+Enter for new lines, Enter to submit all
- [x] Type constraints validation per parent type
- [x] Added `TYPE_CONSTRAINTS` and `isValidChildType()` utilities

#### 3. Edit Mode Enhancements

- [x] ItemEditor converted from input to textarea
- [x] Auto-resize textarea based on content
- [x] Tab/Shift+Tab for indentation control
- [x] Serializes item + all children for editing
- [x] Parses and updates hierarchy on save

#### 4. TimePane Event Children

- [x] Events now display child todos/notes in timeline
- [x] Children rendered with left border for visual hierarchy
- [x] Supports both event-single and event-start entry types

#### 5. Prefix System Update

- [x] Changed note prefix from `*` to `n`
- [x] Updated symbolToPrefix mapping
- [x] Updated all tests for new prefix

**Files Modified:**

- `src/types.ts` - Unified children field, ParsedLine types
- `src/utils/parser.ts` - parseMultiLine, TYPE_CONSTRAINTS
- `src/store/useStore.ts` - addItems with rootParentId support
- `src/components/ThoughtsPane.tsx` - Tab handling, batch creation
- `src/components/ItemDisplay.tsx` - Multi-line edit save
- `src/components/ItemEditor.tsx` - Textarea with indentation
- `src/components/TimePane.tsx` - Event children rendering
- `src/utils/formatting.ts` - Note symbol mapping, typeToSymbol

---

## Next Steps

### Immediate (This Week)

1. Mobile responsive optimizations (swipe gestures, tap targets)
2. Full accessibility audit (manual testing)

### Short Term (Next 2 Weeks)

1. URL link previews for notes

### Medium Term (Next Month)

1. Database backend (Supabase)
2. Notifications system

### Long Term (Next Quarter)

1. User authentication
2. Cross-device sync
3. Beta testing and polish

---

**Status Key**:

- ✅ Completed
- 🔴 High Priority
- 🟡 Medium Priority
- 🟢 Lower Priority
- ⚠️ Needs Attention
- 🚀 In Progress

---

Last updated: November 22, 2025
