# Calendar screen prototype

Status: resolved
Type: prototype
Blocked by: 03, 06

## Question

What should the Calendar screen look and feel like? Produce a rough prototype of the monthly calendar with highlighted dates, tap-to-view-events, add-from-calendar, and the events list below.

## Answer

**Variant B wins** (month + selected-day cards), refined:

- Month calendar grid with prev/next nav.
- **Today** clearly marked (ring around the date), distinct from the filled selected day.
- Dates with events get a **uniform neutral dot** — no per-type coloring (avoids ambiguity when a day has multiple event types).
- Below the calendar: a date header row ("Feb 12 — Today") with an **add-event `+` button beside the date label** (always visible regardless of list length).
- Selected-day event cards only (avatar, name, meta, type chip), plus a floating `+` FAB.

Prototype asset: `.scratch/birthday-reminder/prototypes/calendar-screen.html`.
