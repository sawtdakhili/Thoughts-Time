# CLAUDE.md - AI Assistant Guide for Thoughts & Time

## Project Overview

**Thoughts & Time** is a minimalist productivity app with a dual-pane interface for capturing thoughts and time-based planning. Built with React + TypeScript + Vite.

## Tech Stack

- **Frontend**: React 19 + TypeScript 5.9
- **Build**: Vite 7
- **Styling**: Tailwind CSS 3
- **State**: Zustand with localStorage persistence
- **Date Parsing**: chrono-node (natural language), date-fns
- **Editor**: CodeMirror 6 (indentation, keymaps, symbol conversion)
- **Virtualization**: @tanstack/react-virtual
- **Testing**: Vitest (unit), Playwright (e2e)

## Directory Structure

```
src/
├── components/     # React components (TimePane, ThoughtsPane, ItemDisplay, BottomSheet, FAB, MobileFooter, etc.)
├── store/          # Zustand stores (useStore.ts, useHistory.ts, useSettingsStore.ts, itemHelpers.ts)
├── hooks/          # Custom hooks (useKeyboardShortcuts, useWheelNavigation, useFocusTrap, useMobileLayout, useSwipeGesture, useHapticFeedback, useKeyboardDetection, etc.)
├── utils/          # Utilities (parser.ts, formatting.ts, itemFactory.ts, search.tsx)
├── constants/      # App constants (including mobile breakpoints and sizes)
├── test/           # Test setup
├── types.ts        # TypeScript type definitions
├── App.tsx         # Root component
└── main.tsx        # Entry point
e2e/                # Playwright end-to-end tests
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
- `useSettingsStore`: Theme and view mode preferences
- All stores use Zustand persist middleware for localStorage

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

# Linting
npm run lint         # ESLint
```

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

- `src/types.ts` - All TypeScript interfaces
- `src/store/useStore.ts` - Core state management
- `src/store/useHistory.ts` - Undo/redo history management
- `src/store/itemHelpers.ts` - Validation and tree operations helpers
- `src/utils/parser.ts` - Input parsing logic
- `src/components/ThoughtsPane.tsx` - Left pane (thoughts)
- `src/components/TimePane.tsx` - Right pane (timeline)
- `src/components/FloatingDateHeader.tsx` - Floating date header for infinite scroll mode
- `src/components/ItemDisplay.tsx` - Item rendering
- `src/components/ItemEditor.tsx` - Item edit mode (uses SymbolEditor)
- `src/components/SymbolEditor.tsx` - CodeMirror 6 editor with Tab/indentation
- `src/components/PaneErrorBoundary.tsx` - Error isolation for panes
- `src/hooks/useWheelNavigation.ts` - Shared wheel navigation for book mode
- `src/hooks/useFocusTrap.ts` - Focus trap for modals
- `src/components/BottomSheet.tsx` - Mobile bottom sheet modal
- `src/components/FAB.tsx` - Mobile floating action button
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

- All data persisted to localStorage under key `thoughts-time-storage`
- No backend/server - fully client-side
- Settings stored separately in `thoughts-time-settings`

## View Modes

- **Infinite Scroll**: All days visible, continuous scrolling
- **Book Style**: One day per page, flip animation

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

## Notes for AI Assistants

1. **Always run tests** after making changes: `npm run test` and `npm run build`
2. **Check types** - project uses strict TypeScript
3. **Preserve undo/redo** - ensure history recording for state changes
4. **Natural language parsing** - chrono-node handles date/time extraction
5. **Parent-child relationships** - maintain consistency when modifying items
6. **localStorage persistence** - changes auto-persist via Zustand middleware
7. **Error boundaries** - Each pane has its own error boundary for isolation
8. **Accessibility** - App includes skip navigation link and ARIA labels
9. **Test coverage** - 388 tests covering stores, hooks, and components (109 mobile-specific)
10. **TimePane subtasks** - Only todo children appear in timeline (notes filtered out)
11. **Daily Review filtering** - Excludes todos already scheduled for today/future to prevent duplication
12. **Reference date parsing** - Reschedule actions use today as reference (not original date)
13. **Mobile responsive** - Complete mobile implementation with swipe gestures, bottom sheet, FAB, and footer navigation
14. **Touch-optimized** - 44×44px minimum touch targets, haptic feedback, keyboard detection

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)**. This means you can use, modify, and share the project with attribution, but cannot use it commercially, and derivatives must use the same license. Copyright 2025 Sawt Dakhili. See LICENSE and NOTICE files for details.
