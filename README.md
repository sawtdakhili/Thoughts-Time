<p align="center">
  <img src="logo.png" alt="Thoughts & Time" width="250" />
</p>

<p align="center">
  <a href="https://www.gnu.org/licenses/agpl-3.0"><img src="https://img.shields.io/badge/License-AGPL%20v3-blue.svg" alt="License: AGPL v3" /></a>
</p>

<p align="center">
  <strong>Capture thoughts. Plan time. All in one place.</strong>
</p>

A simple productivity app with two panes: one for your thoughts (notes, tasks, ideas), and one for your timeline (what's scheduled, what's coming up). Everything syncs automatically and works offline.

**🌐 Live at: [thoughtsandtime.vercel.app](https://thoughtsandtime.vercel.app)**

## Screenshots

### Desktop Interface (Book Mode)

![Thoughts & Time App](screenshot.png)

*The dual-pane interface showing the Thoughts pane (left) with notes and tasks, and the Time pane (right) with the timeline and Daily Review.*

### Mobile Interface (Infinite Scroll Mode)

<p align="center">
  <img src="screenshot-mobile-thoughts-updated.png" width="45%" alt="Thoughts Pane - Mobile" />
  <img src="screenshot-mobile-time-updated.png" width="45%" alt="Time Pane - Mobile" />
</p>

*Mobile views in infinite scroll mode showing the floating date header at the top. Left: Thoughts pane with all item types (notes, tasks, events) arranged chronologically. Right: Time pane with scheduled items and Daily Review section displaying incomplete tasks from previous days. Both panes feature swipe navigation and touch-optimized controls.*

---

## 🚀 Try It Now

### **[thoughtsandtime.vercel.app](https://thoughtsandtime.vercel.app)**

- ✅ No sign-up required
- ✅ Works on all devices (desktop, tablet, mobile)
- ✅ Data stays private (local-first)
- ✅ Install as an app (PWA)

**Quick start**: Visit the link above, type `t buy milk at 5pm` in the input box, press Enter. That's it.

---

## ✨ Key Features

- 🎯 **Dual-Pane Design** - Thoughts on left, timeline on right
- 🗣️ **Natural Language** - "meeting tomorrow at 2pm" just works
- 📵 **Works Offline** - Everything stored locally, syncs optionally
- 🔔 **Smart Notifications** - Reminders before events (5-60 minutes)
- ⌨️ **Keyboard-First** - Quick input with prefixes (t, e, r, n)
- 🌙 **Dark Mode** - Easy on the eyes, respects system preference
- 📱 **Mobile Optimized** - Swipe gestures, touch-friendly, PWA support
- 🔒 **Privacy-Focused** - Guest mode keeps everything local
- ☁️ **Optional Sync** - Cross-device with Supabase (free account)
- 🐳 **Self-Hostable** - Run your own instance with Docker

---

## Philosophy

**The Challenge**: Most productivity tools force a false choice—capture ideas OR schedule tasks. You can't do both well in the same place.

**Our Answer**: Two panes, one system.

### The Two Panes

**Thoughts (Left)** → Your stream of consciousness
- Capture ideas as they come
- Notes, tasks, reflections
- Thinking, not just doing

**Time (Right)** → Your timeline
- See your day unfold
- What's scheduled, what's coming
- Structure without pressure

**The magic**: An idea becomes a task. A task spawns thoughts. Notes provide context for scheduled work. Everything flows naturally between the two panes.

### Core Principles

**Minimal Friction** → Type `t buy milk at 5pm` and you're done. No forms, no clicking through menus.

**Natural Language** → Write "meeting tomorrow at 2pm" - the app understands.

**Emergent Structure** → Nest items with Tab. Structure emerges from your thinking, not imposed categories.

**Two Modes of Engagement**:
- **Infinite Scroll** → Flow state. Capture everything as it comes. See all days at once.
- **Book Style** → Focused reflection. One day at a time, like turning pages in a journal.

**Typography Matters** → Serif fonts for content (easier to read, feels like writing). Monospace for metadata (clear, functional, distinct).

---

**This app doesn't prescribe methodology.** It won't tell you to "optimize yourself." Instead, it provides clean space where:
- Thoughts can exist without immediately becoming tasks
- Tasks don't lose their context
- Time provides structure without creating pressure
- The past informs the future without constraining it

Use it as a journal, a task manager, or both. The tool adapts to your thinking, not the other way around.

---

## How to Use

### Quick Start

1. **Adding Items**: Click the input box at the bottom of the Thoughts pane. Type your item with a prefix:
   - `t buy milk` → Creates a todo
   - `e team meeting` → Creates an event
   - `r exercise` → Creates a routine
   - `my thought` or `* my thought` → Creates a note (no prefix needed for top-level notes)

2. **Need a reminder?** Click the **?** button in the header (next to the search icon) to open a quick-reference panel showing all prefixes, their symbols, and example usage.

3. **Adding Time**: Include time naturally in your text:
   - `t buy milk at 5pm`
   - `e team meeting from 2pm to 3pm`
   - `t submit report on Friday`

4. **Nesting Items**: Use indentation (Tab key) to create subtasks or subnotes:
   ```
   t plan party
       t book venue
       t send invitations
       * remember to check dietary restrictions
   ```

### Item Types

**Todos (t)**: Tasks to be completed. Show up in the timeline when scheduled.
- Checkbox symbol: □ (unchecked) / ☑ (checked)
- Click the checkbox to mark complete
- Can have subtasks

**Events (e)**: Time-bound occurrences with start and end times.
- Symbol: ↹
- Always appear in the timeline
- Can span duration ("from 2pm to 4pm")

**Routines (r)**: Recurring activities.
- Symbol: ↻
- Can recur daily, weekly, monthly
- Examples: "every day", "every Monday", "first Tuesday of each month"

**Notes (no prefix or *)**: Thoughts, ideas, references.
- Symbol: ↝
- Never appear in the timeline
- Can have subnotes for elaboration
- Use `*` prefix only for subnotes

### Editing Items

Hover over any item and click the edit icon (✎). The item appears with its symbol in an editable text box:

- **Change the type**: Delete the symbol and type a new prefix letter + space
  - Type `t ` and it converts to `□ `
  - Type `e ` and it converts to `↹ `
  - Type `r ` and it converts to `↻ `
  - Type `* ` and it converts to `↝ `

- **Revert during editing**: Backspace after a symbol converts it back to the prefix letter for easy editing

- **Time prompts**: If you convert an item to a todo/event/routine without specifying a time, you'll be prompted to add one

- **Save**: Press Enter or click ✓
- **Cancel**: Press Escape or click ✕

### View Modes

**Infinite Scrolling** (Default):
- See all days at once (30 days past to 30 days future)
- Scroll seamlessly through your timeline
- Snap-to-day sections for easy navigation
- Great for capturing and planning

**Book Style**:
- One day per "page"
- Scroll to the top or bottom and keep scrolling to flip to previous/next day
- Page-turn animation (like flipping pages in a book)
- Each pane can show different days independently
- Perfect for focused daily review

Switch between modes in Settings (⚙️ icon in header).

### Search

Click the search icon (🔍) in the header to filter items across all days. The search works on:
- Item content
- Tags (use #tag in your items)
- Nested items (searching finds parent items too)

### Themes

Choose your visual preference in Settings:
- **Light**: Clean, bright interface
- **Dark**: Easy on the eyes
- **System**: Automatically matches your OS preference

### Mobile Experience

The app is fully optimized for mobile devices (phones and tablets):

**Single-Pane Navigation**:
- On screens < 768px, view one pane at a time
- Swipe left/right to switch between Thoughts and Time
- Footer navigation with active pane indicator

**Touch-Optimized**:
- Floating Action Button (FAB) for quick capture
- Bottom sheet for input (slides up from bottom)
- All buttons meet 44px minimum touch target size
- Haptic feedback on interactions (where supported)

**Smart Keyboard Handling**:
- Footer automatically hides when keyboard appears
- Optimized input layouts for touch typing
- iOS safe area support for notched devices

See [MOBILE_IMPLEMENTATION.md](./MOBILE_IMPLEMENTATION.md) for complete mobile documentation.

### Tags

Add tags anywhere in your text with `#tagname`:
- `t review #work #quarterly report`
- `interesting thought #philosophy #book-ideas`
- Tags appear below the item in smaller text
- Fully searchable

### Deleting Items

Hover over any item and click the delete icon (×). You'll be asked to confirm before deletion.

## Advanced Features

### Natural Language Time Parsing

The app understands various time expressions:

- **Absolute**: "tomorrow at 3pm", "Friday at noon", "Oct 15"
- **Relative**: "in 2 hours", "in 30 minutes", "in 3 days"
- **Ranges**: "from 2pm to 4pm", "between 10am and 12pm"

### Nested Structure

Create hierarchies by indenting (press Tab):

```
t launch website
    t design mockups
        * consider mobile-first approach
    t write copy
    t test on staging
```

Subtasks and subnotes create rich context for your work.

### Keyboard Shortcuts

- **Enter**: Submit new item (in input box) or save edit (when editing)
- **Escape**: Cancel editing
- **Tab**: Indent (create nested item)
- Type prefix + space: Convert to symbol (works in input and when editing)

### Notifications

Stay on top of your schedule with browser notifications:

- **Event Reminders**: Get notified before events start (configurable: 5, 10, 15, 30, or 60 minutes before)
- **Routine Reminders**: Notifications at your routine's scheduled time
- **Auto-Scheduling**: Notifications are automatically scheduled when you create or update items
- **Browser-Based**: Uses the Push API with Service Worker support (no external dependencies)

**Setup**: Go to Settings (⚙️) and enable notifications. You'll be prompted to grant browser permission. Then choose your reminder preferences.

## Tips for Effective Use

1. **Start each day in Book Style**: Review yesterday, plan today with focused attention.

2. **Capture in Infinite mode**: Let thoughts flow without day boundaries. See the bigger picture.

3. **Use notes liberally**: Context is valuable. Document your thinking, not just your tasks.

4. **Nest for structure**: Break complex tasks into steps. Elaborate on ideas with subnotes.

5. **Edit freely**: Change types, update times, refine wording. Your system should evolve with your thinking.

6. **Tags are for finding, not organizing**: Don't stress about tag hierarchies. Use tags to make things findable later.

7. **Let the timeline guide you**: In the Time pane, see what's coming up. Let it inform your priorities without creating pressure.

---

## Install as an App

Thoughts & Time works as a Progressive Web App (PWA) - install it for a native app experience:

### Desktop (Chrome/Edge)
Click the install icon (⊕) in the address bar when visiting the app.

### Android
1. Open the app in Chrome
2. Tap the menu (⋮)
3. Select "Add to Home Screen"

### iOS
1. Open the app in Safari
2. Tap the Share button (□↑)
3. Select "Add to Home Screen"

**Benefits of installing:**
- Works offline (all your data stays local)
- Faster loading (cached on your device)
- Native app feel (no browser UI)
- Easy access from home screen/dock

---

## For Developers

Want to contribute or run locally? See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup instructions.

## Technical Stack

- **Frontend**: React 19 + TypeScript 5.9
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand with persistence
- **Date Parsing**: Chrono (natural language understanding)
- **Date Utilities**: date-fns
- **Editor**: CodeMirror 6
- **Backend**: Supabase (PostgreSQL, authentication, real-time sync)
- **Notifications**: Push API with Service Worker support
- **Storage**: localStorage (guest mode) or Supabase (authenticated mode)

## Data Storage

**Guest Mode**: All your data is stored locally in your browser's localStorage. Nothing is sent to a server. Your thoughts and tasks stay on your machine.

**Authenticated Mode** (optional): When you create an account, your data syncs to Supabase (PostgreSQL database) for cross-device access and backup. You can switch between guest and authenticated modes at any time.

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

**What this means:**
- ✅ You can use, modify, and distribute this software (including commercially)
- ✅ If you run a modified version as a network service, you must make the source code available
- ✅ You must give appropriate credit to "Thoughts & Time by Sawt Dakhili"
- ↪️ Any modifications must also be licensed under AGPL-3.0
- 🔓 This is OSI-approved open source software

See the [LICENSE](LICENSE) file for details or visit [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html).

**Copyright © 2025 Sawt Dakhili**

---

## Deployment Options

### 🌐 Hosted Service (Live Now!)
**Try it now at [thoughtsandtime.vercel.app](https://thoughtsandtime.vercel.app)**
- ✅ **Free to use** - No credit card required
- ✅ Automatic backups and sync across devices (with account)
- ✅ Always up-to-date with latest features
- ✅ Works in guest mode or create an account
- ✅ PWA installable on all devices

**Features:**
- Guest mode: Works offline with localStorage
- Authenticated mode: Sync across devices with Supabase
- Cross-device sync, real-time updates
- Email/password authentication

### 🆓 Self-Hosted (Available Now!)
Run your own instance using Docker:
- Complete control over your data
- Full Supabase stack included (PostgreSQL, Auth, Storage, Real-time)
- No usage limits
- One-command deployment
- Automated backups included
- See [SELF_HOSTING.md](SELF_HOSTING.md) for complete guide

**Quick Start**:
```bash
git clone https://github.com/yourusername/thoughts-time.git
cd thoughts-time
cp .env.example .env
# Edit .env with your configuration
docker-compose up -d
```

Access your instance at `http://localhost:3000`

---

**Status**: Production Ready ✅ | **Live**: https://thoughtsandtime.vercel.app 🚀

*Built with care for thoughtful work.*
