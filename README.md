# Thoughts & Time

A timeline-first productivity app that organizes life chronologically.

## Features Implemented (MVP)

✅ **Capture System**
- Type with prefixes: `t ` (todo), `e ` (event), `r ` (routine), or just type for notes
- Natural language date/time parsing with Chrono
- Automatic tag extraction from `#tags`
- Input at bottom of Thoughts pane (journal metaphor)

✅ **Two-Pane Layout**
- **Thoughts pane** (left): Chronological journal of everything captured today
- **Time pane** (right): Timeline of scheduled items organized by hour

✅ **Smart Scheduling**
- Events/todos with times automatically appear on timeline
- Items without specific times appear in "(no time)" section
- Natural language parsing: "tomorrow 2pm", "next Friday", "in 3 days"

✅ **Literary Design**
- Crimson Text serif font for book-like reading experience
- Dark theme (#0A0A0A background)
- Generous spacing and line height (1.7)
- Minimal, focused interface

✅ **Item Types**
- **Todos**: Tasks with optional deadlines
- **Events**: Time-bound occurrences
- **Routines**: Recurring tasks
- **Notes**: Thoughts and ideas

✅ **Persistence**
- localStorage saves all your data automatically

## Running the App

The development server is already running at: **http://localhost:5173/**

Open this URL in your browser to use the app.

### To restart the server later:

```bash
cd /home/user/Thoughts-Time
npm run dev
```

## How to Use

### Creating Items

Type in the input field at the bottom of the Thoughts pane:

- `t buy concert tickets` → Creates a todo
- `e meeting tomorrow 2pm` → Creates event, automatically scheduled for 2pm tomorrow
- `r morning workout 7am` → Creates routine, appears daily at 7am
- `interesting idea #brainstorm` → Creates note with tag

### Completing Todos

Click the `□` symbol to toggle completion. Completed items show as `☑` with strikethrough.

### Natural Language Examples

- `e team lunch next Friday at noon`
- `t call mom by tomorrow`
- `r weekly review every Monday`
- `e conference Oct 15-17`
- `t finish report in 3 days`

### Navigation

- **Thoughts pane**: Shows all items created today (oldest at top, newest at bottom)
- **Time pane**: Shows scheduled items organized by time
- Items with times appear in both panes

## Next Steps (Not Yet Implemented)

- Daily Review system
- Drag & drop scheduling
- Todo subtasks
- Note sub-items (Org Mode style)
- Event auto-splitting
- Routine occurrences and streaks
- Completion linking
- Search functionality
- Date navigation
- Undo/Redo (Cmd+Z)

## Technical Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **NLP**: Chrono (natural language date parsing)
- **Dates**: date-fns
- **Storage**: localStorage (will migrate to Supabase later)

## Design Philosophy

> "Your life is a timeline. Organize it that way."

The app treats time as the organizing principle, not projects or categories. The serif typography and generous spacing create a calm, book-like experience that encourages thoughtful writing and reflection.

---

**App Status**: MVP Core Features Working ✅

Open http://localhost:5173/ to start using Thoughts & Time!
