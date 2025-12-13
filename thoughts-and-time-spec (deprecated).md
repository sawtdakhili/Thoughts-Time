**END OF SPECIFICATION**

**Version:** 1.4  
**Pages:** ~100  
**Last Updated:** October 14, 2025  
**App Name:** Thoughts & Time

**Key Changes in v1.4:**
- **Novel/book-inspired typography:** Changed from sans-serif to serif fonts (Crimson Text, Lora, Georgia)
- **Literary aesthetic:** Larger text (18px), generous line height (1.7), book-like margins (48px)
- **Monospace for metadata:** "Courier Prime" for timestamps and technical elements
- **Increased spacing:** More generous spacing between items (32px) for comfortable reading
- **Square corners:** No border-radius for clean, literary look
- **Deeper indentation:** 32px per level (vs 24px) for better visual hierarchy
- **Wider line length limits:** Max 1200px content width for optimal readability
- **Enhanced symbols:** 18px size (up from 16px) to match larger body text
- **Book-like margins:** 48px desktop margins create open book feel

**Design Philosophy:**
The app should feel like writing in a beautiful journal or reading a thoughtfully composed novel. The serif typography, generous spacing, and literary proportions create a calm, focused environment that encourages deep thinking and careful composition.

**Why This Matters:**
Most productivity apps use utilitarian sans-serif fonts and tight spacing. By adopting a book-like aesthetic, Thoughts & Time differentiates itself and creates a more contemplative, permanent-feeling experience. Your thoughts deserve to look as important as the pages of a book.

**Two Hierarchy Systems:**
1. **Todo Subtasks:** Parent todo → child todos (max 1 level), no prefixes, checking parent checks children
2. **Note Sub-Items (Org Mode):** Parent note → any type via prefixes (max 2 levels), independent items, maximum flexibility

This document contains everything needed to build Thoughts & Time. All features, behaviors, edge cases, and technical requirements are specified. Ready for development with Claude Code or any development team.### Recommended Tech Stack

```
Frontend:
- Framework: React 18+ with TypeScript
- Build: Vite
- Styling: Tailwind CSS
- State: Zustand or Jotai (lightweight)
- Data: TanStack Query v5
- Routing: React Router v6
- Drag: @dnd-kit/core
- Rich Text: Draft.js or Slate.js (for bullet points in notes)

Backend:
- Database: Supabase (PostgreSQL + Auth + Realtime)
- Alternative: Custom Node.js/Bun + PostgreSQL + Redis
- Storage: Supabase Storage (for file uploads)
- Functions: Supabase Edge Functions

Infrastructure:
- Web Hosting: Vercel
- Database: Supabase (hosted PostgreSQL)
- CDN: Cloudflare (link preview caching)
- Monitoring: Sentry (error tracking)
```# Thoughts & Time - Complete Development Specification

**Version:** 1.1  
**Last Updated:** October 14, 2025  
**Document Purpose:** Full technical specification for development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Information Architecture](#information-architecture)
4. [Visual Design System](#visual-design-system)
5. [Data Model](#data-model)
6. [Feature Specifications](#feature-specifications)
7. [User Interactions](#user-interactions)
8. [Edge Cases & Business Rules](#edge-cases--business-rules)
9. [Technical Architecture](#technical-architecture)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Testing Requirements](#testing-requirements)

---

## Executive Summary

### What This Is

Thoughts & Time is a timeline-first productivity app that organizes life chronologically. Users capture everything in one place (notes, todos, events, routines) and the app intelligently surfaces what needs attention.

### Core Innovation

**Timeline as Primary Interface:** Unlike traditional task managers, this app treats time as the organizing principle. Your life IS a timeline - some things have specific times attached, others don't. The app handles both seamlessly.

**App Name:** Thoughts & Time
- **Thoughts pane** (left) = capture area
- **Time pane** (right) = timeline of scheduled items

### Key User Workflows

1. **Quick Capture:** Type anything instantly without categorizing
2. **Daily Review:** Each morning, deal with unfinished items (schedule, complete, or cancel)
3. **Timeline View:** See your day/week laid out chronologically
4. **Drag to Schedule:** Move items from capture area to timeline

### Target Platforms

- **Phase 1:** Web (desktop + mobile responsive)
- **Phase 2:** Native mobile apps (iOS + Android)

---

## Product Vision

### Philosophy

**"Your life is a timeline. Organize it that way."**

Most productivity apps force you to think in projects, contexts, or categories. Thoughts & Times embraces chronology as the natural way humans experience and remember their lives.

### Core Principles

1. **Capture First, Organize Later:** Never interrupt thought to categorize
2. **Forced Intentionality:** Unfinished items resurface daily until dealt with
3. **Timeline Primacy:** Time-bound items get prominence, timeless items stay accessible
4. **Minimal Friction:** Dark, clean interface with no visual clutter
5. **No Information Loss:** Everything stays in its original journal day

### What Makes This Different

**Unlike Todoist/Things:** Not project-based, timeline-based
**Unlike Calendar Apps:** Captures thoughts/notes, not just events
**Unlike Notion:** Structured for chronology, not hierarchy
**Unlike Bullet Journal:** Digital with smart resurfacing and scheduling

---

## Information Architecture

### Main Structure

The app has **TWO primary panes** that work together:

#### 1. Thoughts Pane (Left/First)
- **Purpose:** Chronological journal of everything captured
- **Behavior:** Write at BOTTOM, items flow upward
- **Direction:** Oldest at top, newest at bottom
- **Content:** All items created on the current day
- **Navigation:** Swipe/scroll to previous/future days

#### 2. Time Pane (Right/Second)
- **Purpose:** Timeline view of scheduled items
- **Content:** Items with specific times
- **Includes:** Daily Review, events, scheduled todos, routines
- **Navigation:** Scroll through hours of the day

### Desktop Layout (1440px+)
```
┌──────────────────────────────────────────────────────┐
│ Header: Logo | Search | Date Picker                  │
├──────────────────────┬───────────────────────────────┤
│   THOUGHTS (50%)     │      TIMES (50%)              │
│                      │                               │
│ ↑ Scroll up          │  ■ Daily Review               │
│                      │                               │
│ 8:00 AM              │  7:00 AM                      │
│ ↝ Morning note       │  ↻ Routine                    │
│                      │                               │
│ 10:00 AM             │  9:00 AM                      │
│ □ First todo         │  ↹ Event                      │
│                      │                               │
│ 2:15 PM              │  11:00 AM                     │
│ ↝ Latest note        │  □ Scheduled todo             │
│                      │                               │
├──────────────────────┤  ↓ Scroll                     │
│ [Type here...]       │                               │
│ ↑ INPUT AT BOTTOM    │                               │
└──────────────────────┴───────────────────────────────┘
```

### Mobile Layout (375px)
```
┌─────────────────────────┐
│ ← THOUGHTS | TIME →     │
├─────────────────────────┤
│                         │
│ ↑ Scroll up             │
│                         │
│ 8:00 AM                 │
│ ↝ Morning note          │
│   * bullet              │
│     * sub-bullet        │
│                         │
│ 10:00 AM                │
│ □ First todo            │
│                         │
│ 2:15 PM                 │
│ ↝ Latest note           │
│                         │
├─────────────────────────┤
│ [Type here...]          │
│ ↑ INPUT AT BOTTOM       │
└─────────────────────────┘

Swipe left/right to switch panes
```

### Item Types

**Four types of items:**

1. **Todo** - Tasks to complete
   - Can be scheduled or unscheduled
   - Can have subtasks (1 level deep)
   - Can have deadlines
   - Symbol: `□` (unchecked) / `☑` (checked)

2. **Event** - Time-bound occurrences
   - Always has start time
   - Can have end time (duration)
   - Auto-splits when items exist during duration
   - Symbol: `↹` (single) / `⇤` (start) / `⇥` (end)

3. **Routine** - Recurring tasks
   - Has recurrence pattern (daily, weekly, monthly)
   - Tracks completion streak
   - Can have or lack specific time
   - Symbol: `↻`

4. **Note** - Thoughts, ideas, references
   - No action required
   - Can contain links with auto-preview
   - **Can have structured sub-items (max 2 levels deep)**
   - **Sub-items created with prefixes: `* ` (note), `t ` (todo), `e ` (event), `r ` (routine)**
   - **Inspired by Org Mode for maximum flexibility**
   - Symbol: `↝`

---

## Visual Design System

### Color Palette

```css
/* Core Colors */
--background: #0A0A0A;        /* Near-black with warmth */
--text-primary: #F5F5F5;      /* Off-white */
--text-secondary: #6A6A6A;    /* Muted gray */
--border-subtle: #1A1A1A;     /* Subtle borders */
--hover-bg: #0F0F0F;          /* Hover state */

/* No other colors - strictly monochrome */
```

### Typography

**Font Stack:**
- Primary (body text): Crimson Text, Lora, Georgia, "Times New Roman", serif
  - Free serif fonts that evoke a literary, book-like quality
  - Crimson Text: Open-source, designed for book-like reading
  - Lora: Free alternative with excellent readability
  - Georgia: Web-safe fallback
- Monospace (for technical elements): "Courier Prime", "Courier New", monospace

**Design Philosophy:**
The app should feel like reading and writing in a beautiful novel or journal. The serif typeface creates a literary, timeless quality that encourages thoughtful writing and reflection.

**Font Sizes:**
```css
--text-base: 18px;      /* Body text - larger for readability */
--text-sm: 15px;        /* Pane headers */
--text-xs: 14px;        /* Timestamps, tags */
--text-lg: 20px;        /* App header */
--text-xl: 24px;        /* Section headers */
--line-height: 1.7;     /* Generous line spacing for book-like feel */
```

**Font Styles by Item Type:**
```css
/* Todos */
font-family: "Crimson Text", serif;
font-weight: 400;
font-size: 18px;

/* Events */
font-family: "Crimson Text", serif;
font-weight: 600;
font-size: 18px;

/* Routines */
font-family: "Crimson Text", serif;
font-weight: 400;
font-size: 18px;
letter-spacing: 0.02em;

/* Notes */
font-family: "Crimson Text", serif;
font-style: italic;
font-size: 18px;

/* Timestamps, metadata */
font-family: "Courier Prime", monospace;
font-size: 14px;
```

**Why Serif for a Productivity App:**
- Creates a calm, focused reading experience
- Evokes the permanence and thoughtfulness of written journals
- Differentiates from typical sans-serif productivity tools
- Makes extended reading/writing sessions more comfortable
- Aligns with the "thoughts" metaphor - like writing in a book

### Symbol System

All symbols render at 18px (same size as body text):

```
□  Todo (unchecked)    - U+25A1
☑  Todo (checked)      - U+2611
↹  Event (single)      - U+21B9
⇤  Event (start)       - U+21E4
⇥  Event (end)         - U+21E5
↻  Routine             - U+21BB
↝  Note                - U+219D
■  Daily Review        - U+25A0 (when incomplete)
*  Note sub-item       - U+002A (asterisk for Org Mode style)
```

**Symbol Placement:**
Symbols aligned with first baseline of text, creating a clean, typographic look reminiscent of numbered lists in books.

### Spacing System

**Use 8px grid with generous spacing for book-like layout:**
```
6px   - Minimal spacing
12px  - Close spacing
16px  - Comfortable spacing
24px  - Paragraph spacing
32px  - Section spacing
48px  - Large spacing
64px  - Major section breaks
```

**Component Spacing:**

Desktop:
- Between items: 32px (more generous for reading)
- Between text and metadata: 12px
- Subtask indent: 32px (deeper indent for clarity)
- Content padding: 48px (book margins)
- Action button spacing: 16px
- Line height: 1.7 (generous for readability)

Mobile:
- Between items: 24px
- Content padding: 24px sides
- Action button spacing: 16px
- Line height: 1.6

### Layout Dimensions

**Desktop:**
```
Header height: 60px
Pane header height: 48px (slightly larger)
Input field height: 56px (more comfortable)
Two panes: 50/50 split
Max content width: 1200px (narrower for better readability)
Min viewport: 1024px
Margins: 48px (book-like margins)
```

**Mobile:**
```
Header height: 56px
Input field height: 56px
Single pane: 100% width
Min viewport: 375px
Margins: 24px
```

**Page Layout Philosophy:**
Think of the app as an open book:
- Generous margins (like book margins)
- Comfortable line length (not too wide)
- Ample spacing between paragraphs
- Centered content with breathing room

### Component Specifications

#### Input Field
```css
height: 56px;
padding: 16px 24px;
font-size: 18px;
font-family: "Crimson Text", serif;
background: transparent;
border: none;
border-top: 1px solid #1A1A1A;
line-height: 1.6;
```

#### Action Buttons
```css
/* Desktop */
width: 32px;
height: 32px;
padding: 0;
background: transparent;
color: #F5F5F5;
opacity: 0.7; /* hover */
opacity: 0.5; /* active */

/* Mobile */
width: 44px;
height: 44px;
/* Larger tap targets */
```

#### Link Preview Card
```css
max-width: 400px; /* desktop */
max-width: 100%; /* mobile */
padding: 16px;
border: 1px solid #1A1A1A;
border-radius: 8px;
background: #0A0A0A;

/* Thumbnail */
width: 280px;
height: 160px;
object-fit: cover;

/* Text */
title: 16px semibold, 2 lines max
description: 14px regular, 2 lines max
domain: 13px, color: #6A6A6A

/* States */
collapsed: title + domain only, 60px height
expanded: full card with thumbnail
```

---

## Data Model

### Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Items (polymorphic base table)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'todo', 'event', 'routine', 'note'
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  created_date DATE NOT NULL, -- Journal day it belongs to
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Scheduling
  scheduled_time TIMESTAMP, -- Null = unscheduled
  deadline TIMESTAMP,
  
  -- Hierarchy (for subtasks)
  parent_id UUID REFERENCES items(id) ON DELETE CASCADE,
  
  -- Event-specific
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  is_all_day BOOLEAN DEFAULT FALSE,
  split_start_id UUID, -- Points to start marker if split
  split_end_id UUID,   -- Points to end marker if split
  
  -- Routine-specific
  recurrence_pattern JSONB,
  routine_streak INTEGER DEFAULT 0,
  last_completed TIMESTAMP,
  
  -- Links & embeds
  embedded_items UUID[] DEFAULT '{}',
  completion_link_id UUID,
  link_previews JSONB,
  
  -- Constraints
  CHECK (type IN ('todo', 'event', 'routine', 'note')),
  
  -- Indexes
  INDEX idx_user_created_date (user_id, created_date),
  INDEX idx_user_type (user_id, type),
  INDEX idx_scheduled_time (scheduled_time),
  INDEX idx_tags USING GIN (tags),
  INDEX idx_content_search USING GIN (to_tsvector('english', content))
);

-- Routine Occurrences
CREATE TABLE routine_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  scheduled_time TIME,
  completed_at TIMESTAMP,
  skipped BOOLEAN DEFAULT FALSE,
  
  UNIQUE(routine_id, date),
  INDEX idx_routine_date (routine_id, date),
  INDEX idx_user_date (user_id, date)
);

-- Completion Links
CREATE TABLE completion_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  completion_item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  original_date DATE NOT NULL,
  completion_date DATE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_original_item (original_item_id),
  INDEX idx_completion_item (completion_item_id)
);

-- Notification Settings
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_advance_minutes INTEGER DEFAULT 15,
  routine_enabled BOOLEAN DEFAULT TRUE,
  todo_enabled BOOLEAN DEFAULT TRUE,
  
  UNIQUE(user_id)
);
```

### Data Structures

#### Base Item
```typescript
interface BaseItem {
  id: string;
  userId: string;
  type: 'todo' | 'event' | 'routine' | 'note';
  content: string;
  tags: string[];
  createdAt: Date;
  createdDate: string; // YYYY-MM-DD
  updatedAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
}
```

#### Todo
```typescript
interface Todo extends BaseItem {
  type: 'todo';
  scheduledTime: Date | null; // null = unscheduled
  deadline: Date | null;
  parentId: string | null; // for subtasks
  parentType: 'todo' | 'note' | null; // which type of parent
  depthLevel: number; // 0 = top, 1 = sub, 2 = sub-sub
  subtasks: string[]; // child IDs
  embeddedItems: string[]; // note IDs
  completionLinkId: string | null;
}
```

#### Event
```typescript
interface Event extends BaseItem {
  type: 'event';
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  splitStartId: string | null;
  splitEndId: string | null;
  embeddedItems: string[];
  parentId: string | null; // can be sub-item of note
  parentType: 'note' | null;
  depthLevel: number; // 0 = top, 1 = sub, 2 = sub-sub
}
```

#### Routine
```typescript
interface Routine extends BaseItem {
  type: 'routine';
  recurrencePattern: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number; // every X days/weeks/months
    daysOfWeek?: number[]; // [0-6] for weekly, 0=Sunday
    dayOfMonth?: number; // 1-31 for monthly
  };
  scheduledTime: string | null; // HH:mm or null
  streak: number;
  lastCompleted: Date | null;
  embeddedItems: string[];
  parentId: string | null; // can be sub-item of note
  parentType: 'note' | null;
  depthLevel: number; // 0 = top, 1 = sub, 2 = sub-sub
}
```

#### Routine Occurrence
```typescript
interface RoutineOccurrence {
  id: string;
  routineId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  scheduledTime: string | null; // HH:mm
  completedAt: Date | null;
  skipped: boolean;
}
```

#### Note
```typescript
interface Note extends BaseItem {
  type: 'note';
  linkPreviews: LinkPreview[];
  subItems: string[]; // Can contain ANY item type (notes, todos, events, routines)
  parentId: string | null; // can be sub-item of another note
  parentType: 'note' | null;
  depthLevel: number; // 0 = top, 1 = sub, 2 = sub-sub (max 2 levels)
  orderIndex: number; // For ordering sub-items
}

interface LinkPreview {
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  domain: string;
}
```

#### Completion Link
```typescript
interface CompletionLink {
  id: string;
  originalItemId: string;
  completionItemId: string;
  originalDate: string; // YYYY-MM-DD
  completionDate: string; // YYYY-MM-DD
  userId: string;
}
```

---

## Feature Specifications

### 1. Capture System

#### Writing Direction: CRITICAL
- **Input field positioned at BOTTOM of Thoughts pane**
- **Items display: oldest at top, newest at bottom**
- **Metaphor:** Continuous journal where you write at the end
- **Benefit:** New entries appear immediately above input field

#### Note Sub-Items (Org Mode Style)

**INSPIRED BY ORG MODE:** Notes can contain structured sub-items of ANY type, giving you maximum flexibility to mix notes, tasks, events, and routines within a single document.

**Notes can contain ANY item type as sub-items (max 2 levels deep):**

**Creation:**
1. Write note content, press Enter
2. Press Tab to indent to level 1
3. Type prefix to create sub-item:
   - `* ` creates a note sub-item
   - `t ` creates a todo sub-item
   - `e ` creates an event sub-item
   - `r ` creates a routine sub-item
4. Press Enter, Tab again to create level 2 sub-item
5. Press Shift+Tab to outdent to parent level
6. **CRITICAL:** Cannot go deeper than 2 levels

**Example Structure:**
```
Type: "n project planning"
Press: Enter, Tab
Type: "* research phase notes" (level 1 note)
Press: Enter, Tab
Type: "t gather competitor data" (level 2 todo)
Press: Enter
Type: "t interview users" (level 2 todo)
Press: Enter, Shift+Tab
Type: "* implementation notes" (level 1 note)
Press: Enter, Shift+Tab
Type: "e kickoff meeting Friday 2pm" (level 1 event)
Press: Enter
Type: "r weekly standup" (level 1 routine)
```

Result:
```
↝ Project planning
  * Research phase notes
    □ Gather competitor data
    □ Interview users
  * Implementation notes
  ↹ Kickoff meeting Friday 2pm
  ↻ Weekly standup
```

**Visual Display:**
```
↝ Project brainstorm #work
  * Main concept overview
    □ Action item: validate with team
    ↝ Additional thoughts on this
  □ Next concrete task
    ↹ Deadline review meeting Friday 3pm
  ↻ Weekly progress check
    * Agenda template notes
```

**Prefix System for Sub-Items:**
- `* ` + content → note sub-item (bullet point)
- `t ` + content → todo sub-item (actionable task)
- `e ` + content → event sub-item (scheduled occurrence)
- `r ` + content → routine sub-item (recurring task)

**Rules:**
- **Level 0:** Top-level note
- **Level 1:** First sub-items (any type: `*`, `t`, `e`, `r`)
- **Level 2:** Second sub-items (any type: `*`, `t`, `e`, `r`)
- **Level 3+:** NOT ALLOWED - hard limit at 2 levels

**Specifications:**
- Indent: 32px per level (deeper for clarity)
- Max depth: 2 levels (0, 1, 2)
- Each sub-item is a full item with its own type, symbol, and properties
- Sub-items can have scheduled times (appear on Timeline)
- Sub-items can be completed/cancelled independently
- Todos under notes do NOT have the "checking parent checks children" rule
- Deleting parent note deletes all sub-items (cascade)
- Sub-items maintain their order via `order_index` field
- Font: "Crimson Text" serif for all types
- Line spacing: 1.7 for comfortable reading

**Behavior with Scheduled Sub-Items:**
```
↝ Meeting prep notes
  ↹ Team meeting tomorrow 9am  ← This appears on Timeline at 9am
  □ Prepare deck by 8am        ← If scheduled, appears on Timeline
```

Sub-items with times appear both:
1. Nested under parent note in Thoughts
2. On Timeline at their scheduled time

**Why This Matters (Org Mode Philosophy):**
This gives you the freedom to structure information naturally:
- Start with free-form notes
- Add actionable todos within those notes
- Schedule events related to the topic
- Set up routines for recurring aspects
- All within one cohesive document

**Implementation Notes:**
```typescript
interface Item {
  id: string;
  type: 'todo' | 'event' | 'routine' | 'note';
  parentId: string | null;
  parentType: 'todo' | 'note' | null;
  depthLevel: number; // 0, 1, or 2 only
  orderIndex: number; // For sorting sub-items
  // ... other fields
}

// Validation
function validateNoteSubItem(item: Item) {
  if (item.depthLevel > 2) {
    throw new Error('Maximum depth is 2 levels');
  }
  
  if (item.parentType === 'note' && item.depthLevel > 2) {
    throw new Error('Note sub-items max 2 levels');
  }
}

// Creation handler
function handleSubItemCreation(parentNote: Note, input: string, level: number) {
  // Parse prefix
  let type = 'note';
  let content = input;
  
  if (input.startsWith('* ')) {
    type = 'note';
    content = input.slice(2);
  } else if (input.startsWith('t ')) {
    type = 'todo';
    content = input.slice(2);
  } else if (input.startsWith('e ')) {
    type = 'event';
    content = input.slice(2);
  } else if (input.startsWith('r ')) {
    type = 'routine';
    content = input.slice(2);
  }
  
  // Create sub-item
  const subItem = {
    type,
    content,
    parentId: parentNote.id,
    parentType: 'note',
    depthLevel: level,
    orderIndex: parentNote.subItems.length
  };
  
  return createItem(subItem);
}

// Render recursively
function renderNoteWithSubItems(note: Note, level: number) {
  if (level > 2) return null; // Hard limit
  
  return (
    <div style={{ 
      marginLeft: `${level * 32}px`,
      lineHeight: 1.7,
      fontFamily: '"Crimson Text", serif'
    }}>
      <NoteItem note={note} />
      {note.subItems
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(subItem => renderItem(subItem, level + 1))
      }
    </div>
  );
}
```

#### Prefix-Based Input

**How It Works:**
1. User types in input field at bottom of Thoughts pane
2. Detects prefix at start of text
3. **CRITICAL:** Prefix MUST include space (`t ` not `t`)
4. No prefix = defaults to note
5. Press Enter to create item
6. Item appears in Thoughts pane above input
7. If event/routine with time, also appears on Timeline

**Prefixes:**
```
t   → todo
e   → event  
r   → routine
n   → note (explicit, but optional)
```

**Examples:**
```
Input: "t buy groceries #shopping"
Creates: Todo "buy groceries" with tag #shopping

Input: "e meeting tomorrow 2pm #work"
Creates: Event "meeting tomorrow 2pm" at 2pm, tag #work

Input: "r morning workout 7am #health"
Creates: Routine "morning workout 7am" daily at 7am

Input: "interesting idea about design"
Creates: Note "interesting idea about design"

Input: "tell mom about trip"
Creates: Note (not todo - no space after 't')
```

#### Tag Extraction

**Pattern:** `#` followed by alphanumeric characters

**Rules:**
- Extract all `#tag` patterns from content
- Store in array: `["tag1", "tag2"]`
- Tags display at end of main text (inline)
- Case-sensitive
- Multiple tags supported per item

**Display:**
```
□ Buy concert tickets #concert #entertainment
  Due: Oct 20
```

Tags appear after content but before metadata like due dates.

#### Time Parsing (for Events/Routines)

**Recognized Patterns:**
```
"2pm"           → 14:00
"2:30pm"        → 14:30
"14:00"         → 14:00
"2:30 PM"       → 14:30
"tomorrow 3pm"  → next day 15:00
```

**Behavior:**
- If event/routine contains time pattern, auto-schedule
- Time extracted from content
- Item appears on Timeline at that time
- Also stays in Thoughts pane with link to timeline

#### Item Display Order in Thoughts

**CRITICAL:** Items display oldest → newest (top → bottom)

```
┌────────────────────────────────┐
│ ↑ Scroll up for earlier        │
│                                │
│ 8:00 AM (first item of day)   │
│ ↝ Morning thoughts             │
│                                │
│ 10:30 AM                       │
│ □ Buy tickets                  │
│                                │
│ 2:15 PM (last item so far)    │
│ □ Call dentist                 │
│                                │
├────────────────────────────────┤
│ [Type here...]                 │ ← INPUT AT BOTTOM
└────────────────────────────────┘
```

**Implementation:**
```javascript
// Array stores chronologically
thoughts = [oldest, ..., newest]

// Display maps directly (no reverse)
thoughts.map(item => <Item />)

// New items append to end
setThoughts([...thoughts, newItem])
```

### 2. Daily Review

#### Purpose
Surface unfinished work each day so nothing gets forgotten.

#### What It Contains
1. **Unscheduled todos from previous days** (not today)
2. **Routines without specific time** for today

#### When It Appears
- At top of Times pane
- Only when there are items to review
- Disappears when all items dealt with

#### Visual Appearance
```
■ Daily Review
  
  • Buy concert tickets (waiting 3 days)
    [↷] [✓] [×]
  
  • Call mom (waiting 1 day)
    [↷] [✓] [×]
  
  ↻ Weekly review (routine)
    [↷] [✓] [×]
```

**Symbol:** `■` filled square (not checkable initially)

**Items:** Listed as bullets `•` (no checkboxes)

**Ordering:** Latest items at top, oldest at bottom

#### Action Buttons

Each item has three actions:

**[↷] Reschedule:**
- Opens time picker
- User selects new time
- Item moves to Timeline at that time
- Disappears from Daily Review

**[✓] Complete:**
- Marks original item as completed
- Creates completion entry in today's Thoughts
- Creates CompletionLink between them
- Item disappears from Daily Review

**[×] Cancel:**
- Permanently deletes item
- Item disappears from Daily Review
- No completion record created

**Button Specs:**
```css
Size: 32px × 32px (desktop)
Size: 44px × 44px (mobile)
Spacing: 12px between buttons
Icon only, no background
Color: #F5F5F5
Hover: opacity 0.7
Active: opacity 0.5
```

#### "Waiting X Days" Counter

**Calculation:**
```javascript
waitingDays = currentDate - createdDate
```

**Display:**
```
• Buy groceries (waiting 3 days)
```

**Color:** `#6A6A6A` (secondary text)

#### Completion Behavior

**When all items have actions taken:**
1. `■` symbol changes to `□` (empty square)
2. Daily Review becomes checkable
3. Auto-checks itself
4. Disappears from view

**CRITICAL:** Cannot manually check Daily Review until all items dealt with

#### Pagination

**When 20+ items:**
```
■ Daily Review (showing 1-20 of 47)
  
  [items 1-20]
  
  [Load next 20]
```

Button centered, 40px height

#### Editing Items in Daily Review

- Items are **directly editable**
- Changes update the original item
- Edit content, tags, etc. inline
- Original item in Thoughts pane also updates

### 3. Timeline System

#### What Appears on Timeline

**Daily Review** (if applicable)
- At very top, before all times

**Scheduled Items:**
- Events with specific times
- Routines with specific times (each occurrence)
- Todos with scheduled times
- Todos with deadlines (appear ONLY on deadline day)

**NOT on Timeline:**
- Unscheduled todos
- Notes (unless scheduled by dragging)
- Routines without time (appear in Daily Review instead)

#### Time Display Format

Items grouped by hour:

```
7:00 AM
↻ Morning meditation (Streak: 12)

9:00 AM
↹ Team standup #work

11:00 AM
□ Submit report #work

2:00 PM
⇤ Deep work (2:00 PM - 4:00 PM) #focus

3:00 PM
□ Quick call #work

4:00 PM
⇥ Deep work (end) #focus
```

#### Event Auto-Split Logic

**Purpose:** Show what happens during multi-hour/day events

**When to Split:**
Event automatically splits when OTHER items exist between its start and end times.

**Example - Split:**
```
May 3
⇤ Holiday Trip (May 3-6) #vacation

May 5, 4:00 PM
□ Call with client #work  ← Item during event

May 6
⇥ Holiday Trip (end) #vacation
```

**Example - No Split:**
```
May 3
↹ Holiday Trip (May 3-6) #vacation
```
(No items between May 3-6, stays as single item)

**Implementation:**
```javascript
// On timeline render, for each multi-hour/day event:
const itemsDuring = items.filter(item => 
  item.scheduledTime >= event.startTime && 
  item.scheduledTime <= event.endTime &&
  item.id !== event.id
);

if (itemsDuring.length > 0) {
  // Display as split: ⇤ start + ⇥ end
  renderSplitEvent(event);
} else {
  // Display as single: ↹
  renderSingleEvent(event);
}

// Cache split state, recalculate when items added/removed
```

**Split Event Linking:**
- Start and end are ONE event in database
- Editing start updates end automatically
- Deleting start deletes end
- Both share same ID and data

**Visual Format:**
```
⇤ Deep work (2:00 PM - 4:00 PM) #focus  ← Start
⇥ Deep work (end) #focus                ← End

Start shows full duration
End shows "(end)" marker
Both show same tags
```

#### Overlapping Items (Stacking)

**When multiple items at same time:**
```
4:00 PM
□ Call client #work
↹ Dinner prep #personal
□ Pick up package
```

Display as compact vertical list (no side-by-side columns)

#### Timeline Scrolling

**Future:** Up to 1 year ahead
**Past:** Infinite scrolling back
**Performance:** Load 30 days at a time, virtualized list

### 4. Subtasks

#### Core Rules

**CRITICAL CONSTRAINTS:**
- **Only todos can have subtasks**
- **Maximum 1 level deep** (parent → child, NO grandchildren)
- **Subtasks can ONLY be todos**
- Notes, events, routines CANNOT have subtasks
- For nested structure in notes, see "Note Sub-Items" section

**Note:** This is different from note sub-items. Todos have subtasks (todos only, 1 level). Notes have sub-items (any type, 2 levels).

#### Creation

**Desktop:**
1. Write todo, press Enter
2. Press Tab to indent next line
3. Write subtask, press Enter
4. Press Shift+Tab to return to parent level

**Mobile:**
- Indent/outdent buttons in toolbar

**Example:**
```
Type: "t plan trip"
Press: Enter
Press: Tab
Type: "book flights"
Press: Enter
Type: "reserve hotel"
```

Result:
```
□ Plan trip
  □ Book flights
  □ Reserve hotel
```

#### Visual Display

```
□ Plan conference trip #work #travel
  □ Book flights
  □ Reserve hotel
  □ Register for event
  Due: Oct 20, 5pm
```

**Spacing:**
- Subtasks indented 24px from parent
- Same symbol size as parent
- Metadata appears AFTER all subtasks

#### Behavior Rules

**Checking Parent:**
- Automatically checks all children
- All subtasks marked complete

**Checking Children:**
- Does NOT auto-check parent
- Parent remains unchecked until manually checked

**Dragging:**
- Dragging parent brings all subtasks along
- Cannot drag subtasks independently
- Cannot separate subtasks from parent

**Completion Display:**
```
□ Plan trip
  ☑ ~~Book flights~~
  □ Reserve hotel
```
Completed subtasks show strikethrough but stay visible

#### In Daily Review

```
■ Daily Review
  • Plan trip (waiting 2 days)
    • Book flights
    • Reserve hotel
    [↷] [✓] [×]
```

Subtasks displayed nested, actions apply to entire group

#### Inheritance Rules

**Subtasks inherit from parent:**
- Tags (all parent tags)

**Subtasks CANNOT have:**
- Their own deadlines
- Their own scheduled times
- Their own subtasks

### 5. Routines System

#### Purpose
Handle recurring tasks (daily workout, weekly review, etc.)

#### Creation

```
Input: "r morning meditation 7am"
Result: Routine recurring daily at 7am

Input: "r weekly planning"
Result: Routine without time (appears in Daily Review)
```

#### Recurrence Patterns

Configured via UI after creation:

**Daily:**
```json
{
  "frequency": "daily",
  "interval": 1
}
```

**Weekly:**
```json
{
  "frequency": "weekly",
  "interval": 1,
  "daysOfWeek": [1, 3, 5] // Mon, Wed, Fri
}
```

**Monthly:**
```json
{
  "frequency": "monthly",
  "interval": 1,
  "dayOfMonth": 15 // 15th of each month
}
```

**Custom Interval:**
```json
{
  "frequency": "daily",
  "interval": 3 // Every 3 days
}
```

#### Occurrences

**Generation:**
- Each day creates NEW occurrence instance
- Occurrences generated on-demand (not all at once)
- Background job pre-generates next 7 days

**Independence:**
- Completing today's occurrence ≠ affect tomorrow's
- Each tracked separately
- History maintained

**Display:**
```
Tuesday Timeline:
↻ Morning workout (Streak: 5)

Wednesday Timeline:
↻ Morning workout (Streak: 6)
```

#### Streak Tracking

**Calculation:**
```javascript
streak = consecutive days completed
```

**Display:**
```
↻ Morning meditation
  Every day 7:00 AM (Streak: 12)
```

**Reset:**
- Breaks if day skipped
- Resets to 0

**Location:**
Shows next to time in parentheses

#### Routines Without Time

**Behavior:**
- Set for specific days (e.g., every Tuesday)
- Appear in Daily Review on those days
- User can [↷] reschedule to add time
- After time added, appears on Timeline

**Example:**
```
Routine: "Weekly review" every Sunday
No time set

Sunday's Daily Review:
■ Daily Review
  ↻ Weekly review (routine)
    [↷] [✓] [×]
```

#### Editing Routines

**Changing Frequency:**
1. User edits recurrence pattern
2. System creates NEW entry in Thoughts marked "(edited)"
3. Original routine occurrences unchanged
4. Streak maintained (not reset)
5. Past completions stay in history

**Example:**
```
Original: Every Tuesday
Edit to: Every Monday

Result:
Oct 12 Thoughts:
↻ Weekly review (edited)
  Changed to every Monday
```

#### Missed Occurrences

**When routine not completed:**
- Marked as "missed" in database
- Does NOT appear in next day's Daily Review
- Moves to next scheduled occurrence
- Breaks streak counter

**Unlike todos:**
Routines don't carry forward - they're date-specific

### 6. Completion & Linking

#### Completing Todos

**From Daily Review:**

User taps [✓] button:

1. Original item marked completed:
```
Oct 12 Thoughts:
☑ ~~Call mom~~ #family
  completed on Oct 14 →
```

2. Completion entry created in today's Thoughts:
```
Oct 14 Thoughts:
☑ ~~Call mom (completed)~~ #family
  ← from Oct 12
```

3. CompletionLink created in database
4. Both entries linked for navigation
5. Item disappears from Daily Review

**Visual Specs:**
```css
Completed items:
  opacity: 0.4
  text-decoration: line-through
  
Completion links:
  font-size: 13px
  color: #6A6A6A
  text-decoration: underline on hover
  cursor: pointer
```

#### Uncompleting Items

**User unchecks completed item:**

1. Item reverts to uncompleted in original day
2. Reappears in tomorrow's Daily Review
3. Completion entry removed from completion day
4. CompletionLink deleted

**Example:**
```
User unchecks on Oct 14 →
Oct 12: □ Call mom (uncompleted again)
Oct 15 Daily Review: • Call mom (waiting 3 days)
```

#### Deleting Items

**Delete original item:**
- Completion entry also deleted
- CompletionLink removed
- Both disappear

**Delete completion entry:**
- Original item becomes uncompleted
- CompletionLink removed
- Original remains in its day

**Delete with embeddings:**
- System shows warning: "This item is embedded in X other items"
- User confirms or cancels
- If confirmed, creates broken link placeholders

### 7. Embedding & Linking

#### What Can Embed What

**CRITICAL RULES:**
- **Todos** can embed: notes ONLY
- **Events** cannot embed anything
- **Routines** cannot embed anything
- **Notes** cannot embed anything

#### Process

1. Click "Link" button on note
2. Copies unique ID/URL to clipboard
3. Paste into todo's content
4. System detects link pattern
5. Displays as embedded preview card

**Visual Display:**
```
□ Meeting prep #work
  ┌─────────────────────────────┐
  │ ↝ Agenda points from Oct 12 │
  │   [View full note →]        │
  └─────────────────────────────┘
  Due: Oct 15, 2pm
```

**Card Specs:**
```css
border: 1px solid #1A1A1A
background: #0F0F0F
padding: 12px
border-radius: 4px
margin-top: 8px
```

#### Broken Links

**When embedded item deleted:**
```
□ Meeting prep #work
  ┌─────────────────────────────┐
  │ [Broken link]               │
  │ Item no longer exists       │
  └─────────────────────────────┘
```

**Specs:**
```css
color: #6A6A6A
font-style: italic
```

#### URL Link Previews

**Auto-Detection:**
System detects URLs in note content:
```
https://example.com/article
http://example.com/page
www.example.com
```

**Fetching:**
1. Detect URL on item creation
2. Background fetch metadata:
   - Open Graph tags
   - Twitter cards
   - Basic HTML meta
3. Store in `link_previews` JSONB field

**Display - Collapsed:**
```
↝ Great article [▾]
  example.com
  #reading
```

**Display - Expanded:**
```
↝ Great article [▴]
  ┌─────────────────────────────────┐
  │ [Thumbnail 280×160px]           │
  │ Article Title Here              │
  │ Short description text that     │
  │ spans up to 2 lines max...      │
  │ example.com                     │
  └─────────────────────────────────┘
```

**Card Specs:**
```css
max-width: 400px (desktop) / 100% (mobile)
padding: 16px
border: 1px solid #1A1A1A
border-radius: 8px

thumbnail: 
  width: 280px
  height: 160px
  object-fit: cover

title:
  font-size: 16px
  font-weight: 600
  max-lines: 2
  overflow: ellipsis

description:
  font-size: 14px
  color: #F5F5F5
  max-lines: 2
  overflow: ellipsis

domain:
  font-size: 13px
  color: #6A6A6A
```

**Toggle:**
Click anywhere on collapsed card to expand
Click [▴] icon to collapse

### 8. Search

#### Desktop Behavior

**Activation:**
- Click search icon in header
- OR press Cmd/Ctrl + F

**Scope:**
- Searches **only the active/focused pane**
- If user last clicked Thoughts → searches Thoughts
- If user last clicked Time → searches Time
- **NEVER searches both simultaneously**

**Visual Indicator:**
```
Active pane gets subtle highlight or header change:
┌────────────────────────────────┐
│ THOUGHTS (searching...)        │
└────────────────────────────────┘
```

**Results Display:**
```
THOUGHTS PANE (replaces normal view):
┌────────────────────────────────┐
│ SEARCH RESULTS                 │
├────────────────────────────────┤
│ Oct 12, 11:45 AM               │
│ □ Buy concert tickets          │
│   #concert                     │
│                                │
│ Oct 10, 2:15 PM                │
│ ↝ Article about concerts       │
│   #reading                     │
└────────────────────────────────┘

TIME PANE:
Shows normal timeline view (unchanged)
```

#### Mobile Behavior

**Activation:**
- Tap search icon in header

**Scope:**
- Searches **only currently visible pane**
- If viewing Thoughts → searches Thoughts
- If viewing Time → searches Time
- Must switch panes to search other side

**Results Display:**
```
┌─────────────────────────┐
│ 🔍 [query___]     [×]  │
├─────────────────────────┤
│ Results in Thoughts:    │
│                         │
│ Oct 12, 11:45 AM        │
│ □ Buy concert tickets   │
│                         │
│ ↓ Scroll                │
└─────────────────────────┘
```

#### Search Syntax

**Text-based only:**
- Searches item content field
- Full-text search with PostgreSQL

**Examples:**
```
"meeting"      → finds items containing "meeting"
"#work"        → finds items with tag "work"
"concert tickets" → finds both words
```

**NOT supported:**
- Boolean operators (AND, OR, NOT)
- Wildcards (*, ?)
- Date ranges
- Advanced filters

To search tags, user must type `#` symbol.

#### Results Format

**Each result shows:**
- Date + time created
- Full item with symbol
- Tags
- Highlight matching text

**Click result:**
- Closes search
- Navigates to that day
- Scrolls to item
- Briefly highlights item

**Close search:**
- ESC key
- Click [×] button
- Click outside search area

#### Implementation

```sql
-- Full-text search query
SELECT * FROM items
WHERE user_id = $1
  AND to_tsvector('english', content) 
      @@ plainto_tsquery('english', $2)
ORDER BY created_at DESC
LIMIT 50;

-- Tag search
SELECT * FROM items
WHERE user_id = $1
  AND $2 = ANY(tags)
ORDER BY created_at DESC
LIMIT 50;
```

### 9. Drag & Drop

#### Desktop Drag Flow

**Step-by-step:**

1. User hovers over item in Thoughts
2. Cursor changes to grab hand
3. User clicks and holds (drag starts)
4. Item lifts visually:
   - Shadow appears
   - Opacity reduces to 0.7
   - Slight rotation (2deg)
5. Timeline shows all hour slots with drop zones
6. Drop zones have dashed borders
7. User drags over desired time slot
8. Slot highlights (background #1A1A1A)
9. User releases mouse
10. Item schedules at that time
11. Appears on Timeline
12. Remains in Thoughts with time indicator

**Visual Feedback:**
```css
/* Item being dragged */
.dragging {
  opacity: 0.7;
  transform: rotate(2deg);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  cursor: grabbing;
}

/* Drop zone */
.drop-zone {
  background: #0F0F0F;
  border: 1px dashed #1A1A1A;
  min-height: 50px;
}

/* Drop zone hover */
.drop-zone.hover {
  background: #1A1A1A;
}
```

#### Mobile Drag Flow

**Step-by-step:**

1. User long-presses item (500ms)
2. Haptic feedback (vibration)
3. Item lifts under finger
4. While holding, swipe right
5. Screen transitions to Times pane
6. Item follows finger
7. Drag vertically to time slot
8. Visual indicator shows where it will drop
9. Release finger
10. Item schedules at that time
11. Animation: item settles into place

**Implementation:**
```javascript
// Long-press detection
let pressTimer;

onTouchStart = (item) => {
  pressTimer = setTimeout(() => {
    startDrag(item);
    hapticFeedback();
  }, 500);
};

onTouchEnd = () => {
  clearTimeout(pressTimer);
};

// Gesture handling
onDragMove = (e) => {
  const touch = e.touches[0];
  updateDragPosition(touch.clientX, touch.clientY);
  
  // Detect swipe to Times pane
  if (touch.clientX > threshold) {
    switchToTimesPane();
  }
};
```

#### What Can Be Dragged

**YES:**
- Uncompleted todos (scheduled or unscheduled)
- Events (to reschedule)
- Routines (to reschedule)
- Notes (to schedule them)

**NO:**
- Completed items (opacity 0.4, not draggable)
- Items within Daily Review (use [↷] button instead)
- Subtasks independently (parent only)

#### Dragging with Subtasks

**Behavior:**
- Drag parent → all subtasks come along
- Cannot drag subtask separately
- Visual: all subtasks shown during drag

**Example:**
```
Dragging:
□ Plan trip
  □ Book flights
  □ Reserve hotel
  
All three move together to scheduled time
```

#### Dragging Between Days

**On Timeline:**
- User can drag items vertically to different times same day
- User can drag to past/future days if scrolled there
- Validates date is within allowed range (past infinite, future 1 year)

**Implementation:**
```javascript
onDrop = (targetDate, targetTime) => {
  // Validate target date
  const now = new Date();
  const oneYearFromNow = addYears(now, 1);
  
  if (targetDate > oneYearFromNow) {
    showError("Cannot schedule more than 1 year ahead");
    return;
  }
  
  // Update item
  updateItem(draggedItem.id, {
    scheduledTime: combineDateAndTime(targetDate, targetTime)
  });
};
```

#### Cannot Drag FROM Time to Thoughts

**CRITICAL:** Items cannot be "unscheduled" by dragging back

**Reason:** Maintains data integrity, forces intentional unscheduling

**To unschedule:** User must edit item and remove time

---

## User Interactions

### Item States

#### Unchecked Todo
```
□ Buy concert tickets #concert
  
  color: #F5F5F5
  symbol: □
  opacity: 1.0
  cursor: pointer (on symbol)
  draggable: true
```

#### Checked Todo
```
☑ ~~Buy concert tickets~~ #concert
  
  color: #F5F5F5
  symbol: ☑
  opacity: 0.4
  text-decoration: line-through
  draggable: false
```

#### Hover State (Desktop)

**Before hover:**
```
□ Buy concert tickets #concert
```

**On hover:**
```
┌─────────────────────────────────┐
│ □ Buy concert tickets #concert  │
│   [Edit] [Link] [Delete]        │
└─────────────────────────────────┘

background: #0F0F0F
transition: 150ms ease
actions fade in: 150ms
```

#### Press/Active State

**Buttons:**
```css
.button:active {
  opacity: 0.5;
  transition: 100ms;
}
```

**Items:**
No special press state, just cursor change

### Empty States

#### Thoughts - Empty Day

```
┌────────────────────────────────┐
│         THOUGHTS               │
├────────────────────────────────┤
│                                │
│    Nothing captured yet today  │
│                                │
│    Type 't ' for todo          │
│    Type 'e ' for event         │
│    Type 'r ' for routine       │
│    Just type for a note        │
│                                │
├────────────────────────────────┤
│ [Type here...]                 │
└────────────────────────────────┘

text: #6A6A6A
font-size: 14px
text-align: center
padding-top: 48px
```

#### Times - Empty Day

```
┌────────────────────────────────┐
│          TIME                  │
├────────────────────────────────┤
│                                │
│    No scheduled items today    │
│                                │
│    Create events with time     │
│    (e meeting 2pm)             │
│                                │
│    or drag items from Thoughts │
│    to schedule them            │
│                                │
└────────────────────────────────┘

text: #6A6A6A
font-size: 14px
text-align: center
padding-top: 48px
```

#### Search - No Results

```
┌────────────────────────────────┐
│ 🔍 [search query___]           │
├────────────────────────────────┤
│                                │
│      No results found          │
│                                │
└────────────────────────────────┘

text: #6A6A6A
font-size: 14px
text-align: center
padding-top: 24px
```

### Date Navigation

#### Desktop Date Picker

**Trigger:** Click date in header `[Oct 13, 2025 ▾]`

**Display:**
```
┌─────────────────────────┐
│   October 2025     [× ] │
├─────────────────────────┤
│  Su Mo Tu We Th Fr Sa   │
│              1  2  3  4 │
│   5  6  7  8  9 10 11   │
│  12 [13] 14 15 16 17 18 │
│  19  20 21 22 23 24 25  │
│  26 27 28 29 30 31      │
├─────────────────────────┤
│  [← Prev]  [Today]  [Next →]│
└─────────────────────────┘

Current day: highlighted with border
Hover: background #0F0F0F
Click: navigates both panes to that date
```

#### Mobile Date Picker

**Trigger:** Tap [▾] in header

**Display:**
Full-screen overlay slides up from bottom

```
┌─────────────────────────────────┐
│ [Drag to dismiss]               │
├─────────────────────────────────┤
│        October 2025             │
│                                 │
│  Su Mo Tu We Th Fr Sa           │
│              1  2  3  4         │
│   5  6  7  8  9 10 11           │
│  12 [13] 14 15 16 17 18         │
│  19  20 21 22 23 24 25          │
│  26 27 28 29 30 31              │
│                                 │
├─────────────────────────────────┤
│  [Today]        [← October →]   │
└─────────────────────────────────┘

Swipe down or tap outside to dismiss
```

#### Keyboard Navigation

**Desktop shortcuts:**
```
Cmd/Ctrl + →   Next day
Cmd/Ctrl + ←   Previous day
Cmd/Ctrl + T   Today
Cmd/Ctrl + D   Date picker
```

---

## Edge Cases & Business Rules

### Daily Review Rules

**Q: What if 20+ unfinished items?**
**A:** Show first 20, add "Load next 20" button. Latest items within each page.

**Q: Can you edit items in Daily Review?**
**A:** Yes, edits update original item in its creation day.

**Q: Can you check Daily Review before all items handled?**
**A:** No, `■` is not clickable until all items have action taken.

**Q: What if routine without time in Daily Review?**
**A:** User can [↷] reschedule to add time, or [✓] complete timeless.

### Subtask Rules

**Q: Can events have subtasks?**
**A:** No, only todos.

**Q: Can notes have subtasks?**
**A:** No, but notes can be embedded in todos that have subtasks.

**Q: What if I drag parent with mixed complete/incomplete subtasks?**
**A:** All subtasks come along, completed ones stay strikethrough.

**Q: Can subtasks have their own deadlines?**
**A:** No, only parent can have deadline.

**Q: Maximum subtask depth?**
**A:** 1 level only. Parent → child, no grandchildren.

### Routine Rules

**Q: Routine without time - where appears?**
**A:** In Daily Review on scheduled days only (not next day).

**Q: Completing timeless routine?**
**A:** Next occurrence still timeless in next scheduled day's Daily Review.

**Q: Edit routine frequency - what happens?**
**A:** Creates new entry marked "(edited)", past occurrences unchanged, streak kept.

**Q: Miss a routine?**
**A:** Marked missed, breaks streak, does NOT appear in Daily Review.

**Q: Delete routine?**
**A:** All future occurrences deleted, past occurrences stay in history.

### Completion Rules

**Q: Uncheck completed item?**
**A:** Reverts to uncompleted in original day, reappears in tomorrow's Daily Review.

**Q: Delete original item?**
**A:** Completion entry also deleted, CompletionLink removed.

**Q: Delete completion entry?**
**A:** Original becomes uncompleted, reappears in Daily Review.

**Q: Complete event?**
**A:** Events cannot be completed, only cancelled [×].

### Drag & Drop Rules

**Q: Drag item with subtasks?**
**A:** Yes, all come along, no warning.

**Q: Drag from Times to Thoughts?**
**A:** Not possible, cannot "unschedule" by dragging.

**Q: Drag between days?**
**A:** Yes, if scrolled to target day on Timeline.

**Q: Drag completed item?**
**A:** No, completed items not draggable.

### Prefix Rules

**Q: User types "tell mom" - is it todo?**
**A:** No, needs space: "t " not "t". "tell" at start = note.

**Q: User types "tomorrow buy milk"?**
**A:** Note (no prefix detected).

**Q: Case sensitive?**
**A:** No, "T " also works for todo.

### Embedding Rules

**Q: Broken link - what shows?**
**A:** "[Broken link] - Item no longer exists" in gray, italic.

**Q: Can notes embed todos?**
**A:** No, only todos can embed notes.

**Q: Live updates in embeds?**
**A:** No, embedded content is snapshot.

**Q: Delete item embedded in 5 todos?**
**A:** Warning: "This item is embedded in 5 other items", confirm to proceed.

### Timeline Rules

**Q: All-day event - how displayed?**
**A:** As single `↹` unless items exist during that day.

**Q: Event spanning months?**
**A:** Start marker on first day, end marker on last day.

**Q: Edit event start time?**
**A:** End time also updates (linked event).

**Q: Deadline todo - when appears?**
**A:** Only on deadline day, not before.

### Note Sub-Items

**Q: How deep can note sub-items nest?**
**A:** Maximum 2 levels (depth 0, 1, 2). Level 0 = top note, level 1 = sub-item, level 2 = sub-sub-item.

**Q: Can note sub-items be any type?**
**A:** Yes! Use prefixes: `* ` (note), `t ` (todo), `e ` (event), `r ` (routine).

**Q: What about todo subtasks vs note sub-items?**
**A:** Different rules:
- **Todo subtasks:** Only todos, max 1 level deep, checking parent checks children
- **Note sub-items:** Any type via prefixes, max 2 levels deep, each item independent

**Q: Sub-item with scheduled time?**
**A:** Appears both under parent note AND on Timeline at scheduled time.

**Q: Deleting parent note?**
**A:** All sub-items deleted (cascade delete).

**Q: Can todos have sub-items like notes?**
**A:** No, todos only have subtasks (which must be todos, 1 level max). But todos CAN embed notes for reference.

**Q: Why is this inspired by Org Mode?**
**A:** Org Mode pioneered this flexible structure where you can mix notes, tasks, and schedules within one document. It gives maximum freedom to organize information naturally.

### Search Rules

**Q: Search across both panes?**
**A:** No, only searches active/focused pane.

**Q: Tag filter in search?**
**A:** Type "#work" in search query.

**Q: Search all dates?**
**A:** Yes, across all days in that pane.

---

## Technical Architecture

### Recommended Tech Stack

```
Frontend:
- Framework: React 18+ with TypeScript
- Build: Vite
- Styling: Tailwind CSS
- State: Zustand or Jotai (lightweight)
- Data: TanStack Query v5
- Routing: React Router v6
- Drag: @dnd-kit/core

Backend:
- Database: Supabase (PostgreSQL + Auth + Realtime)
- Alternative: Custom Node.js/Bun + PostgreSQL + Redis
- Storage: Supabase Storage (for file uploads)
- Functions: Supabase Edge Functions

Infrastructure:
- Web Hosting: Vercel
- Database: Supabase (hosted PostgreSQL)
- CDN: Cloudflare (link preview caching)
- Monitoring: Sentry (error tracking)
```

### Database Queries

#### Load Thoughts for Day
```sql
SELECT * FROM items
WHERE user_id = $1
  AND created_date = $2
ORDER BY created_at ASC;
```

#### Load Timeline for Day
```sql
-- Scheduled items
SELECT * FROM items
WHERE user_id = $1
  AND DATE(scheduled_time) = $2
  AND type IN ('todo', 'event')
  AND cancelled_at IS NULL
ORDER BY scheduled_time ASC

UNION

-- Routine occurrences
SELECT ro.*, i.* 
FROM routine_occurrences ro
JOIN items i ON ro.routine_id = i.id
WHERE ro.user_id = $1
  AND ro.date = $2
  AND ro.scheduled_time IS NOT NULL
ORDER BY ro.scheduled_time ASC;
```

#### Generate Daily Review
```sql
-- Unscheduled todos from previous days
SELECT * FROM items
WHERE user_id = $1
  AND type = 'todo'
  AND created_date < $2
  AND scheduled_time IS NULL
  AND completed_at IS NULL
  AND cancelled_at IS NULL
ORDER BY created_date DESC

UNION

-- Timeless routine occurrences for today
SELECT ro.*, i.* 
FROM routine_occurrences ro
JOIN items i ON ro.routine_id = i.id
WHERE ro.user_id = $1
  AND ro.date = $2
  AND ro.scheduled_time IS NULL
  AND ro.completed_at IS NULL
  AND ro.skipped = FALSE;
```

#### Event Auto-Split Check
```sql
-- Check if items exist between event start and end
SELECT COUNT(*) FROM items
WHERE user_id = $1
  AND scheduled_time BETWEEN $2 AND $3
  AND id != $4
  AND cancelled_at IS NULL;

-- If count > 0, render as split
```

#### Full-Text Search
```sql
-- Search item content
SELECT * FROM items
WHERE user_id = $1
  AND to_tsvector('english', content) 
      @@ plainto_tsquery('english', $2)
ORDER BY created_at DESC
LIMIT 50;
```

#### Tag Search
```sql
SELECT * FROM items
WHERE user_id = $1
  AND $2 = ANY(tags)
ORDER BY created_at DESC
LIMIT 50;
```

### API Endpoints (REST or GraphQL)

```graphql
# Queries
thoughtsByDate(date: Date!): [Item!]!
timelineByDate(date: Date!): [Item!]!
dailyReview(date: Date!): DailyReview!
searchThoughts(query: String!): [Item!]!
searchTimeline(query: String!): [Item!]!
item(id: ID!): Item
subItems(parentId: ID!): [Item!]! # Get all sub-items of a note

# Mutations
createItem(input: CreateItemInput!): Item!
updateItem(id: ID!, input: UpdateItemInput!): Item!
deleteItem(id: ID!): Boolean!
completeItem(id: ID!): CompletionResult!
cancelItem(id: ID!): Boolean!
scheduleItem(id: ID!, time: DateTime!): Item!

# Note Sub-Items
createSubItem(parentId: ID!, input: CreateItemInput!, level: Int!): Item!
indentItem(itemId: ID!): Item! # Increase depth level
outdentItem(itemId: ID!): Item! # Decrease depth level
reorderSubItems(parentId: ID!, order: [ID!]!): [Item!]!

# Daily Review actions
rescheduleFromReview(itemId: ID!, time: DateTime!): Item!
completeFromReview(itemId: ID!): CompletionResult!
cancelFromReview(itemId: ID!): Boolean!

# Subtasks (for todos only)
createSubtask(parentId: ID!, content: String!): Item!
updateSubtaskOrder(parentId: ID!, order: [ID!]!): [Item!]!

# Routines
createRoutineOccurrence(routineId: ID!, date: Date!): RoutineOccurrence!
completeRoutineOccurrence(occurrenceId: ID!): RoutineOccurrence!
```

### State Management

```typescript
// Global state structure (Zustand)
interface AppState {
  // User
  user: User | null;
  
  // Data
  currentDate: Date;
  thoughts: Item[];
  timeline: Item[];
  dailyReview: DailyReviewItem[];
  
  // UI
  activePane: 'thoughts' | 'times';
  searchOpen: boolean;
  searchQuery: string;
  searchResults: Item[];
  draggedItem: Item | null;
  
  // Actions
  setCurrentDate: (date: Date) => void;
  loadThoughts: (date: Date) => Promise<void>;
  loadTimeline: (date: Date) => Promise<void>;
  createItem: (input: CreateItemInput) => Promise<Item>;
  updateItem: (id: string, input: UpdateItemInput) => Promise<Item>;
  deleteItem: (id: string) => Promise<void>;
  // ... more actions
}
```

### Data Sync Strategy

**Local-First Approach:**

1. **Local Cache:**
   - IndexedDB (web) / SQLite (mobile)
   - All reads from local first
   - Instant UI updates

2. **Optimistic Updates:**
   - Update UI immediately
   - Sync to server in background
   - Rollback on error

3. **Sync Schedule:**
   - On app focus
   - After user action (debounced 3s)
   - Periodic (30s if dirty)
   - On network reconnect

4. **Conflict Resolution:**
   - Last-write-wins (timestamp-based)
   - User prompt for critical conflicts
   - Automatic merge for non-conflicting fields

**Implementation:**
```typescript
// Sync queue
class SyncQueue {
  private queue: SyncOperation[] = [];
  
  add(operation: SyncOperation) {
    this.queue.push(operation);
    this.debounceSync();
  }
  
  private debounceSync = debounce(() => {
    this.sync();
  }, 3000);
  
  private async sync() {
    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      try {
        await this.sendToServer(operation);
      } catch (error) {
        // Retry logic
        this.queue.unshift(operation);
        break;
      }
    }
  }
}
```

### Performance Optimizations

**1. Virtualized Lists:**
```typescript
// Only render visible items
import { useVirtualizer } from '@tanstack/react-virtual';

const thoughtsVirtualizer = useVirtualizer({
  count: thoughts.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 80, // Estimated item height
  overscan: 5 // Render 5 extra items
});
```

**2. Debounced Search:**
```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    performSearch(query);
  }, 300),
  []
);
```

**3. Cached Computations:**
```typescript
// Memoize Daily Review generation
const dailyReview = useMemo(() => {
  return generateDailyReview(thoughts, routines, currentDate);
}, [thoughts, routines, currentDate]);

// Memoize event split detection
const splitEvents = useMemo(() => {
  return detectSplitEvents(events, scheduledItems);
}, [events, scheduledItems]);
```

**4. Lazy Loading:**
```typescript
// Load 30 days at a time
const loadMoreDays = async () => {
  const startDate = addDays(oldestLoadedDate, -30);
  const endDate = oldestLoadedDate;
  const items = await fetchItemsBetween(startDate, endDate);
  prependToThoughts(items);
};
```

**5. Index Usage:**
```sql
-- Ensure indexes exist for common queries
CREATE INDEX idx_user_created_date ON items(user_id, created_date);
CREATE INDEX idx_scheduled_time ON items(scheduled_time);
CREATE INDEX idx_tags USING GIN(tags);
```

### Security Considerations

**Authentication:**
```typescript
// Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

// JWT stored in httpOnly cookie
// Refresh token rotation every 7 days
```

**Authorization:**
```sql
-- Row-level security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_items_policy ON items
  FOR ALL
  USING (user_id = auth.uid());

-- Users can only access their own items
```

**Data Validation:**
```typescript
// Zod schema validation
const CreateItemSchema = z.object({
  type: z.enum(['todo', 'event', 'routine', 'note']),
  content: z.string().min(1).max(10000),
  tags: z.array(z.string()).max(20),
  scheduledTime: z.date().optional(),
  // ... more fields
});

// Validate before DB insert
const validatedInput = CreateItemSchema.parse(input);
```

**XSS Prevention:**
```typescript
// Sanitize user content
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'u', 'a'],
  ALLOWED_ATTR: ['href']
});
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Basic capture and display

**Tasks:**
- [ ] Project setup (Vite + React + TypeScript)
- [ ] Install Tailwind CSS
- [ ] Create basic layout (header + two panes)
- [ ] Input field in Thoughts pane (AT BOTTOM)
- [ ] Prefix detection (t/e/r/n + space)
- [ ] Item display with symbols
- [ ] Timestamp on creation
- [ ] LocalStorage persistence
- [ ] Dark theme styling

**Success Criteria:**
- Can type and create items
- Items persist on refresh
- Symbols display correctly
- Input at bottom, items flow upward

### Phase 2: Timeline & Scheduling (Week 3-4)

**Goal:** Items can be scheduled

**Tasks:**
- [ ] Times pane implementation
- [ ] Time parsing from content
- [ ] Auto-schedule events/routines with time
- [ ] Drag and drop library setup (@dnd-kit)
- [ ] Drag from Thoughts to Times
- [ ] Drop zones on timeline
- [ ] Schedule item on drop
- [ ] Display scheduled items by hour
- [ ] Complete/uncomplete todos

**Success Criteria:**
- Drag item from left to right
- Item appears at chosen time
- Can mark todos complete
- Events auto-schedule from text

### Phase 3: Daily Review (Week 5)

**Goal:** Unfinished work surfaces

**Tasks:**
- [ ] Daily Review generation logic
- [ ] Calculate "waiting X days"
- [ ] Display unscheduled todos
- [ ] Display timeless routines
- [ ] Action buttons [↷] [✓] [×]
- [ ] Reschedule functionality
- [ ] Complete from review
- [ ] Cancel from review
- [ ] Auto-completion when all handled
- [ ] Pagination for 20+ items

**Success Criteria:**
- Unscheduled todos appear in review
- Can reschedule with time picker
- Can complete from review
- Daily Review auto-completes

### Phase 4: Tags & Search (Week 6)

**Goal:** Find and organize

**Tasks:**
- [ ] Tag extraction from #tags
- [ ] Tag display inline
- [ ] Click tag to filter (pane-specific)
- [ ] Search UI implementation
- [ ] Full-text search setup
- [ ] Search scope (active pane only)
- [ ] Result display
- [ ] Navigate to result
- [ ] Close search

**Success Criteria:**
- Tags extracted and displayed
- Clicking tag filters items
- Search finds relevant items
- Only searches active pane

### Phase 5: Subtasks (Week 7)

**Goal:** Nested todos

**Tasks:**
- [ ] Tab key handler for indent
- [ ] Shift+Tab for outdent
- [ ] Visual indent (24px)
- [ ] Parent-child relationship in DB
- [ ] Check parent checks children
- [ ] Drag parent brings children
- [ ] Display in Daily Review
- [ ] Metadata after subtasks
- [ ] Prevent grandchildren

**Success Criteria:**
- Can create subtasks with Tab
- Checking parent checks all
- Subtasks come along when dragging
- Max 1 level enforced

### Phase 6: Routines (Week 8-9)

**Goal:** Recurring tasks

**Tasks:**
- [ ] Recurrence pattern UI
- [ ] Routine occurrence generation
- [ ] Daily/weekly/monthly patterns
- [ ] Streak calculation
- [ ] Display streak on timeline
- [ ] Timeless routine handling
- [ ] Routine in Daily Review
- [ ] Missed occurrence tracking
- [ ] Edit routine frequency

**Success Criteria:**
- Can create daily/weekly routines
- Occurrences appear correctly
- Streak increments on completion
- Timeless routines in Daily Review

### Phase 7: Completion & Embedding (Week 10)

**Goal:** Advanced linking

**Tasks:**
- [ ] Completion linking logic
- [ ] Create completion entry
- [ ] CompletionLink table
- [ ] Display "completed on X"
- [ ] Display "from X"
- [ ] Navigate between linked items
- [ ] Uncomplete behavior
- [ ] Embed notes in todos
- [ ] Link preview for notes
- [ ] Broken link display

**Success Criteria:**
- Completed items link between days
- Can navigate between links
- Notes can be embedded in todos
- Broken links handled gracefully

### Phase 8: Events & Polish (Week 11-12)

**Goal:** Event handling + refinements

**Tasks:**
- [ ] Multi-hour event support
- [ ] Event split detection logic
- [ ] Display split events (⇤/⇥)
- [ ] Start/end linking
- [ ] Time parsing improvements
- [ ] Visual polish pass
- [ ] Empty states
- [ ] Hover states
- [ ] Animations (150ms transitions)
- [ ] Loading states

**Success Criteria:**
- Events split when items between
- Split events linked correctly
- UI feels polished
- Smooth transitions

### Phase 9: Real Database (Week 13-14)

**Goal:** Cloud persistence

**Tasks:**
- [ ] Supabase project setup
- [ ] Database schema migration
- [ ] User authentication
- [ ] Row-level security policies
- [ ] Switch from localStorage to Supabase
- [ ] Sync queue implementation
- [ ] Optimistic updates
- [ ] Conflict resolution
- [ ] Offline mode handling

**Success Criteria:**
- Data persists across devices
- Login/logout works
- Offline mode functional
- Syncing reliable

### Phase 10: Mobile Responsive (Week 15-16)

**Goal:** Works on phones

**Tasks:**
- [ ] Responsive breakpoints
- [ ] Swipeable panes
- [ ] Touch gesture detection
- [ ] Long-press drag
- [ ] Mobile tap targets (44px)
- [ ] Mobile-optimized spacing
- [ ] Virtual keyboard handling
- [ ] iOS Safari fixes
- [ ] Android Chrome fixes

**Success Criteria:**
- Smooth on iPhone/Android
- All features work via touch
- Performance good on mobile
- No layout issues

### Phase 11: Notifications (Week 17)

**Goal:** Timely alerts

**Tasks:**
- [ ] Push notification setup
- [ ] Service worker registration
- [ ] Notification permission request
- [ ] Schedule notifications for events
- [ ] Schedule notifications for routines
- [ ] Schedule notifications for deadlines
- [ ] Notification settings UI
- [ ] User preferences storage
- [ ] Dismiss handling

**Success Criteria:**
- Notifications arrive on time
- User can customize timing
- Dismissible without completing
- Works on desktop + mobile

### Phase 12: Polish & Launch (Week 18)

**Goal:** Production-ready

**Tasks:**
- [ ] Performance audit
- [ ] Accessibility audit (WCAG 2.1)
- [ ] Cross-browser testing
- [ ] Bug fixes from testing
- [ ] Documentation
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Landing page
- [ ] Beta user testing
- [ ] Deploy to production

**Success Criteria:**
- No critical bugs
- Accessible interface
- Fast performance
- Legal docs complete
- Ready for public use

---

## Testing Requirements

### Unit Tests

```typescript
// Item creation
describe('createItem', () => {
  it('should create todo with prefix "t "', () => {
    const item = parseInput('t buy milk');
    expect(item.type).toBe('todo');
    expect(item.content).toBe('buy milk');
  });
  
  it('should default to note without prefix', () => {
    const item = parseInput('random thought');
    expect(item.type).toBe('note');
  });
  
  it('should NOT create todo with "t" (no space)', () => {
    const item = parseInput('tell mom');
    expect(item.type).toBe('note');
  });
});

// Tag extraction
describe('extractTags', () => {
  it('should extract single tag', () => {
    const tags = extractTags('meeting #work');
    expect(tags).toEqual(['work']);
  });
  
  it('should extract multiple tags', () => {
    const tags = extractTags('project #work #urgent #client');
    expect(tags).toEqual(['work', 'urgent', 'client']);
  });
});

// Daily Review
describe('generateDailyReview', () => {
  it('should include unscheduled todos from previous days', () => {
    const review = generateDailyReview(items, new Date('2025-10-14'));
    expect(review).toContainEqual(
      expect.objectContaining({
        type: 'todo',
        scheduledTime: null,
        createdDate: '2025-10-12'
      })
    );
  });
  
  it('should calculate waiting days correctly', () => {
    const item = {
      createdDate: '2025-10-10',
      type: 'todo',
      scheduledTime: null
    };
    const waitingDays = calculateWaitingDays(item, new Date('2025-10-14'));
    expect(waitingDays).toBe(4);
  });
});

// Subtasks
describe('subtasks', () => {
  it('should check all children when parent checked', () => {
    const parent = { id: '1', subtasks: ['2', '3'] };
    const children = [
      { id: '2', completed: false },
      { id: '3', completed: false }
    ];
    
    const result = checkParent(parent, children);
    
    expect(result.every(c => c.completed)).toBe(true);
  });
  
  it('should prevent more than 1 level depth', () => {
    expect(() => {
      createSubtask(itemWithParent);
    }).toThrow('Maximum subtask depth exceeded');
  });
});

// Event splitting
describe('eventSplitting', () => {
  it('should split when items exist during event', () => {
    const event = {
      startTime: '2025-10-14T14:00',
      endTime: '2025-10-14T16:00'
    };
    const items = [
      { scheduledTime: '2025-10-14T15:00' }
    ];
    
    const shouldSplit = checkEventSplit(event, items);
    expect(shouldSplit).toBe(true);
  });
  
  it('should not split when no items during event', () => {
    const event = {
      startTime: '2025-10-14T14:00',
      endTime: '2025-10-14T16:00'
    };
    const items = [];
    
    const shouldSplit = checkEventSplit(event, items);
    expect(shouldSplit).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('Capture to Timeline Flow', () => {
  it('should auto-schedule event with time', async () => {
    // Create event
    const input = 'e standup 9am #work';
    const item = await createItem(input);
    
    // Check Thoughts
    const thoughts = await loadThoughts('2025-10-14');
    expect(thoughts).toContainEqual(item);
    
    // Check Timeline
    const timeline = await loadTimeline('2025-10-14');
    expect(timeline).toContainEqual(item);
    expect(item.scheduledTime.getHours()).toBe(9);
  });
});

describe('Daily Review to Completion Flow', () => {
  it('should complete item from Daily Review', async () => {
    // Setup unscheduled todo
    const todo = await createItem('t buy tickets');
    
    // Next day - appears in Daily Review
    const review = await generateDailyReview('2025-10-15');
    expect(review).toContainEqual(todo);
    
    // Complete from review
    await completeFromReview(todo.id);
    
    // Check original marked completed
    const original = await getItem(todo.id);
    expect(original.completedAt).toBeTruthy();
    
    // Check completion entry created
    const completionDay = await loadThoughts('2025-10-15');
    expect(completionDay).toContainEqual(
      expect.objectContaining({
        content: expect.stringContaining('(completed)'),
        completionLinkId: expect.any(String)
      })
    );
  });
});
```

### E2E Tests (Playwright)

```typescript
test('User can create and schedule todo', async ({ page }) => {
  await page.goto('/');
  
  // Input at bottom of Thoughts
  const input = page.locator('[placeholder="Type here..."]');
  await input.fill('t buy concert tickets');
  await input.press('Enter');
  
  // Check item appears in Thoughts
  await expect(page.locator('text=buy concert tickets')).toBeVisible();
  
  // Drag to timeline
  const item = page.locator('text=buy concert tickets');
  await item.hover();
  await page.mouse.down();
  
  const dropZone = page.locator('[data-hour="14"]');
  await dropZone.hover();
  await page.mouse.up();
  
  // Check appears on timeline
  const timeline = page.locator('[data-pane="times"]');
  await expect(timeline.locator('text=buy concert tickets')).toBeVisible();
});

test('Daily Review workflow', async ({ page }) => {
  // Create unscheduled todo yesterday
  await createItemInPast('t call dentist', -1);
  
  // Navigate to today
  await page.goto('/');
  
  // Check Daily Review appears
  await expect(page.locator('text=Daily Review')).toBeVisible();
  await expect(page.locator('text=call dentist')).toBeVisible();
  
  // Click reschedule
  await page.locator('[data-action="reschedule"]').first().click();
  
  // Select time
  await page.locator('[data-hour="15"]').click();
  
  // Check item scheduled
  const timeline = page.locator('[data-pane="times"]');
  await expect(timeline.locator('text=call dentist')).toBeVisible();
  
  // Check removed from Daily Review
  await expect(page.locator('text=Daily Review')).not.toBeVisible();
});
```

### Manual Test Checklist

**Capture:**
- [ ] Type with prefix "t " creates todo
- [ ] Type with prefix "e " creates event
- [ ] Type with prefix "r " creates routine
- [ ] Type without prefix creates note
- [ ] Prefix without space (e.g., "tell") does NOT trigger
- [ ] Tags extracted from #tags
- [ ] Items appear above input (oldest to newest)
- [ ] Input stays at bottom

**Daily Review:**
- [ ] Appears when unscheduled todos exist
- [ ] Shows "waiting X days" counter
- [ ] Action buttons work: [↷] [✓] [×]
- [ ] Auto-completes when all items handled
- [ ] Cannot manually check until all handled
- [ ] Pagination works for 20+ items
- [ ] Timeless routines appear on scheduled days

**Timeline:**
- [ ] Events with time auto-schedule
- [ ] Routines with time auto-schedule
- [ ] Events split when items between start/end
- [ ] Events merge when items removed
- [ ] Deadline todos appear only on deadline day
- [ ] Hour slots display correctly

**Subtasks:**
- [ ] Tab creates subtask
- [ ] Shift+Tab returns to parent level
- [ ] Checking parent checks all children
- [ ] Cannot create grandchildren (depth limit)
- [ ] Dragging parent brings children
- [ ] Subtasks display in Daily Review

**Routines:**
- [ ] Daily routine generates occurrences
- [ ] Weekly routine generates on correct days
- [ ] Streak increments on completion
- [ ] Streak resets on skip
- [ ] Timeless routine appears in Daily Review
- [ ] Editing frequency creates new entry marked "(edited)"

**Completion:**
- [ ] Completing creates linked entries
- [ ] Links show "completed on X" and "from X"
- [ ] Clicking link navigates between days
- [ ] Unchecking reverts and reappears in review
- [ ] Deleting original deletes completion

**Embedding:**
- [ ] Can copy link from note
- [ ] Can paste link into todo
- [ ] Embedded note displays as card
- [ ] Deleting embedded note shows broken link

**Search:**
- [ ] Searches only active pane
- [ ] Text search works
- [ ] Tag search with # works
- [ ] Results navigate to item
- [ ] ESC closes search

**Drag & Drop:**
- [ ] Desktop: click and drag works
- [ ] Mobile: long-press and swipe works
- [ ] Drop zones appear during drag
- [ ] Item schedules at drop location
- [ ] Completed items not draggable

---

## Appendix: Complete Wireframes

### Desktop Main View (1440px)

```
┌──────────────────────────────────────────────────────────────────┐
│ Thoughts & Time               🔍 Search    [Oct 13, 2025 ▾]     │ 60px
├────────────────────────────────┬─────────────────────────────────┤
│         THOUGHTS               │            TIME                 │ 40px
├────────────────────────────────┼─────────────────────────────────┤
│                                │                                 │
│ ↑ Scroll up for earlier        │  ■ Daily Review                 │
│                                │    • Buy groceries (waiting 3)  │
│ 8:00 AM                        │      [↷] [✓] [×]                │
│ ↝ Morning thoughts             │                                 │
│   * Main point                 │  ──────────────────             │
│     * Sub-point                │                                 │
│       * Detail                 │  7:00 AM                        │
│   #personal                    │  ↻ Morning meditation           │
│                                │    (Streak: 12)                 │
│ 10:30 AM                       │                                 │
│ □ Buy concert tickets          │  9:00 AM                        │
│   #concert                     │  ↹ Team standup #work           │
│                                │                                 │
│ 11:45 AM                       │  2:00 PM                        │
│ □ Plan conference trip #work   │  ⇤ Deep work (2-4 PM) #focus    │
│   □ Book flights               │                                 │
│   □ Reserve hotel              │  3:00 PM                        │
│   Due: Oct 20, 5pm             │  □ Quick call #work             │
│                                │                                 │
│ 2:15 PM                        │  4:00 PM                        │
│ ↝ Great article [▾]            │  ⇥ Deep work (end) #focus       │
│   example.com                  │                                 │
│   #reading                     │  ↓ Scroll                       │
│                                │                                 │
│ ↓ Newest items                 │                                 │
│                                │                                 │
├────────────────────────────────┤                                 │
│ [Type here...]                 │                                 │
│ ↑ INPUT AT BOTTOM              │                                 │
└────────────────────────────────┴─────────────────────────────────┘
  720px (50%)                      720px (50%)
```

### Mobile Main View - Thoughts (375px)

```
┌───────────────────────┐
│🔍 ← THOUGHTS|TIME → ▾ │ 56px
├───────────────────────┤
│ Oct 13, 2025          │ 32px
├───────────────────────┤
│                       │
│ ↑ Scroll up           │
│                       │
│ 8:00 AM               │
│ ↝ Morning thoughts    │
│   □ Task item         │
│     ↝ Sub-note        │
│   #personal           │
│                       │
│ 10:30 AM              │
│ □ Buy tickets         │
│   #concert            │
│                       │
│ 2:15 PM               │
│ ↝ Latest note         │
│                       │
│ ↓ Newest              │
│                       │
├───────────────────────┤
│ [Type here...]        │
│ ↑ INPUT BOTTOM        │
└───────────────────────┘

Swipe → for Time
```

### Mobile Main View - Times (375px)

```
┌───────────────────────┐
│🔍 ← THOUGHTS|TIME → ▾ │ 56px
├───────────────────────┤
│ Oct 13, 2025          │ 32px
├───────────────────────┤
│                       │
│ ■ Daily Review        │
│   • Buy groceries (3) │
│     [↷] [✓] [×]       │
│                       │
│ ───────────────       │
│                       │
│ 7:00 AM               │
│ ↻ Meditation          │
│   (Streak: 12)        │
│                       │
│ 9:00 AM               │
│ ↹ Standup #work       │
│                       │
│ 2:00 PM               │
│ □ Report #work        │
│                       │
│ ↓ Scroll              │
└───────────────────────┘

Swipe ← for Thoughts
```

---

## Final Notes for Developer

### Critical Implementation Points

1. **Input at bottom** - Most important UX change from typical apps
2. **Prefix requires space** - "t " not "t" (strict parsing)
3. **Oldest to newest** - Items flow upward in Thoughts
4. **Daily Review auto-completion** - Only when ALL items handled
5. **Event splitting is dynamic** - Recalculate on every render
6. **Todo subtasks: max depth 1, todos only** - No prefixes, always todos
7. **Note sub-items: max depth 2, any type** - Use prefixes `* ` `t ` `e ` `r `
8. **Org Mode inspiration** - Freedom to mix types within notes
9. **Search scope** - Never both panes simultaneously
10. **Drag prohibition** - Cannot drag from Time to Thoughts
11. **Completion linking** - Always create both entries + link
12. **Waiting days** - Calculate from created_date, not scheduled_time
13. **Hierarchy validation** - Enforce depth limits and type constraints
14. **Order preservation** - Use order_index for sub-item sequencing **Bullet point creation** - Use `*` + space, Tab/Shift+Tab for indent/outdent

### Design System Enforcement

- Spacing: Use 8px grid (6/12/16/24/32/48/64)
- Colors: Only #0A0A0A / #F5F5F5 / #6A6A6A / #1A1A1A
- Symbols: 18px size (same as body text)
- Transitions: 150ms for hovers, 100ms for presses
- Fonts: "Crimson Text" serif for all content
- Timestamps: "Courier Prime" monospace
- Line height: 1.7 (generous for book-like reading)
- Margins: 48px (desktop), 24px (mobile) - book-like margins
- Borders: Square corners (border-radius: 0) - clean, literary aesthetic

### Performance Targets

- Initial load: < 2s
- Search results: < 500ms
- Drag responsiveness: < 16ms (60fps)
- Timeline scroll: 60fps smooth
- Database query: < 100ms average

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Android 90+

---

**END OF SPECIFICATION**

**Version:** 1.2  
**Pages:** ~90  
**Last Updated:** October 14, 2025  
**App Name:** Thoughts & Time

**Key Changes in v1.2:**
- Renamed "Times pane" to "Time pane" throughout
- App name changed from "Thoughts & Times" to "Thoughts & Time"
- **Note sub-items system:** Notes can contain ANY item type (notes, todos, events, routines) up to 2 levels deep
- **Todo subtasks remain separate:** Todos have subtasks (todos only, 1 level max)
- Updated database schema with `parent_type`, `depth_level` fields
- Removed bullet_points table (now using unified items hierarchy)
- Added sub-item creation/management API endpoints
- Updated all wireframes to show note sub-items with mixed types
- Clarified hierarchy rules: todos (1 level, todos only) vs notes (2 levels, any type)
- Added comprehensive edge cases for note sub-items
- Updated testing requirements

**Two Hierarchy Systems:**
1. **Todo Subtasks:** Parent todo → child todos (max 1 level), checking parent checks children
2. **Note Sub-Items:** Parent note → any type of items → any type of items (max 2 levels), independent items

This document contains everything needed to build Thoughts & Time. All features, behaviors, edge cases, and technical requirements are specified. Ready for development with Claude Code or any development team.
