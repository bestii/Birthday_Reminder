# 13 — Notification scheduling engine

**What to build:** The app-side scheduler — seeds the default rule (on-day 9:00 AM, everyone) on first install, computes each rule's "X days before" fire date per event, schedules the next N one-shot triggers, and reschedules on launch / data change / timezone change at local time.

**Blocked by:** 02 — Database schema & repository; 03 — Domain utilities

**Status:** ready-for-agent

- [ ] Default rule seeded: on-day 9:00 AM, all groups (everyone).
- [ ] Rules compute fire dates: timing 0–30 (0 = on-day), per-rule time, group filter (none = everyone).
- [ ] One event → one notification (no collapsing multiple events).
- [ ] Next N one-shot triggers are scheduled per rule, where N = every matching event's next fire date within the coming 12 months (a named, tunable constant).
- [ ] Reschedules on launch, data change, and timezone change at the same local time.
- [ ] Notification permission is requested; a denied state degrades gracefully.
