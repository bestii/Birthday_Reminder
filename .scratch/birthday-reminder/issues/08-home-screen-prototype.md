# Home screen prototype

Status: resolved
Type: prototype
Blocked by: 06

## Question

What should the Home screen look and feel like? Produce a rough prototype (mockup or stub) of birthdays grouped by month, showing photo/name/birthday/days-remaining/groups, with Add Birthday / Add Event / Manage Groups quick actions.

## Answer

**Variant A wins** (list cards + FAB), with refinements:

- Header row: **hamburger (☰) on the left**, then **search icon**, then **filter icon** — all icon buttons, no inline search field.
- **Search** opens a collapsible input; typing filters the people list live by name.
- **Filter** opens a panel: 1st level **sort** (Date / A–Z), 2nd level **event type** (All events / Birthday / Anniversary / Memorial / custom).
- **Group pills** row sits just below the header (groups only, not event types).
- Body: birthdays **grouped by month** into cards (avatar, name, date, group tags, days-remaining), with a floating **+** FAB.

Prototype asset: `.scratch/birthday-reminder/prototypes/home-screen.html`.
