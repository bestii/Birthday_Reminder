# 05 — Manage groups

**What to build:** The Manage Groups screen — list groups with name + people count, add via `+`, delete via trash (with confirmation), and an empty state. Reachable from the Home FAB (and later Settings). People are not listed or assigned here; assignment lives in the person detail view.

**Blocked by:** 02 — Database schema & repository

**Status:** done

## Acceptance criteria

- [x] Manage Groups screen lists groups with name + people count.
- [x] `+` creates a new group from a name input.
- [x] Trash deletes a group immediately (with confirmation).
- [x] Empty state reads "No groups yet. Tap + to create your first group."
- [x] Groups persist to SQLite and are reusable by other screens.

## What landed

### Repository seam

- `Repository.listGroupsWithPeopleCount(): GroupWithPeopleCount[]` — single SQL with a `LEFT JOIN person_group` so each row carries its assigned person count without an N+1 round trip. Ordered by name.
- `Repository.findGroupByName(name)` — case-insensitive lookup (`LOWER(name) = LOWER(?)`), used to enforce the no-duplicate rule on add. Lives on the repo so any future create-group site shares the rule.
- `GroupWithPeopleCount` type added alongside `PersonWithGroups` / `PersonWithEvents` to keep the existing `XWithY` naming convention.
- `group` rows are now seeded on first install by a v2 migration (`INSERT OR IGNORE INTO "group" (name) VALUES ('Friends'), ('Family'), ('Work')`). Seeded rows are not flagged `is_builtin` — users can rename or delete them like any other group. `INSERT OR IGNORE` keeps the migration idempotent and safe for users who already had one of those names.
- Schema migration user_version advances 1 → 2; the migration test asserts the new version and that the three defaults are seeded.

### Manage Groups screen

- Header row: title "Manage Groups" + a `+` IconButton on the right. Empty-state branch reuses the same header layout so the `+` is reachable on first install.
- List: each row shows the group name, the people count (`1 person` / `N people`), and a trash IconButton.
- Add flow: `+` opens an in-place card with a name input, validation (required, case-insensitive duplicate), Cancel / Add actions. The card overlays the screen with a dismiss-on-backdrop-tap behavior, dismissable from outside or with Cancel.
- Delete flow: trash opens a confirmation card; Delete confirms, Cancel dismisses. Delete cascades through `person_group` per the v1 schema.
- Custom backdrop/card overlay (instead of `react-native-paper`'s `Dialog`): matches the `HomeScreen` menu pattern and stays queryable by `@testing-library/react-native` in jest, where Paper's Dialog Portal/Modal is not reachable.
- Uses `useSafeAreaInsets` so the title, the `+` button, and the dialog all sit clear of the status bar / gesture bar.
- Stack header for `ManageGroups` is hidden (`headerShown: false`) so the in-body title row stays in charge of the title + action.

### Home pills refresh on focus

- `HomeScreen` now stores `people` and `groups` in `useState` and re-reads them via `useFocusEffect` whenever the screen regains focus. The react-navigation stack keeps `HomeScreen` mounted while `ManageGroups` is on top, so the initial read went stale after every create / delete.
- The effect is wrapped in `useCallback` per react-navigation's docs so it does not re-fire on every render.
- HomeScreen tests are wrapped in `NavigationContainer` so `useFocusEffect` has the navigation context it needs.

### Pill layout fix

- The pills `ScrollView` content container had no explicit `flexDirection` or `alignItems`, so the `<Text>` children stretched to the row's cross-axis height. With `borderRadius: 999` that turned each pill into an elongated oval once the three seeded defaults became visible.
- Added `flexDirection: 'row'`, `alignItems: 'center'` on the row and `alignSelf: 'flex-start'` on the pill. Dropped the redundant `marginRight` on the pill since `gap` on the row handles spacing.

## Test coverage

- `src/db/__tests__/repository.test.ts`: 25 cases — covers the new methods, the v2 migration, the seeded defaults, and existing seam behavior. Existing tests that explicitly created `'Family'` / `'Work'` were rewritten to `findGroupByName` instead so they do not hit the UNIQUE constraint.
- `src/screens/__tests__/ManageGroupsScreen.test.tsx`: 16 cases — empty state (wiped defaults), seeded-defaults visibility, list rendering with people counts, `+` add flow (success, cancel, empty/whitespace rejection, case-insensitive duplicate rejection), delete flow (trash → confirmation → delete, cancel). A `wipeGroups` helper clears the seeded defaults when a test needs a clean slate.
- `src/screens/__tests__/HomeScreen.test.tsx`: 15 cases — header, empty state, group pills (seeded defaults visible on first install, custom group appears, focus refresh reflects a group created after first render), FAB expand/collapse and navigation, hamburger menu.

104 tests pass total. `tsc --noEmit` is clean.

## Decisions and deviations from the original ticket

- **Confirmation on delete.** The resolved design (`issues/13-people-groups-screen.md`) said "trash deletes immediately"; the ticket added "(with confirmation)" in the same line. We kept the confirmation card — it matches the ticket language and protects against accidental loss of a group's people assignments.
- **Header duplication.** The stack navigator sets `title: 'Manage Groups'` on the screen, so the original in-body titleLarge rendered twice. We hid the stack header for `ManageGroups` so the in-body row stays the single source of truth and the `+` lives beside the title.
- **Default groups are deletable.** The user explicitly asked for users to be able to remove the defaults, so the seeded rows are not flagged `is_builtin` (unlike `event_type`'s built-ins). The schema's existing `ON DELETE CASCADE` on `person_group` and `notification_rule_group` makes removal clean.
- **Case-insensitive duplicate check.** The `group.name` UNIQUE constraint is case-sensitive. The screen's duplicate check is case-insensitive (`LOWER(name) = LOWER(?)`) so "Family" and "family" cannot coexist. The behavior is in `Repository.findGroupByName` so it is shared across callers.

## Follow-ups (not in this ticket)

- Other screens that read `person_group` data (e.g. upcoming events, person detail) currently hold their own state. Once those screens are built they should follow the same `useState` + `useFocusEffect` pattern.
- If the user later wants defaults to differ per locale or to be resettable from Settings, that needs a new migration (or a Settings action) — not just a re-seed.