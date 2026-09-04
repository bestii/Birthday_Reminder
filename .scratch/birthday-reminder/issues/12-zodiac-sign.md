# Zodiac sign display

Status: resolved
Type: grilling
Blocked by: 06

## Question

How does zodiac sign work? Resolve: (a) is it computed from a person's birth date, an event's date, or both; (b) is there a global show/hide toggle, a per-person toggle, or both; (c) where does it appear (home card, detail view, calendar); and (d) what is the default state?

## Answer

- **Source**: Person's birth date only (a person attribute, not per-event).
- **Computation**: month + day only — works without a birth year.
- **Show/hide**: global toggle only (one setting, no per-person override).
- **Placement**: detail view only (shown when you tap into a person).
- **Default**: off — user opts in.
