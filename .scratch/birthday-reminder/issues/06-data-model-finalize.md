# Finalize the person-centric data model

Status: resolved
Type: grilling

## Question

Finalize the entity relationships and field set: Person (name, photo, optional birth date, groups) as core; Event always attached to a Person with type (Birthday/Anniversary/Memorial/custom) and date; custom event types are user-defined. Resolve remaining edge cases including couple/group anniversaries and whether events can carry their own notes only.

## Answer

**Entities and invariants**

- **Person** — `id`, `name`, `photo_path` (nullable), created/updated timestamps. **No `birth_date` column** — birth dates live on the Birthday Event row, not on Person. Invariant: every Person has **at least one Event**.
- **Event** — `id`, `person_id` (FK, required), `event_type_id` (FK), `date` (NOT NULL; full date string with year known or year-less month+day), `notes` (nullable), `show_year` flag. Always attached to a Person. The Birthday event row is just another Event; there is no Person-side date attribute.
- **Event Type** — `id`, `name`, `is_builtin`. Built-ins: Birthday, Anniversary, Memorial (fixed, not renamable/deletable). Users can add custom types; each Event picks exactly one type.
- **Group** — `id`, `name`. Many-to-many with Person via `person_group` join.
- **Notification Rule** — per ticket 05 (timing + time + group filter).

**Derived vs stored**

- Birthday is the **default Event** created alongside a Person (date defaults to today if birth date unknown — but the app will skip a Person with no birthday at import time, see below). It is a stored Event row, not a Person attribute. It may be removed only if at least one other Event remains — the invariant is enforced at create/delete time, surfaced as a save-time validation by the UI (no procedural user flow).
- **Days remaining** = time until the person's next Birthday event. **Age** = age they'll turn on the next birthday, shown only when the year is known (year lives in `event.date`; `event.show_year` controls display).

**Storage shape**

- **No Person-level date.** All dates are Event-level.
- `event.date` is NOT NULL — no placeholder, no magic value, no NULL allowed. If a Person has no usable date for an event, they don't appear in the UI.
- Single-person events only in v1; multi-person (couple/group) anniversaries are out of scope. A couple is represented by attaching the anniversary to one Person.
- **V2 Google Contacts import** will skip contacts with no birthday field — no Person is created for them.

**Schema direction** (from ticket 02): `person`, `event_type`, `group`, `event`, `notification_rule`, `person_group`; `event.person_id → person.id`; `event.event_type_id → event_type.id`; `PRAGMA foreign_keys = ON` + WAL.
