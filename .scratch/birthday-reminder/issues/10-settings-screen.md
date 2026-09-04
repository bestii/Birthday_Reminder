# Settings screen scope

Status: resolved
Type: grilling
Blocked by: 05, 06

## Question

What exactly does the v1 Settings screen expose? Candidate items: notification preferences (link to notification rules), date format, theming (light / dark / system default), birth-year show/hide toggle, default sorting/filtering, manage groups, and app preferences. Which are in v1, what are the defaults, and how are they stored?

## Answer

- **Access**: hamburger menu on Home has three separate entries — **Settings**, **Notifications**, **Backup** (each its own screen).
- **Date format**: three presets — `MMM D, YYYY` (default), `D MMM YYYY`, `DD/MM/YYYY`.
- **Theme**: Light / Dark / System default; default = **System default**.
- **Birth-year toggle**: **per-event** — each event carries a show/hide-year toggle (not a global setting).
- **Sort/filter**: **not persisted**; on every app open reset to defaults — group=All, sort=Date, events=All. Users can change them mid-session to check something, but restart reverts.
- **Manage groups**: a dedicated screen, reached from both the Home FAB and Settings.
- **Home FAB** expands to: Add Birthday (creating a person), Add Event, Manage Groups.
- **Group assignment** (in the detail screen) must also allow **creating a new group** inline.
