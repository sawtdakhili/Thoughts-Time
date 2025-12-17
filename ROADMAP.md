# Thoughts & Time - Development Roadmap

**Last Updated**: December 17, 2025
**Current Status**: Production Ready ✅ | Authentication ✅ | Live on Vercel 🚀 | Self-hosting ready 🐳

---

## Overview

This roadmap tracks the implementation of features from the complete specification document. Features are organized by priority and implementation phase.

### Core Philosophy

**"Not Scheduled = Won't Be Done"**

This app enforces a strict scheduling philosophy: **every single task, event, and routine must have a date and time**. There are no "unscheduled" items in this system. If something doesn't have a specific time assigned, it doesn't exist in the app. This intentional constraint encourages mindful planning and prevents the accumulation of vague, never-completed tasks.

### Current Implementation Status

#### ✅ Completed Features

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
- [x] Comprehensive test suite (388 tests with Vitest)
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

**Current Behavior**: Daily Review shows incomplete todos from past days, excluding those already scheduled for today or future dates.

**Philosophy Alignment**: Since all items in this app must be scheduled (see Core Philosophy above), Daily Review shows all incomplete scheduled todos from previous days that need to be rescheduled or completed. Items already scheduled for today/future are excluded from Daily Review to prevent duplication with the timeline.

**Completed**:

- [x] Track handled items (items disappear after action)
- [x] Real-time cleanup of handledItems when todos are unchecked (November 28, 2025)
- [x] Exclude todos scheduled for today/future from Daily Review (November 28, 2025)
- [x] Reschedule parsing uses today as reference date (November 28, 2025)
- [x] Pagination for 10+ items ("Show more" button)
- [x] Header indicator (■→□) when all handled
- [x] Auto-complete Daily Review when all items handled
- [x] Display subtasks nested in review items

**Recent Fixes** (November 28, 2025):
- Fixed: Unchecking old todos now makes them reappear in Daily Review immediately
- Fixed: Checking old todos makes them disappear from Daily Review immediately
- Fixed: Rescheduling from Daily Review now interprets "tomorrow" relative to today, not the original date
- Fixed: Todos scheduled for today or future no longer duplicate in Daily Review and timeline

**Files modified**:

- `src/components/DailyReview.tsx` (handledItems cleanup, scheduled filtering, reference date)
- `src/utils/parser.ts` (added optional referenceDate parameter)

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

#### 11. User Accounts & Cloud Sync (Supabase + PocketBase)

**Status**: Phase 1-3 Authentication ✅ Completed (December 11, 2025)

**Strategy**: Dual backend approach for maximum flexibility

### Phase 1: Supabase Cloud Backend (Hosted Version)

**Cost**: FREE tier (0-500 users), $25/month (500-10K users)

**Why Supabase:**
- Built-in authentication (email/password, OAuth, magic links)
- PostgreSQL with row-level security
- Real-time subscriptions for cross-device sync
- Generous free tier (500MB database, 50K monthly active users)
- Easy migration from localStorage

**Implementation Steps**:

1. **Supabase Project Setup** ✅ Completed
   - [x] Create Supabase project
   - [x] Configure authentication providers (email/password)
   - [x] Set up development environment

2. **Database Schema** ✅ Completed
   - [x] Create `users` table (handled by Supabase Auth)
   - [x] Create `items` table (polymorphic for all types: todo, event, routine, note)
   - [x] Set up row-level security (RLS) policies
   - [ ] Create `routine_occurrences` table
   - [ ] Create `completion_links` table
   - [ ] Create indexes for performance

3. **Authentication Layer** ✅ Completed
   - [x] Create `src/lib/supabase.ts` (client setup)
   - [x] Create `src/store/useAuthStore.ts` (auth state management)
   - [x] Build login/signup UI components (AuthModal, AuthBanner, UserMenu)
   - [x] Add email verification flow
   - [x] Add AuthProvider with auth state listener
   - [ ] Add password reset flow
   - [ ] Add OAuth providers (Google, GitHub)

4. **Data Migration & Sync** ✅ Completed (December 16, 2025)
   - [x] Create `src/services/syncService.ts` (basic sync implementation)
   - [x] Update `src/store/useStore.ts` to support both localStorage and Supabase
   - [x] Implement basic data sync (create operations)
   - [x] Implement full CRUD sync (update, delete operations)
   - [x] Implement optimistic updates (instant UI, background sync with status indicators)
   - [x] Add conflict resolution (last-write-wins with timestamps and user dialog)
   - [x] Build "Import from localStorage" migration tool with progress tracking
   - [ ] Add offline mode detection and queue (deferred)

   **Optimistic Updates Implementation**:
   - Added SyncStatus type ('pending' | 'syncing' | 'synced' | 'error')
   - Items show ⏳ pending, 🔄 syncing, or ⚠️ error indicators
   - Instant UI updates, background sync with status tracking
   - Enhanced handleSync with sync status lifecycle management

   **Conflict Resolution Implementation**:
   - Timestamp-based conflict detection in updateItem
   - ConflictDialog component shows both versions side-by-side
   - User chooses "Use Your Version" or "Use Other Device Version"
   - fetchItemById function for server version checking
   - ConflictError class with local and server item details

   **Migration Tool Implementation**:
   - migrateLocalDataToSupabase with batch upload and progress tracking
   - getMigratableItemCount to count items with userId 'guest'
   - Migration UI in Settings (only for authenticated users with local data)
   - Real-time progress bar with success/failure statistics
   - Graceful error handling with partial migration support

   **Files Created**:
   - `src/components/ConflictDialog.tsx` - Conflict resolution UI
   - `src/hooks/useConflict.ts` - Conflict state management
   - `src/utils/migration.ts` - Migration utility with progress tracking

5. **Testing & Polish** 🚀 In Progress
   - [x] Test sign up/sign in/sign out flows
   - [x] Test basic data sync to Supabase
   - [x] Implement optimistic updates with sync status indicators
   - [x] Implement conflict resolution with user dialog
   - [x] Implement data migration tool with progress tracking
   - [ ] Test multi-device sync in production
   - [ ] Test offline mode and conflict resolution in production
   - [ ] Performance testing with large datasets
   - [x] Add loading states and error handling (optimistic updates + conflict dialog)

**Critical Bug Fixes** (December 11, 2025):

1. **localStorage Key Conflict** - Fixed infinite sign-in/sign-out loop
   - **Problem**: Supabase client and Zustand persist both used `'thoughts-time-auth'` key
   - **Solution**: Renamed Zustand persist key to `'thoughts-time-auth-mode'`
   - **File**: `src/store/useAuthStore.ts:177`

2. **Rules of Hooks Violation** - Fixed "rendered more hooks" crash
   - **Problem**: Early return in UserMenu before `useEffect` hook
   - **Solution**: Moved early return after all hooks
   - **File**: `src/components/UserMenu.tsx:28`

**Files Created**:
- `.env.local` - Supabase environment variables
- `src/env.d.ts` - TypeScript environment types
- `src/lib/supabase.ts` - Supabase client initialization
- `src/store/useAuthStore.ts` - Authentication state management
- `src/services/syncService.ts` - Data sync service
- `src/components/AuthProvider.tsx` - Auth state listener
- `src/components/AuthModal.tsx` - Sign in/up modal
- `src/components/AuthBanner.tsx` - Guest mode banner
- `src/components/UserMenu.tsx` - User dropdown menu

**Files Modified**:
- `.gitignore` - Added .env files
- `src/main.tsx` - Wrapped with AuthProvider
- `src/App.tsx` - Added auth components, fetch items on auth
- `src/store/useStore.ts` - Added sync calls, changed to 'guest' default userId
- `src/utils/itemFactory.ts` - Changed to 'guest' default userId

---

### 🚀 Production Deployment (Vercel)

**Status**: ✅ Completed (December 13, 2025)

**Deployment Details**:
- **Platform**: Vercel
- **Production URL**: https://thoughtsandtime.vercel.app
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite (auto-detected)
- **Auto-Deploy**: Enabled on `main` branch push

**Environment Variables Configured**:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

**Supabase Configuration**:
- ✅ Site URL: `https://thoughtsandtime.vercel.app`
- ✅ Redirect URLs: `https://thoughtsandtime.vercel.app/**`
- ✅ Email confirmation: Enabled
- ✅ Authentication: Email/password with magic links

**Features Live**:
- ✅ Guest mode (localStorage only)
- ✅ Authenticated mode (Supabase sync)
- ✅ PWA installable on all devices
- ✅ Mobile responsive
- ✅ Offline capable

**Database Schema**:

```sql
-- Users (handled by Supabase Auth)
-- items table
create table items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  type text not null check (type in ('todo', 'event', 'routine', 'note')),
  content text not null,
  scheduled_time timestamptz,
  end_time timestamptz,
  recurrence_pattern text,
  parent_id uuid references items,
  parent_type text,
  depth_level integer default 0,
  order_index integer default 0,
  completed boolean default false,
  completion_date timestamptz,
  completion_link_id uuid references items,
  created_date timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row-level security
alter table items enable row level security;

create policy "Users can only access their own items"
  on items for all
  using (auth.uid() = user_id);

-- Indexes
create index items_user_id_idx on items(user_id);
create index items_scheduled_time_idx on items(scheduled_time);
create index items_parent_id_idx on items(parent_id);
create index items_type_idx on items(type);
```

**Files to Create/Modify**:

- `supabase/migrations/001_initial_schema.sql` (database schema)
- `supabase/migrations/002_rls_policies.sql` (security policies)
- `src/lib/supabase.ts` (Supabase client setup)
- `src/store/useAuthStore.ts` (authentication state)
- `src/store/useStore.ts` (add Supabase sync)
- `src/utils/sync.ts` (sync queue and conflict resolution)
- `src/utils/migration.ts` (localStorage → Supabase migration)
- `src/components/Auth/` (Login, Signup, ResetPassword components)
- `src/components/Settings.tsx` (add account settings, data export)
- `.env.example` (Supabase credentials template)

**Infrastructure Cost Projection**:
- Year 1 (0-500 users): **$0/month** (Supabase free tier)
- Year 2 (500-5K users): **$25/month** ($300/year)
- Year 3 (5K-50K users): **$99/month** ($1,188/year)

**User Pricing Tiers** (Hosted Service):
- 🆓 **Free Trial**: 1 week, no credit card required
- 💎 **Basic**: $1/month - Single user, 100MB storage, cross-device sync
- 🚀 **Pro**: $3/month - 1GB storage, priority support, advanced features
- 🏢 **Team**: $10/month - 5 users, 10GB storage, collaboration features *(Coming Soon)*

**Self-Hosted (PocketBase)**:
- 🆓 **Free Forever**: Unlimited users, unlimited storage (your infrastructure)

---

### Phase 2: PocketBase Self-Hosted Option

**Cost**: FREE (self-hosted) or $5-10/month (VPS)

**Why PocketBase:**
- Single binary deployment (perfect for self-hosting)
- Built-in authentication and admin UI
- SQLite database (lightweight, portable)
- Real-time subscriptions
- Matches minimalist philosophy
- Perfect for privacy-conscious users

**Implementation Steps**:

1. **PocketBase Setup** (Week 1)
   - [ ] Create PocketBase schema matching Supabase structure
   - [ ] Configure authentication
   - [ ] Set up file storage

2. **Backend Adapter Pattern** (Week 2)
   - [ ] Create `src/lib/backend-adapter.ts` interface
   - [ ] Implement `SupabaseAdapter` class
   - [ ] Implement `PocketBaseAdapter` class
   - [ ] Update stores to use adapter pattern

3. **Self-Hosted Deployment** (Week 3)
   - [ ] Create Dockerfile with PocketBase + app
   - [ ] Create docker-compose.yml
   - [ ] Add deployment scripts
   - [ ] Write SELF_HOSTING.md guide

4. **User Choice** (Week 3-4)
   - [ ] Add backend selection in Settings
   - [ ] Add "Connect to PocketBase" flow
   - [ ] Test migration between backends

**Files to Create**:

- `pocketbase/pb_schema.json` (PocketBase schema export)
- `src/lib/backend-adapter.ts` (adapter interface)
- `src/lib/pocketbase-adapter.ts` (PocketBase implementation)
- `src/lib/supabase-adapter.ts` (Supabase implementation)
- `Dockerfile` (includes PocketBase)
- `docker-compose.yml`
- `SELF_HOSTING.md` (complete self-hosting guide)

---

### Phase 3: Hybrid Architecture

**Backend Selection Flow**:

```
User opens app
  ├─> No account → localStorage only (current behavior)
  ├─> Cloud account → Supabase (hosted)
  └─> Self-hosted → PocketBase (user provides URL)
```

**Architecture**:

```typescript
// Backend adapter interface
interface BackendAdapter {
  auth: {
    signUp(email: string, password: string): Promise<User>
    signIn(email: string, password: string): Promise<User>
    signOut(): Promise<void>
    getCurrentUser(): User | null
  }
  items: {
    create(item: Item): Promise<Item>
    update(id: string, updates: Partial<Item>): Promise<Item>
    delete(id: string): Promise<void>
    getAll(userId: string): Promise<Item[]>
    subscribe(userId: string, callback: (items: Item[]) => void): () => void
  }
}

// Usage in store
const backend = useBackendAdapter() // Supabase or PocketBase
await backend.items.create(newItem)
```

**Benefits**:
- Casual users: Free Supabase tier
- Privacy users: Self-hosted PocketBase
- Same app, different backends
- No vendor lock-in
- Gradual migration path

---

#### 12. Mobile Responsive Optimizations

**Status**: Completed ✅ (December 6, 2025)

**Design & Documentation**: See `MOBILE_MOCKUPS.md` and `MOBILE_IMPLEMENTATION.md`

**Completed Features**:

- [x] Mobile mockups with footer-based navigation (thumb-zone optimized)
- [x] Footer shows active pane + inactive pane with directional arrows
- [x] Swipe gesture detection (left/right to switch panes)
- [x] Search/Settings buttons in bottom right
- [x] Single-pane view with smooth transitions
- [x] Bottom sheet for input (slides up from bottom, ~60% height)
- [x] FAB (Floating Action Button) for quick capture
- [x] Touch gesture detection with velocity thresholds
- [x] Mobile tap targets (44×44px minimum throughout)
- [x] Footer navigation with text labels and directional arrows
- [x] Virtual keyboard detection (hide footer when keyboard visible)
- [x] iOS Safari support (safe areas, viewport fixes)
- [x] Haptic feedback (Vibration API with graceful degradation)
- [x] Responsive breakpoints (mobile < 768px, tablet 768-1023px, desktop ≥ 1024px)
- [x] 109 comprehensive mobile tests (hooks + components)
- [x] 14 edge cases handled (keyboard conflicts, safe areas, accessibility, etc.)

**Mobile Hooks Created** (4):
- `src/hooks/useMobileLayout.ts` - Breakpoint detection
- `src/hooks/useSwipeGesture.ts` - Touch gesture detection
- `src/hooks/useHapticFeedback.ts` - Vibration API wrapper
- `src/hooks/useKeyboardDetection.ts` - Virtual keyboard detection

**Mobile Components Created** (3):
- `src/components/BottomSheet.tsx` - Slide-up modal with backdrop
- `src/components/FAB.tsx` - Floating action button
- `src/components/MobileFooter.tsx` - Bottom navigation

**Files Modified** (10):
- `src/App.tsx` - Mobile layout integration, swipe gestures
- `src/components/ThoughtsPane.tsx` - FAB + BottomSheet for mobile
- `src/components/TimePane.tsx` - Mobile height adjustments
- `src/components/DailyReview.tsx` - Mobile adaptations
- `src/store/useSettingsStore.ts` - Mobile pane state
- `src/constants/index.ts` - Mobile constants (breakpoints, sizes)
- `src/index.css` - Mobile styles and animations
- `tailwind.config.js` - Mobile breakpoints
- `README.md` - Mobile documentation section
- `MOBILE_IMPLEMENTATION.md` - Complete mobile guide (created)

**Test Coverage**:
- 37 hook tests (useMobileLayout, useHapticFeedback, useKeyboardDetection, useSwipeGesture)
- 72 component tests (FAB, MobileFooter, BottomSheet)
- All tests passing (429 total, 109 mobile-specific, 27 performance regression)

---

#### 13. Notifications System

**Status**: Completed ✅ (December 17, 2025)

**Implementation**:

- [x] Push notification setup with Push API
- [x] Service worker integration (via vite-plugin-pwa)
- [x] Notification permission request flow
- [x] Schedule notifications for events (5, 10, 15, 30, 60 minutes before)
- [x] Schedule notifications for routines (at scheduled time)
- [x] Notification settings UI with toggle and time selector
- [x] User preferences storage in useSettingsStore
- [x] Auto-scheduling when items created/updated
- [x] useNotifications hook for lifecycle management

**Features**:

- Browser-based notifications with graceful degradation
- Configurable event reminder times (5/10/15/30/60 minutes before)
- Routine reminders at scheduled time
- Permission request on first enable with user-friendly flow
- Settings toggles for enabling/disabling notifications
- Auto-cleanup of old scheduled notifications

**Files created**:

- `src/utils/notifications.ts` (notification utilities)
- `src/hooks/useNotifications.ts` (auto-scheduling hook)

**Files modified**:

- `src/store/useSettingsStore.ts` (added notification preferences)
- `src/components/Settings.tsx` (added notification UI - 78 lines)
- `src/App.tsx` (integrated useNotifications hook)

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

1. Mobile E2E tests (Playwright tests for mobile viewports)
2. Full accessibility audit (manual testing)
3. Multi-device sync testing in production

### Short Term (Next 2 Weeks)

1. URL link previews for notes
2. Performance monitoring and optimization
3. User feedback collection and analysis

### Medium Term (Next Month)

1. OAuth providers (Google, GitHub)
2. Password reset flow
3. Enhanced mobile experience refinements

### Long Term (Next Quarter)

1. Collaboration features (shared items, team workspaces)
2. Advanced search and filtering
3. Calendar integrations

---

## Design Decisions & Abandoned Features

### Abandoned Features

#### Drag & Drop / Drag-to-Reorder
**Decision**: Will NEVER be implemented in this app
**Reasoning**:
- Goes against the app's keyboard-first philosophy
- Daily Review + natural language parsing already provides intuitive rescheduling
- Drag & drop adds complexity without significant UX benefit for this use case
- Mobile implementation would be challenging and potentially confusing
- Items are intentionally ordered by creation date (oldest to newest) - manual reordering conflicts with this chronological flow
- Adds visual clutter with drag handles and hover states

**Current Approach**:
- Reschedule via Daily Review (edit and add new time)
- Edit items directly in timeline or thoughts pane
- Natural language parsing handles date/time updates elegantly
- Chronological ordering by creation date maintains simplicity

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

**What this means:**
- ✅ You can use, modify, and distribute this software (including commercially)
- ✅ If you run a modified version as a network service, you must make the source code available
- ✅ You must give appropriate credit to "Thoughts & Time by Sawt Dakhili"
- ↪️ Any modifications must also be licensed under AGPL-3.0
- 🔓 This is OSI-approved open source software

See the [LICENSE](LICENSE) and [NOTICE](NOTICE) files for full terms and attribution requirements.

**Copyright**: 2025 Sawt Dakhili

---

**Status Key**:

- ✅ Completed
- 🔴 High Priority
- 🟡 Medium Priority
- 🟢 Lower Priority
- ⚠️ Needs Attention
- 🚀 In Progress

---

## Recent Bug Fixes & Improvements (December 6, 2025)

### ✅ Floating Date Header Fix for Infinite Scroll

**Issue**: Sticky day headers were blocking content from previous days in infinite scroll mode due to CSS stacking context conflicts with virtualized absolute positioning.

**Solution**: Implemented floating header overlay pattern:
- Created `FloatingDateHeader` component that lives outside virtualized content
- Added RAF-throttled scroll tracking to detect visible date
- Converted sticky headers in virtualized rows to relative positioning (now act as visual separators only)
- Applied to both ThoughtsPane and TimePane

**Files Created:**
- `src/components/FloatingDateHeader.tsx`

**Files Modified:**
- `src/components/TimePane.tsx` - Added scroll tracking and floating header integration
- `src/components/ThoughtsPane.tsx` - Added scroll tracking and floating header integration
- `src/index.css` - Added `--z-floating-header: 30` z-index layer

**Performance Impact**: Zero - uses `requestAnimationFrame` for smooth 60fps updates with passive scroll listeners.

---

## Security & Performance Improvements (December 15, 2025)

### ✅ Completed Improvements

#### 1. Security Hardening

**Critical Security Vulnerabilities Fixed**:

- [x] **Circular Reference Protection** - Added visited Set tracking in `ItemDisplay.tsx` serializeItemWithChildren function to prevent infinite loops when serializing items with circular parent-child references
- [x] **File Import Validation** - Added comprehensive validation in `Settings.tsx`:
  - MIME type checking (JSON files only)
  - File size limit (5MB maximum to prevent DOS attacks)
  - Early validation before file reading
- [x] **Type Guards for Database Operations** - Added comprehensive runtime type validation in `syncService.ts`:
  - `isValidItemType()` validates item types from database
  - `isValidParentType()` validates parent type constraints per item type
  - Prevents database corruption from invalid type combinations
  - Replaced all unsafe `any` types with proper `RecurrencePattern` and `LinkPreview` interfaces

**Files Modified**:
- `src/components/ItemDisplay.tsx` - Circular reference protection
- `src/components/Settings.tsx` - File validation (type and size)
- `src/services/syncService.ts` - Type guards and proper interfaces

#### 2. Sync Reliability Improvements

**Critical Data Loss Prevention**:

- [x] **Sync Error Handling with Retry Logic** - Implemented exponential backoff retry in `useStore.ts`:
  - Automatically retries failed sync operations (create/update/delete)
  - Exponential backoff: 500ms, 1000ms delays between attempts
  - User-facing error toasts after all retries exhausted
  - Graceful degradation to localStorage when sync fails
  - "Data saved locally" messaging to inform users of offline state

**Files Modified**:
- `src/store/useStore.ts` - Added `handleSync()` wrapper with retry logic
- All sync operations now use retry wrapper for reliability

#### 3. Performance Optimizations

**Bundle Size Reduction** (65% improvement):

- [x] **Code Splitting with Manual Chunks** - Configured Vite rollup in `vite.config.ts`:
  - Main bundle reduced from 835KB to 294KB (65% reduction)
  - Vendor chunk: React, React-DOM, Zustand (core dependencies)
  - Date-utils chunk: date-fns, chrono-node (date parsing)
  - CodeMirror chunk: All @codemirror packages (editor)
  - Supabase chunk: @supabase/supabase-js (backend)
  - Virtual chunk: @tanstack/react-virtual (virtualization)
  - Chunk size warning limit increased to 600KB

**Search Performance** (O(n²) → O(n)):

- [x] **Map-Based Search Optimization** - Refactored `search.tsx`:
  - Replaced Array.find() O(n) lookups with Map.get() O(1) lookups
  - Created itemMap in all consuming components (ThoughtsPane, TimePane, DailyReview)
  - Memoized itemMap generation with useMemo for performance
  - Fixed React key generation (position-based instead of incrementing counter)
  - Updated all affected tests to use new Map-based API

**Component Re-render Optimization**:

- [x] **React.memo for Display Components** - Added memoization to frequently re-rendered components:
  - `ItemActions.tsx` - Wrapped with memo to prevent re-renders on parent updates
  - `FloatingDateHeader.tsx` - Wrapped with memo to prevent re-renders during scrolling
  - Both components now only re-render when their specific props change

**Files Modified**:
- `vite.config.ts` - Code splitting configuration
- `src/utils/search.tsx` - Map-based search optimization
- `src/components/ThoughtsPane.tsx` - itemMap generation
- `src/components/TimePane.tsx` - itemMap generation
- `src/components/DailyReview.tsx` - itemMap generation, useMemo import
- `src/components/ItemActions.tsx` - React.memo wrapper
- `src/components/FloatingDateHeader.tsx` - React.memo wrapper

**Files Created**:
- `src/utils/performance.test.ts` - Performance regression tests for search and algorithms
- `src/components/performance.test.tsx` - Performance regression tests for component memoization

#### 4. Type Safety Improvements

**Eliminated All Unsafe Type Casts**:

- [x] **Proper Interface Definitions** - Replaced all `any` types in `syncService.ts`:
  - Created `RecurrencePattern` interface with full type definition
  - Created `LinkPreview` interface for note URL previews
  - Removed all `as any` assertions
  - Added proper type guards for runtime validation

**Files Modified**:
- `src/services/syncService.ts` - Proper interfaces, removed unsafe casts

#### 5. Test Updates

**All Tests Passing** (402/402):

- [x] **Updated Tests for API Changes**:
  - `src/utils/search.test.tsx` - Updated to use Map-based API
  - `src/utils/itemFactory.test.ts` - Updated to expect 'guest' default userId
  - `src/components/HelpDrawer.test.tsx` - Fixed symbol expectations (with parentheses)
- [x] **100% Test Pass Rate** - All 402 tests passing with no warnings

**Build Results**:
```
dist/assets/index-BPiVyp0A.js   294.01 kB │ gzip: 88.13 kB
Test Files: 29 passed (29)
Tests: 429 passed (429)
```

**Performance Metrics**:
- Bundle size: 294KB (down from 835KB, 65% reduction)
- Gzipped: 88.13KB
- Search complexity: O(n) (down from O(n²))
- Test coverage: 100% pass rate (429/429)
- Performance regression tests: 27 tests covering bundle size, search complexity, component memoization

---

---

## Recent Sync Improvements (December 16, 2025)

### ✅ Optimistic Updates & Conflict Resolution

**Implementation**: Complete sync experience with instant UI feedback and multi-device conflict handling.

**Features Completed**:

1. **Optimistic Updates** - Instant UI feedback with background sync
   - Added SyncStatus type to BaseItem (pending/syncing/synced/error)
   - Sync status indicators in ItemDisplay (⏳ pending, 🔄 syncing, ⚠️ error)
   - Enhanced handleSync to track status throughout sync lifecycle
   - Items update immediately in UI, sync happens in background
   - Error states show in tooltip with error message

2. **Conflict Resolution** - Last-write-wins with user choice
   - Timestamp-based conflict detection using updatedAt comparison
   - ConflictError class with localItem and serverItem
   - fetchItemById function to get current server version
   - ConflictDialog component showing both versions side-by-side
   - User chooses: "Use Your Version" (force sync) or "Use Other Device Version" (apply server)
   - Integrated in handleSync to catch conflicts automatically

3. **Migration Tool** - localStorage to Supabase with progress tracking
   - migrateLocalDataToSupabase function with batch upload
   - getMigratableItemCount to check items with userId 'guest'
   - Migration UI in Settings modal (authenticated users only)
   - Real-time progress bar showing X of Y items migrated
   - Error handling with partial migration support (migrates what it can)
   - Success/failure statistics in toast notifications

**Files Created**:
- `src/components/ConflictDialog.tsx`
- `src/hooks/useConflict.ts`
- `src/utils/migration.ts`

**Files Modified**:
- `src/types.ts` - Added SyncStatus type and fields
- `src/store/useStore.ts` - Optimistic updates + conflict handling
- `src/services/syncService.ts` - Conflict detection + ConflictError
- `src/components/ItemDisplay.tsx` - Sync status indicator
- `src/components/Settings.tsx` - Migration UI
- `src/App.tsx` - ConflictDialog integration

**Commits**:
- `69a4e53` - Implement optimistic updates and conflict resolution
- `87a0ea5` - Add localStorage to Supabase migration tool

---

## Polish & UX Improvements (December 17, 2025)

### ✅ Completed Improvements

**Status**: Completed ✅

#### 1. Loading States for Auth Operations

- [x] Added isLoading state to auth store
- [x] Sign out button shows loading state with "Signing out..." text
- [x] Button disabled during sign out to prevent double-clicks
- [x] Improved UX with visual feedback for async operations

**Files Modified**:
- `src/components/UserMenu.tsx` - Loading state for sign out button

#### 2. Empty State Messages

- [x] **ThoughtsPane** - Welcoming empty state with quick start guide
  - Shows item type examples with prefix syntax
  - Friendly onboarding message for first-time users
  - Styled card with border and background
- [x] **TimePane** - Informative empty state explaining timeline
  - Explains what appears in timeline (scheduled todos, events, routines)
  - Notes that unscheduled items stay in Thoughts pane
  - Helps users understand the dual-pane concept

**Files Modified**:
- `src/components/ThoughtsPane.tsx` - Added empty state UI (25 lines)
- `src/components/TimePane.tsx` - Added empty state UI (22 lines)

#### 3. Production-Safe Logging

- [x] Created logger utility that no-ops in production
- [x] Replaced all console.log/error/warn with logger equivalents
- [x] Updated 6 critical files to use production-safe logging
- [x] Prevents debugging info from appearing in production builds
- [x] Development mode still shows full logs

**Files Created**:
- `src/utils/logger.ts` - Production-safe logging utility

**Files Modified**:
- `src/store/useAuthStore.ts` - 6 console replacements
- `src/services/syncService.ts` - 5 console replacements
- `src/store/useStore.ts` - 3 console replacements
- `src/components/AuthProvider.tsx` - 6 console replacements
- `src/components/UserMenu.tsx` - 2 console replacements
- `src/components/Settings.tsx` - 1 console replacement

**Impact**:
- **UX**: Better first-time user experience with welcoming empty states
- **Feedback**: Clear loading indicators for async operations
- **Production**: Clean console with no debug logs in production
- **Security**: Prevents accidental exposure of sensitive debugging info

---

Last updated: December 17, 2025

---

## Self-Hosted Version

**Status**: Completed ✅ (December 17, 2025)

### Overview

Complete self-hosting infrastructure for Thoughts & Time, giving users full control over their data and deployment.

### Implementation

**Docker Infrastructure**:

- [x] Multi-stage Dockerfile (Node build + Nginx production)
- [x] Docker Compose orchestration (9 services)
- [x] Full Supabase stack included (PostgreSQL, Auth, Real-time, Storage, REST API, Kong Gateway)
- [x] Environment variable configuration via .env
- [x] Production-ready Nginx configuration
- [x] Health checks for all services

**Services Deployed** (9 containers):

1. **app** - Thoughts & Time React frontend (Nginx)
2. **supabase-db** - PostgreSQL 15 database
3. **supabase-studio** - Admin UI (port 3001)
4. **supabase-auth** - GoTrue authentication service
5. **supabase-realtime** - WebSocket real-time subscriptions
6. **supabase-rest** - PostgREST API
7. **supabase-meta** - Database metadata service
8. **supabase-storage** - File storage service
9. **supabase-kong** - API Gateway (port 8000)

**Database & Security**:

- [x] PostgreSQL schema with Row-Level Security (RLS)
- [x] User authentication via Supabase Auth
- [x] Automated database initialization (init-db.sql)
- [x] Backup and restore scripts with retention policies
- [x] Kong API Gateway with CORS configuration

**Documentation**:

- [x] `SELF_HOSTING.md` - Complete 9.1KB guide with quick start, configuration, deployment options, troubleshooting, security checklist
- [x] Prerequisites and system requirements
- [x] Environment variable documentation (40+ variables)
- [x] Nginx reverse proxy examples with SSL
- [x] Backup/restore procedures with cron examples
- [x] Production security checklist
- [x] Architecture overview with service descriptions

### Files Created

**Docker Infrastructure**:
- `Dockerfile` - Multi-stage build (Node + Nginx)
- `docker-compose.yml` - 9-service orchestration (6.7KB)
- `.dockerignore` - Build optimization
- `nginx.conf` - Production web server config
- `.env.example` - Configuration template (2.7KB)

**Database & Scripts**:
- `scripts/init-db.sql` - Database schema with RLS (3.1KB)
- `scripts/kong.yml` - API Gateway routing (2.4KB)
- `scripts/backup.sh` - Automated backup with retention (1.9KB)
- `scripts/restore.sh` - Database restore utility (2.2KB)

**Documentation**:
- `SELF_HOSTING.md` - Complete self-hosting guide (9.1KB)

### Quick Start

```bash
git clone https://github.com/yourusername/thoughts-time.git
cd thoughts-time
cp .env.example .env
# Edit .env with your JWT_SECRET and POSTGRES_PASSWORD
docker-compose up -d
```

**Access**:
- Application: http://localhost:3000
- Supabase Studio: http://localhost:3001
- API Gateway: http://localhost:8000

### Architecture

**Stack**: Docker + Docker Compose + Full Supabase Stack
**Database**: PostgreSQL 15 with Row-Level Security
**Storage**: Docker volumes for persistence (supabase-db-data, supabase-storage-data)
**Backup**: Automated scripts with 30-day retention
**Deployment**: One-command deployment with `docker-compose up -d`

### Features

- ✅ One-command deployment
- ✅ Full Supabase stack (no external dependencies)
- ✅ Automated database initialization
- ✅ Row-Level Security for data isolation
- ✅ Automated backups with retention policies
- ✅ Production-ready Nginx configuration
- ✅ Health checks for all services
- ✅ Environment-based configuration
- ✅ Reverse proxy examples (Nginx with SSL)
- ✅ Complete troubleshooting guide
- ✅ Security hardening checklist

---
