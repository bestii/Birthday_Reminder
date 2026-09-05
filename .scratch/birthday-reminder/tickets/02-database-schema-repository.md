# 02 — Database schema & repository

**What to build:** The SQLite layer — schema for `person`, `event`, `event_type`, `group`, `notification_rule`, and the `person_group` join — with migrations keyed by `user_version`, WAL and foreign keys enabled, built-in event types seeded (Birthday, Anniversary, Memorial), and typed CRUD for every entity. The repository enforces "every Person has at least one Event" and "single-person events only".

**Blocked by:** 01 — App scaffold & navigation shell

**Status:** ready-for-agent

- [ ] Opening the app creates/migrates the schema idempotently; `user_version` bumps cleanly.
- [ ] WAL and `PRAGMA foreign_keys = ON` are active.
- [ ] Built-in event types (Birthday, Anniversary, Memorial) are seeded and non-deletable/non-renamable.
- [ ] CRUD for person, event, event_type, group, notification_rule, and person_group works with FK constraints.
- [ ] Creating a Person always creates a default Birthday event; deleting a Person's last Event is prevented.
- [ ] Deleting a Person cascades to its Events and group links.
