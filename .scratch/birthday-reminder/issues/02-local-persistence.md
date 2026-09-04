# Local persistence / storage choice

Status: resolved
Type: research

## Question

Which local storage library best fits the person/event/group/notification-rule data model (relational-ish, filter by group and type, sort by date and name)? Investigate primary sources for expo-sqlite / SQLite, MMKV, WatermelonDB, and AsyncStorage, and recommend one, considering Expo managed-workflow compatibility and future iOS.

## Answer

Use **`expo-sqlite` (SQLite)** — the only candidate that is relational *and* fully Expo managed/Expo Go compatible with no prebuild.

- Native SQL covers every required operation: `WHERE` (filter by group/type), `ORDER BY` (sort date/name), `JOIN` (person→events, person→groups), FKs, full CRUD, transactions.
- MMKV and AsyncStorage are key/value stores with no query/join layer (and MMKV is not in Expo Go). WatermelonDB needs native wiring and isn't in Expo Go.
- Future iOS is a non-issue; same schema/queries carry over. Also aligns with backup via `serialize`/`backupDatabase` and migrations via `PRAGMA user_version`.

Suggested schema direction: `person`, `event_type`, `group`, `event`, `notification_rule` tables plus `person_group` join; `event.person_id → person.id`; enable `PRAGMA foreign_keys = ON` and WAL.

Detail: `.scratch/birthday-reminder/research/02-local-persistence.md`.
