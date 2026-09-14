# 04 — Home shell & empty state

**What to build:** The Home tab's static frame — header (☰ + search + filter icons), group-pills row, list container, and the expanding FAB (Add New → AddBirthday / Add Event Category → AddEvent / Manage Groups) — with an empty state shown before any people exist. App wraps in `SafeAreaProvider`; Home uses `useSafeAreaInsets()` to inset the header from the status bar and clear the FAB from the bottom tab bar.

**Blocked by:** 01 — App scaffold & navigation shell

**Status:** done

- [x] Home renders the header with ☰, search, and filter icons.
- [x] FAB expands to "Add New", "Add Event Category", and "Manage Groups".
- [x] Group-pills row renders (empty until groups exist).
- [x] Empty state shows a clear "no birthdays yet" prompt with a tap-to-add action.
- [x] Header ☰ opens a menu with Settings / Notifications / Backup entries (screens may be stubs at this stage).
- [x] App wrapped in `SafeAreaProvider`; Home insets header from the status bar and lifts the FAB above the bottom tab bar via `useSafeAreaInsets()`.
