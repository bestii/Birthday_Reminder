## Destination

A locked, buildable spec plus domain glossary for a local-first birthday & events reminder app (Expo managed, Android-first) — data model, notification engine, calendar, backup/restore, and settings all decided, with no login or cloud sync in v1.

## Notes

- Domain: local-first React Native app, Android first (iOS later via Expo).
- Skills every session should consult: /grilling, /domain-modeling.
- Tracker: local-markdown (`.scratch/`). No `gh` CLI on this machine.
- Standing preferences: person-centric model; everything recurs annually in v1; no login; profile photos bundled in backup; keep v1 minimal.

## Decisions so far

<!-- one line per closed ticket -->

## Not yet specified

- Couple/group anniversaries: an event whose date belongs to two people (how is the date stored and displayed?).
- "Days remaining" edge cases: birthday passed today, leap-day (Feb 29) handling.
- Notification timezone handling when the device changes timezones.
- Backup format versioning / forward migration.
- Notification deep-link into a specific event or person.

## Out of scope

- Google login / cloud sync (v1 is local-first; no account).
- Google Contacts import (v2 candidate).
- iOS build (future effort; Expo keeps the door open).
- One-off (non-annual) events (v1 is annual-only).
