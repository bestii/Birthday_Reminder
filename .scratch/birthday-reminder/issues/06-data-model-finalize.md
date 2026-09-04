# Finalize the person-centric data model

Status: resolved
Type: grilling

## Question

Finalize the entity relationships and field set: Person (name, photo, optional birth date, groups) as core; Event always attached to a Person with type (Birthday/Anniversary/Memorial/custom) and date; custom event types are user-defined. Resolve remaining edge cases including couple/group anniversaries and whether events can carry their own notes only.

## Answer

**Entities and invariants**

- **Person** — `id`, `name`, `photo_path` (nullable), `birth_date` (nullable full date, year optional), created/updated timestamps. Invariant: every Person has **at least one Event**.
- **Event** — `id`, `person_id` (FK, required), `event_type_id` (FK), `date` (month+day; full date if year known), `notes` (nullable). Always attached to a Person.
- **Event Type** — `id`, `name`, `is_builtin`. Built-ins: Birthday, Anniversary, Memorial (fixed, not renamable/deletable). Users can add custom types; each Event picks exactly one type.
- **Group** — `id`, `name`. Many-to-many with Person via `person_group` join.
- **Notification Rule** — per ticket 05 (timing + time + group filter).

**Derived vs stored**

- Birthday is the **default Event** created alongside a Person (or when a birth date is set); it's a stored row, not purely derived. It may be removed only if at least one other Event remains — the invariant is enforced at create/delete time.
- **Days remaining** = time until the person's next Birthday event. **Age** = age they'll turn on the next birthday, shown only when the year is known.

**Storage shape**

- One nullable `birth_date` (year optional) — the UI year-toggle only controls whether a known year is shown.
- Single-person events only in v1; multi-person (couple/group) anniversaries are out of scope. A couple is represented by attaching the anniversary to one Person.

**Schema direction** (from ticket 02): `person`, `event_type`, `group`, `event`, `notification_rule`, `person_group`; `event.person_id → person.id`; `event.event_type_id → event_type.id`; `PRAGMA foreign_keys = ON` + WAL.
