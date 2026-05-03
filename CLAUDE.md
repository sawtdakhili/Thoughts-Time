# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Thoughts & Time** is a minimalist productivity app with a dual-pane interface for capturing thoughts and time-based planning. Built with React + TypeScript + Vite.

## Tech Stack

- **Frontend**: React 19 + TypeScript 5.9
- **Build**: Vite 7
- **Styling**: Tailwind CSS 3
- **State**: Zustand with localStorage persistence
- **Backend**: Supabase (PostgreSQL, authentication, real-time sync)
- **Date Parsing**: chrono-node (natural language), date-fns
- **Editor**: CodeMirror 6 (indentation, keymaps, symbol conversion)
- **Virtualization**: @tanstack/react-virtual
- **Testing**: Vitest (unit), Playwright (e2e)

## Directory Structure

```
src/
├── components/     # React components (TimePane, ThoughtsPane, ItemDisplay, BottomSheet, FAB, MobileFooter, AuthModal, AuthBanner, AuthProvider, UserMenu, etc.)
├── store/          # Zustand stores (useStore.ts, useHistory.ts, useSettingsStore.ts, useAuthStore.ts, itemHelpers.ts)
├── hooks/          # Custom hooks (useKeyboardShortcuts, useWheelNavigation, useFocusTrap, useMobileLayout, useSwipeGesture, useHapticFeedback, useKeyboardDetection, useNotifications, etc.)
├── utils/          # Utilities (parser.ts, formatting.ts, itemFactory.ts, search.tsx, notifications.ts, logger.ts, migration.ts)
├── services/       # Services (syncService.ts - Supabase data sync)
├── lib/            # External integrations (supabase.ts - Supabase client)
├── constants/      # App constants (including mobile breakpoints and sizes)
├── test/           # Test setup
├── types.ts        # TypeScript type definitions
├── env.d.ts        # Environment variable types
├── App.tsx         # Root component
└── main.tsx        # Entry point
e2e/                # Playwright end-to-end tests
scripts/            # Deployment scripts (backup.sh, restore.sh, init-db.sql, kong.yml)
.env.local          # Environment variables (Supabase credentials)
.env.example        # Environment template for self-hosting
docker-compose.yml  # Self-hosting stack with Supabase
Dockerfile          # Production container build
nginx.conf          # Production web server config
SELF_HOSTING.md     # Complete self-hosting guide
```

## Key Concepts

### Item Types

- **Todo** (`t` prefix): Tasks with optional scheduled time, can have children (todos, notes)
- **Event** (`e` prefix): Time-bound with start/end times, can have children (todos, notes)
- **Routine** (`r` prefix): Recurring items with recurrence patterns, can have children (notes)
- **Note** (`n` prefix or no prefix): Thoughts/ideas, can contain any item type as children

### Data Model

- All items extend `BaseItem` with id, userId, type, content, dates
- Items support nesting with `parentId`, `parentType`, `depthLevel`
- All item types use unified `children` field for sub-items
- Max depth: 2 levels for all item types
- Items stored in flat array, relationships via IDs

### State Management

- `useStore` (src/store/useStore.ts): Main app state with items CRUD
- `useHistory` (src/store/useHistory.ts): Undo/redo functionality
- `useSettingsStore`: Theme, view mode, time format, and notification preferences
- `useAuthStore` (src/store/useAuthStore.ts): Authentication state (user, session, sign in/out)
- All stores use Zustand persist middleware for localStorage

### Authentication System

- **Dual Mode**: Guest mode (localStorage only) or Authenticated (syncs to Supabase)
- **Email/Password**: Sign up, sign in, sign out flows
- **Session Management**: Supabase handles JWT tokens and session persistence
- **Data Sync**: Items sync to Supabase when authenticated, stay local in guest mode
- **User ID Strategy**: All items use 'guest' as default userId, transformed during sync
- **Loading States**: All auth operations show loading indicators and disable buttons
- **Storage Keys**:
  - Supabase session: `thoughts-time-auth` (localStorage)
  - Auth mode: `thoughts-time-auth-mode` (Zustand persist)

### Notifications System

- **Browser Notifications**: Push API integration with Service Worker support
- **Permission Handling**: Request permission on first enable with user-friendly flow
- **Event Reminders**: Configurable notifications (5/10/15/30/60 minutes before events)
- **Routine Reminders**: Notifications at scheduled routine times
- **Auto-Scheduling**: Notifications automatically scheduled when items are created/updated
- **Settings UI**: Toggle switches and time selector in Settings modal
- **Smart Filtering**: Only schedules for future times, skips past items
- **Graceful Degradation**: Fallback to regular browser notifications if Service Worker unavailable
- **Files**:
  - `src/utils/notifications.ts` - Permission, scheduling, display logic
  - `src/hooks/useNotifications.ts` - Auto-scheduling hook
  - Settings store includes: `notificationsEnabled`, `eventReminderMinutes`, `routineReminderEnabled`

## Development Commands

```bash
# Development
npm run dev          # Start dev server (localhost:5173)

# Build
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests with Vitest
npm run test:ui      # Vitest with UI
npm run test:coverage # Test coverage report
npm run test:e2e     # Playwright end-to-end tests
npm run test:e2e:ui  # Playwright with UI
npm run test:e2e:headed # Playwright in headed mode

# Linting & Formatting
npm run lint         # ESLint
npm run format       # Prettier (auto-fix)
npm run format:check # Prettier (check only, used in CI)
```

> Husky pre-commit hook runs lint-staged automatically on every commit (lint + format check).

## Keyboard Shortcuts

**Global** (disabled when any input/textarea/contentEditable is focused):

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + F | Open search |
| Escape | Close open modal / dialog / search |
| Cmd/Ctrl + Z | Undo |
| Cmd/Ctrl + Shift + Z | Redo |

**In the input textarea / SymbolEditor:**

| Key | Behavior |
|-----|----------|
| Enter | Submit (create items) |
| Shift + Enter | New line (no submit) |
| Tab | Indent (cycles 0 → 1 → 2 → 0, enforces hierarchy rules) |
| Shift + Tab | Outdent (removes one level) |
| Backspace (after symbol) | Reverts `□ ` back to `t ` |

**In edit mode (ItemEditor / SymbolEditor):**

| Key | Behavior |
|-----|----------|
| Enter | Save edit |
| Escape | Cancel edit |

## Key Constants

All defined in `src/constants/index.ts`:

```
Limits:    MAX_TODO_DEPTH=1, MAX_NOTE_DEPTH=2, MAX_HISTORY_ACTIONS=20
Animation: PAGE_FLIP_DURATION=600ms, TOAST_DURATION=3000ms, SEARCH_DEBOUNCE=300ms
           WHEEL_DELTA_THRESHOLD=150px, SCROLL_RESET_DELAY=50ms
Dates:     DATE_RANGE past/future = 30 days (pre-lazy-load default)
Lazy:      initial 7 days past + 7 future, chunk size 7, max 90 each direction
Mobile:    BREAKPOINT=768px, FOOTER_HEIGHT=60px, FAB_SIZE=56px
           MIN_TOUCH_TARGET=44px, SWIPE_THRESHOLD=50px
           SWIPE_VELOCITY_THRESHOLD=0.3px/ms, BOTTOM_SHEET_DURATION=300ms
           KEYBOARD_HEIGHT_THRESHOLD=150px
```

## Design System

**Typography:**
- Content (items, input): Crimson Text → Lora → Georgia → serif, 18px, 1.7 line-height
- Metadata (times, IDs): Courier Prime → Courier New → monospace

**Colors (dark theme):**
- Background: `#0a0a0a`
- Text primary: `#f5f5f5`
- Text secondary: `#6a6a6a`
- Border subtle: `#1a1a1a`
- Hover bg: `#0f0f0f`

**Spacing:** 8px base grid (6 / 12 / 16 / 24 / 32 / 48 / 64px steps)

## Code Conventions

### Component Patterns

- Functional components with hooks
- Props interfaces defined inline or in types.ts
- Event handlers prefixed with `handle` (e.g., `handleSubmit`)
- Tailwind classes for styling, inline in JSX

### File Naming

- Components: PascalCase (`ItemDisplay.tsx`)
- Utilities: camelCase (`parser.ts`)
- Tests: Same name with `.test.ts(x)` suffix

### State Updates

- Use store actions for state changes
- `skipHistory` flag prevents recording during undo/redo
- Record history before mutations for proper undo

### Input Parsing

- `parseInput()` in `src/utils/parser.ts` handles natural language
- `parseMultiLine()` for multi-line input with Tab-based hierarchy
- Prefix detection: `t `, `e `, `r `, `n `
- Tab after prefix indicates nesting level
- Time parsing via chrono-node

## Demo Data

`public/populate-harry-console.js` — paste into browser console while the app is open to wipe all data and load a full Disco Elysium (Harry Du Bois) sample dataset. Useful for testing UI with realistic content. Not imported anywhere; purely a manual dev tool.

Screenshots in the repo root (`screenshot.png`, `screenshot-mobile-thoughts-updated.png`, `screenshot-mobile-time-updated.png`) are used in `README.md`.

## Testing Guidelines

### Unit Tests (Vitest)

- Located alongside source files (`*.test.ts`)
- Use `@testing-library/react` for component tests
- Setup in `src/test/setup.ts`

### E2E Tests (Playwright)

- Located in `e2e/` directory
- Config in `playwright.config.ts`
- Test user flows and interactions

## Important Files to Know

- `src/types.ts` - All TypeScript interfaces (includes SyncStatus)
- `src/store/useStore.ts` - Core state management with optimistic updates and conflict handling
- `src/store/useHistory.ts` - Undo/redo history management
- `src/store/useAuthStore.ts` - Authentication state management
- `src/store/itemHelpers.ts` - Validation and tree operations helpers
- `src/lib/supabase.ts` - Supabase client initialization
- `src/services/syncService.ts` - Data sync to Supabase with conflict detection, type guards, and validation
- `src/utils/migration.ts` - localStorage to Supabase migration utility
- `vite.config.ts` - Build configuration with code splitting optimization
- `src/utils/parser.ts` - Input parsing logic
- `src/components/ThoughtsPane.tsx` - Left pane (thoughts)
- `src/components/TimePane.tsx` - Right pane (timeline)
- `src/components/FloatingDateHeader.tsx` - Floating date header for infinite scroll mode (memoized)
- `src/components/ItemDisplay.tsx` - Item rendering with circular reference protection and sync status indicator
- `src/components/ItemEditor.tsx` - Item edit mode (uses SymbolEditor)
- `src/components/ItemActions.tsx` - Edit/delete/jump buttons (memoized)
- `src/components/SymbolEditor.tsx` - CodeMirror 6 editor with Tab/indentation
- `src/components/ConflictDialog.tsx` - Sync conflict resolution UI
- `src/components/PaneErrorBoundary.tsx` - Error isolation for panes
- `src/components/AuthProvider.tsx` - Auth state listener (wraps app)
- `src/components/AuthModal.tsx` - Sign in/up modal
- `src/components/AuthBanner.tsx` - Guest mode banner
- `src/components/UserMenu.tsx` - User dropdown menu
- `src/components/HelpDrawer.tsx` - Interactive help drawer with input prefix reference
- `src/hooks/useConflict.ts` - Conflict dialog state management
- `src/hooks/useWheelNavigation.ts` - Shared wheel navigation for book mode
- `src/hooks/useFocusTrap.ts` - Focus trap for modals
- `src/components/BottomSheet.tsx` - Mobile bottom sheet modal
- `src/components/FAB.tsx` - Floating action button
- `src/components/MobileFooter.tsx` - Mobile bottom navigation
- `src/hooks/useMobileLayout.ts` - Mobile breakpoint detection
- `src/hooks/useSwipeGesture.ts` - Touch gesture detection
- `src/hooks/useHapticFeedback.ts` - Vibration API wrapper
- `src/hooks/useKeyboardDetection.ts` - Virtual keyboard detection

## Common Tasks

### Adding a New Item Type

1. Add type to `ItemType` union in `types.ts`
2. Create interface extending `BaseItem`
3. Update `parseInput()` for prefix detection
4. Add case in `useStore.addItem()` switch
5. Update `ItemDisplay.tsx` for rendering

### Modifying Store Logic

1. Update interface in store file
2. Implement action with history recording
3. Test undo/redo behavior
4. Add unit tests

### Adding UI Components

1. Create component in `src/components/`
2. Use Tailwind for styling
3. Connect to store via hooks
4. Add tests if complex logic

## Data Storage

- **Guest Mode**: All data persisted to localStorage under key `thoughts-time-storage`
- **Authenticated Mode**: Data syncs to Supabase PostgreSQL database
- **Auth Session**: Stored in localStorage under key `thoughts-time-auth` (Supabase)
- **Auth Mode**: Stored in localStorage under key `thoughts-time-auth-mode` (Zustand)
- **Settings**: Stored separately in `thoughts-time-settings`
- **Dual Operation**: App works offline (localStorage) and online (Supabase sync)

## Production Deployment

### Hosted Version (Vercel)

- **Platform**: Vercel
- **Live URL**: https://thoughtsandtime.vercel.app
- **Auto-Deploy**: Enabled on push to `main` branch
- **Environment**: Production environment variables configured on Vercel
- **Build**: Automatic via Vercel (detects Vite, runs `npm run build`)
- **Supabase**: Connected with redirect URLs and email confirmation enabled

### Self-Hosting (Docker)

- **Guide**: See `SELF_HOSTING.md` for complete documentation
- **Stack**: Docker + Docker Compose + Full Supabase Stack
- **Services**: 9 containerized services (app, database, auth, realtime, storage, API gateway, etc.)
- **Requirements**: Docker 20.10+, 2GB RAM, 10GB disk space
- **Deployment**: One-command setup (`docker-compose up -d`)
- **Features**:
  - Complete Supabase infrastructure (PostgreSQL, GoTrue, PostgREST, Realtime, Storage, Kong)
  - Automated backups with retention policies (`./scripts/backup.sh`)
  - Easy restore (`./scripts/restore.sh`)
  - Production-ready Nginx configuration with security headers
  - Row-Level Security (RLS) policies on database
  - Health checks on all services
  - Volume persistence for data and storage
  - SMTP support for email confirmations
  - SSL/TLS ready (use with reverse proxy)
- **Quick Start**:
  ```bash
  cp .env.example .env
  # Edit .env with your configuration
  docker-compose up -d
  # Access at http://localhost:3000
  ```

## Input Syntax Reference

**Prefixes** (space after prefix is required):

| Type | Prefix | Example |
|------|--------|---------|
| Todo | `t ` | `t buy groceries tomorrow 3pm` |
| Event | `e ` | `e team standup 9-10am` |
| Routine | `r ` | `r morning jog at 6am daily` |
| Note | `n ` | `n random thought` |

**Multi-line hierarchy** (Tab = one nesting level, max 2 levels):
```
t parent todo
t [tab]child todo
n [tab][tab]grandchild note
```
First line cannot be indented; cannot skip levels.

**Time formats:**
- Natural language: `tomorrow 3pm`, `next Monday at 2:30`, `Friday afternoon`
- 24-hour explicit: `at 13:55` (strict `at HH:MM` pattern required)
- Relative: `in 30 minutes`, `in 2 hours` (also: min/mins/hr/hrs)
- Range (events): `between 2pm and 4pm`, `from 10am to 12pm`

**Recurrence patterns** (for `r ` prefix):
- `daily` / `every day`
- `every N days` (e.g. `every 3 days`)
- `every Monday` (any day name)
- `every other Monday` (bi-weekly)
- `weekday` / `every weekday` → Mon–Fri
- `weekend` / `every weekend` → Sat–Sun
- `first Monday of each month`, `second Tuesday of the month`, etc. (ordinals: first/second/third/fourth/fifth/last)
- `15th of each month` / `on the 15th`
- `last day of the month`
- `every N weeks`
- `every N months`

**`needsTimePrompt` triggers:** Events and todos that have no date OR no specific time (suppressed if `at HH:MM` is detected).

## Symbol Reference

| Symbol | Unicode | Prefix | Meaning |
|--------|---------|--------|---------|
| □ | U+25A1 | `t` | Todo (unchecked) |
| ☑ | U+2611 | `t` | Todo (checked/complete) |
| ↹ | U+21B9 | `e` | Event |
| ⇤ | U+21E4 | — | Event start (split mode) |
| ⇥ | U+21E5 | — | Event end (split mode, opacity-60) |
| ↻ | U+21BB | `r` | Routine |
| ↝ | U+219D | `n` | Note |
| ■ | U+25A0 | — | Daily Review header |
| ↸ | U+21B8 | — | Jump to Source action |

Symbol conversion is real-time: typing `t ` + space in the input auto-converts to `□ `. Backspace at position 2 reverts symbol back to prefix.

## View Modes

- **Infinite Scroll**: All days visible, continuous scrolling
- **Book Style**: One day per page, flip animation

## PWA Implementation

The app is a Progressive Web App (PWA) that can be installed on devices:

- **Plugin**: vite-plugin-pwa with Workbox for service worker generation
- **Manifest**: Configured for installability on all platforms (Chrome/Edge, Android, iOS)
- **Icons**: 192px, 512px, maskable icons, Apple touch icon, and favicon
- **Caching Strategy**:
  - CacheFirst for static assets (JS, CSS, images, fonts)
  - NetworkFirst for HTML (ensures latest version when online)
  - Google Fonts cached with 1-year expiration
- **Auto-update**: Service worker auto-updates without user prompts
- **Dev mode enabled**: PWA features testable in development (devOptions.enabled: true)
- **Offline support**: App fully functional offline (localStorage + cached UI)
- **Theme color**: #0A0A0A (matches dark theme)
- **Display mode**: Standalone (no browser UI when installed)

## Mobile Implementation

The app is fully responsive with a complete mobile implementation (< 768px):

- **Single-pane view** - One pane at a time (Thoughts or Time)
- **Swipe gestures** - Swipe left/right to switch between panes
- **Bottom sheet input** - Slides up from bottom (~60% height) for adding items
- **FAB** - Floating action button (56x56px) for quick capture
- **Mobile footer** - Bottom navigation with pane switcher and action buttons
- **Touch targets** - 44×44px minimum for all interactive elements
- **Haptic feedback** - Vibration API for tactile responses (gracefully degrades)
- **Keyboard detection** - Footer hides when virtual keyboard appears
- **iOS safe areas** - Proper padding for notch and home indicator

See `MOBILE_IMPLEMENTATION.md` for complete mobile documentation.

## Dual-Pane Layout

### ThoughtsPane (Left)
- Input box at bottom for creating new items
- Shows all items (todos, events, routines, notes) with full details
- Displays complete parent-child hierarchy (todos and notes)

### TimePane (Right)
- Timeline view showing scheduled items by date/time
- Shows todos with scheduled times and events
- **Subtasks display**: Only todo subtasks appear under parent todos (notes filtered out)
- Subtasks inherit parent's time/date (no independent scheduling)
- Daily Review at top shows incomplete todos from past days (parent only, no children)

**Event split logic** — events render as one of three variants:
- `event-single` (↹): event has no overlapping scheduled todos within its time window
- `event-start` (⇤): event contains scheduled todos in its timeframe — shows start marker with full controls
- `event-end` (⇥): paired end marker, opacity-60, no edit/delete buttons

## Notes for AI Assistants

1. **Always run tests** after making changes: `npm run test` and `npm run build`
2. **Check types** - project uses strict TypeScript
3. **Preserve undo/redo** - ensure history recording for state changes
4. **Natural language parsing** - chrono-node handles date/time extraction
5. **Parent-child relationships** - maintain consistency when modifying items
6. **localStorage persistence** - changes auto-persist via Zustand middleware
7. **Error boundaries** - Each pane has its own error boundary for isolation
8. **Accessibility** - App includes skip navigation link and ARIA labels
9. **Production logging** - Use `logger` utility from `src/utils/logger.ts`, NOT console.log (logs are no-ops in production)
10. **Empty states** - ThoughtsPane and TimePane show welcoming onboarding messages when `items.length === 0`
11. **Loading states** - All auth operations (sign in/up/out) show loading indicators and disable buttons during async operations
12. **Notifications** - Browser notifications for events/routines, auto-scheduled via `useNotifications` hook, configurable in Settings
13. **Self-hosting** - Complete Docker setup available, see `SELF_HOSTING.md` and `docker-compose.yml`
14. **Drag-to-reorder** - Will NEVER be implemented (see ROADMAP.md), app uses chronological ordering by creation date
15. **Test coverage** - 429 tests total: 403 passing, 26 currently failing. Failures are in `useStore` (deleteItem, toggleTodoComplete) and `ItemDisplay` rendering — caused by Supabase auth client calling `storage.getItem` during test init in Happy DOM, not actual logic bugs
16. **TimePane subtasks** - Only todo children appear in timeline (notes filtered out)
17. **Daily Review filtering** - Excludes todos already scheduled for today/future to prevent duplication
18. **Reference date parsing** - Reschedule actions use today as reference (not original date)
19. **Mobile responsive** - Complete mobile implementation with swipe gestures, bottom sheet, FAB, and footer navigation
20. **Touch-optimized** - 44×44px minimum touch targets, haptic feedback, keyboard detection
21. **Authentication system** - Dual mode (guest/authenticated), email/password sign in/up, Supabase backend
22. **Storage key separation** - Supabase uses `thoughts-time-auth`, Zustand uses `thoughts-time-auth-mode` (CRITICAL: different keys to avoid conflicts)
23. **Rules of Hooks** - NEVER put early returns before hooks (caused "rendered more hooks" crash in UserMenu)
24. **Direct state selection** - In auth components, use `useAuthStore((state) => state.mode)` NOT `isGuest()` functions (prevents re-render loops)
25. **User ID strategy** - All items default to `userId: 'guest'`, transformed to actual userId only during Supabase sync
26. **Environment variables** - Supabase credentials in `.env.local` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
27. **Production deployment** - App is live at https://thoughtsandtime.vercel.app, auto-deploys from `main` branch
28. **Email confirmation** - Enabled in Supabase for new user signups
29. **Security hardening** - Circular reference protection, file import validation (type + size), comprehensive type guards for database operations
30. **Sync reliability** - Exponential backoff retry logic with user-facing error toasts, graceful degradation to localStorage
31. **Performance optimizations** - Code splitting (835KB → 294KB bundle), search optimization (O(n²) → O(n) with Map-based lookups), React.memo for frequently re-rendered components
32. **Bundle size** - Main bundle reduced 65% through manual chunk configuration (vendor, date-utils, codemirror, supabase, virtual)
33. **Optimistic updates** - Items show instant UI feedback with sync status indicators (⏳ pending, 🔄 syncing, ⚠️ error)
34. **Conflict resolution** - Timestamp-based last-write-wins with user-facing conflict dialog when editing on multiple devices
35. **Data migration** - One-click localStorage to Supabase migration tool with progress tracking for guest → authenticated transitions

## Database Column Mapping

Supabase uses snake_case. Non-obvious camelCase → snake_case mappings:

| App field | DB column | Notes |
|-----------|-----------|-------|
| `scheduledTime` | `scheduled_time` | |
| `hasTime` | `has_time` | |
| `parentId` / `parentType` | `parent_id` / `parent_type` | |
| `depthLevel` | `depth_level` | |
| `startTime` / `endTime` | `start_time` / `end_time` | |
| `isAllDay` | `is_all_day` | |
| `splitStartId` / `splitEndId` | `split_start_id` / `split_end_id` | |
| `recurrencePattern` | `recurrence_pattern` | stored as JSON |
| `scheduledTime` (routine) | `routine_scheduled_time` | stored as `HH:mm` string, NOT ISO |
| `linkPreviews` | `link_previews` | stored as JSON array |
| `embeddedItems` | `embedded_items` | stored as JSON array |
| `completionLinkId` | `completion_link_id` | |
| `lastCompleted` | `last_completed` | ISO string in DB |
| `children` | `children` | stored as JSON array, defaults to `[]` |

All timestamps except `routine_scheduled_time` are ISO strings in DB, converted to `Date` on load.

## Vite Bundle Chunks

Manual chunk split (65% size reduction: 835KB → 294KB, gzipped 88KB):

| Chunk | Contents |
|-------|----------|
| `vendor` | react, react-dom, zustand |
| `date-utils` | date-fns, chrono-node |
| `codemirror` | all `@codemirror/*` packages |
| `supabase` | @supabase/supabase-js |
| `virtual` | @tanstack/react-virtual |

## Roadmap (What's Next)

Planned but not yet implemented (see `ROADMAP.md` for full detail):
- 🟡 URL link previews for Notes
- 🟢 PocketBase as alternative self-hosted backend (Phase 2)
- 🟢 OAuth providers (Google, GitHub)
- 🟢 Collaboration / team workspaces

**Confirmed will NEVER be added:** drag-to-reorder (app uses chronological ordering by creation date, by design).

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. This is OSI-approved open source software that allows commercial use, but requires sharing source code if run as a network service, maintaining attribution, and licensing modifications under AGPL-3.0. Copyright 2025 Sawt Dakhili. See LICENSE and NOTICE files for details.
