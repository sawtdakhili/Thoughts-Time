# I built a productivity app with one rule: if it's not scheduled, it won't get done

Hey r/productivity,

I built a personal productivity app based on a controversial belief: **unscheduled tasks don't get done**. They sit in "someday/maybe" lists forever, creating guilt while you ignore them.

So I made something stricter than GTD. No inbox. No weekly review. Just daily accountability.

## How it works: Two panes

![Screenshot](screenshot.png)

**Left pane (Thoughts)**: Your journal. Write anything as it comes - notes, ideas, tasks. Chronological, like a diary.

**Right pane (Time)**: Your timeline. The app extracts all time-sensitive items from your thoughts and puts them in a schedule.

You can be messy in your thinking (left), but your commitments are crystal clear (right).

## The forcing function: Daily Review

Every morning, the Time pane shows **Daily Review** - all your undone items from the past. You must deal with each one:

- ✓ Mark done (if you forgot)
- ↷ Reschedule
- × Cancel permanently

If you keep rescheduling something, you'll see "10 days old" staring at you. Eventually you either do it or admit you don't care.

Daily accountability, not weekly. No escape.

## Natural language scheduling

```
t buy milk at 5pm
t call mom Friday 2pm
e team meeting from 2pm to 3pm
```

Type it naturally. The app parses the time and schedules it automatically.

**The key**: When you write a task, you schedule it *right then*. The app forces you to answer "when will you do this?" You can't skip it.

## Two viewing modes

- **Infinite scroll**: See 30 days past/future at once
- **Book mode**: One day per page, flip like a journal

## My stance

If something matters enough to write down, it matters enough to schedule. No "I'll prioritize later." Either:
- Do it now (IRL)
- Schedule it for a specific time
- Don't write it down

This isn't for everyone. It's for people who know unscheduled work doesn't get done and want daily accountability instead of weekly reviews.

## Why I'm posting

I've used this daily for months and it changed how I work. But I don't know if this philosophy resonates with anyone else.

Is "schedule it or don't write it" too strict? Do you also believe unscheduled tasks are just guilt generators? Or am I solving a problem only I have?

If this resonates, I'll keep improving it. It's open source, no backend, local storage only.

**GitHub**: [link]

Would love honest feedback on both the philosophy and execution.

---

*Tech: React + TypeScript, natural language parsing with chrono-node, ~8k lines. Inspired by GTD but stricter.*
