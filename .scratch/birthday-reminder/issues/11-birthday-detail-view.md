# Birthday detail view

Status: resolved
Type: prototype
Blocked by: 06, 12

## Question

What should tapping a birthday card show? Candidate contents: profile picture, person name, event reason/type, assigned groups, zodiac sign (if enabled), days remaining, the person's age, and an overview of upcoming birthdays. Produce a rough prototype of this detail view.

## Answer

**Variant A wins**, refined:

- **Full-width image hero** with avatar centered, back button top-left, and a **person-level ellipsis (⋮)** top-right (Edit person / Assign to group / Delete person).
- **Person card** overlapping the hero: name + group chips + zodiac chip (when enabled).
- **One card per event** (tappable, no inline menu — tap opens the event edit screen where delete lives). Birthday card shows rich details: Born on (day + date), Next birthday (days + weekday + date), Turns (age), Zodiac.
- No per-event ellipsis.

Prototype asset: `.scratch/birthday-reminder/prototypes/birthday-detail-view.html`.
