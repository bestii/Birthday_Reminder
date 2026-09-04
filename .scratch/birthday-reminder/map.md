## Destination

A locked, buildable spec plus domain glossary for a local-first birthday & events reminder app (Expo managed, Android-first) — data model, notification engine, calendar, backup/restore, and settings all decided, with no login or cloud sync in v1.

## Notes

- Domain: local-first React Native app, Android first (iOS later via Expo).
- Skills every session should consult: /grilling, /domain-modeling.
- Tracker: local-markdown (`.scratch/`). No `gh` CLI on this machine.
- Standing preferences: person-centric model; everything recurs annually in v1; no login; profile photos bundled in backup; keep v1 minimal.

## Decisions so far

<!-- one line per closed ticket -->

- [Notification engine choice (expo-notifications vs Notifee)](issues/01-notification-engine.md) — use `expo-notifications` alone; declare `USE_EXACT_ALARM` manually; app-side layer computes "X days before" and schedules next N one-shot triggers.
- [Local persistence / storage choice](issues/02-local-persistence.md) — use `expo-sqlite` (SQLite); relational model, Expo Go compatible, same schema on iOS.
- [Calendar UI component choice](issues/03-calendar-component.md) — use `react-native-calendars`; pure JS, `markedDates` + `onDayPress` + `FlatList`.
- [Backup/restore via Android Storage Access Framework in Expo](issues/04-backup-saf-expo.md) — managed Expo can export/import via SAF directory picker + document picker; no eject, no native module needed for v1.
- [Notification rule semantics](issues/05-notification-rules.md) — rule = timing (0–30 days, 0=on-day) + per-rule time + group filter; one default (on-day 9:00 AM everyone); one event → one notification.
- [Finalize the person-centric data model](issues/06-data-model-finalize.md) — Person must have ≥1 Event; Birthday is default stored event; built-in types fixed; one nullable birth_date; single-person events only.
- [Search, filter, and sort semantics](issues/07-search-filter-sort.md) — controls only on Home header (search + filter + hamburger); sort date/A–Z; event-type filter then group pills; Calendar shows all.

## Not yet specified

- Couple/group anniversaries: an event whose date belongs to two people (how is the date stored and displayed?).
- "Days remaining" edge cases: birthday passed today, leap-day (Feb 29) handling.
- Notification timezone handling when the device changes timezones.
- Backup format versioning / forward migration.
- Notification deep-link into a specific event or person.
- Date format options: which formats are offered and where they apply.

## Out of scope

- Google login / cloud sync (v1 is local-first; no account).
- Google Contacts import (v2 candidate).
- iOS build (future effort; Expo keeps the door open).
- One-off (non-annual) events (v1 is annual-only).
- Custom avatar images within the app (v2; v1 uses camera/gallery photo).
