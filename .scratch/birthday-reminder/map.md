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
- [Zodiac sign display](issues/12-zodiac-sign.md) — from birth date (month+day only); global toggle, off by default; shown in detail view only.
- [Home screen prototype](issues/08-home-screen-prototype.md) — Variant A: hamburger+search+filter icons, group pills, month-grouped cards, expanding FAB (Add Birthday / Add Event / Manage Groups).
- [Calendar screen prototype](issues/09-calendar-screen-prototype.md) — Variant B: month grid + selected-day cards, today ring, uniform dots, add-event + beside date label.
- [Birthday detail view](issues/11-birthday-detail-view.md) — Variant A: image hero + person ellipsis, name/group/zodiac card, one tappable card per event.
- [Settings screen scope](issues/10-settings-screen.md) — hamburger has Settings/Notifications/Backup; date presets; theme system default; per-event year toggle; filters reset on open; expanding FAB.
- [Manage Groups screen](issues/13-people-groups-screen.md) — add/delete groups only; assignment lives in person detail; simple list + trash.
- [Days-remaining edge cases](issues/14-days-remaining-edge-cases.md) — "Today" for same-day; always count forward; Feb 29 observed Feb 28 in non-leap years.
- [Notification timezone handling](issues/15-notification-timezone.md) — reschedule pending notifications on timezone change at same local time; local-day boundaries.
- [Backup format versioning](issues/16-backup-format-versioning.md) — versioned JSON + base64 photos (v1); migrate old→new; reject new→old; revisit zip if large.
- [Notification deep-link](issues/17-notification-deeplink.md) — tap opens person's detail view; deep-link via id in payload.
- [Notification delivery & battery optimization](issues/18-notification-delivery-battery.md) — no background service; `USE_EXACT_ALARM` only (skip battery-exemption); schedule horizon N = 12 months.

## Not yet specified

<!-- none -->

## Out of scope

- Google login / cloud sync (v1 is local-first; no account).
- Google Contacts import (v2 candidate).
- iOS build (future effort; Expo keeps the door open).
- One-off (non-annual) events (v1 is annual-only).
- Custom avatar images within the app (v2; v1 uses camera/gallery photo).
- Couple/group anniversaries (v1 is single-person events only — see [Finalize the person-centric data model](issues/06-data-model-finalize.md)).
