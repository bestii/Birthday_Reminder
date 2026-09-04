# Search, filter, and sort semantics

Status: resolved
Type: grilling

## Question

Define search-by-name behavior, sort options (date vs name), and filter combinations (by group, by event type, all events) — including how filters compose and what the default view is.

## Answer

All search/filter/sort controls live **only in the Home tab** (not Calendar). Home has a main header containing: **search**, **filter**, and a **hamburger options menu** (Settings, Notifications, Backup).

- **Search**: by Person name only; Home only.
- **Sort (1st level)**: Date (default) or A–Z. Date keeps month grouping and orders current-month-first then wrapping; name sorts the whole people list A–Z (flattened).
- **Event-type filter (2nd level)**: "All events" + specific event types (Birthday, Anniversary, Memorial, custom).
- **Group filter (3rd level)**: group pills rendered just below the header.
- **Calendar**: no filter/search/hamburger header — it always shows everything.
