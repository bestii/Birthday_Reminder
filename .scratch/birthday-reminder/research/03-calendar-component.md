# Calendar Component Selection — Monthly View (React Native / Expo Managed)

**Research question:** Which calendar UI component is best for a monthly calendar view in a React Native (Expo managed workflow) app, Android first, iOS later?

**Requirements mapped to features:**

| Requirement | Needed capability |
|---|---|
| Monthly view + prev/next navigation | Month grid, arrow controls and/or swipe |
| Highlight dates with events | Date markers (dots/badges) |
| Tap a date to view its events | `onDayPress` callback |
| Add events directly from calendar | Tap handler / custom day component → trigger form/modal |
| List of events below the calendar | Custom list keyed by selected date, or a built-in Agenda view |

---

## 1. `react-native-calendars` (Wix) — PRIMARY CANDIDATE

**Package facts (from npm registry + GitHub):**

- Latest published version: **1.1314.0** (published ~5 months ago at time of research).
- Author: **Wix.com**, MIT license. ~10.3k GitHub stars, ~3.1k forks, ~2,600 commits.
- **Pure JavaScript. No native code required.** The published package `main` is `src/index.ts` and its runtime `dependencies` are all JS-only: `xdate`, `lodash`, `prop-types`, `memoize-one`, `recyclerlistview`, `hoist-non-react-statics`, `react-native-swipe-gestures` (plus optional `moment`). No React Native native module is in the dependency tree.
- README states explicitly: *"This project is compatible with Expo/CRNA (without ejecting)"* and *"RN Calendars is implemented in JavaScript, so no native module linking is required."*

### Expo managed compatibility — CONFIRMED

- Because the package contains **no native code and no config-plugin requirement**, it works in the **Expo managed workflow and in Expo Go** — no development build / prebuild is needed.
- This aligns with Expo's own guidance ("Does the library include android or ios directories? … If you answered yes… create a development build"). react-native-calendars answers "no" to that test for the published package.
- Cross-platform: README states "compatible with both **Android** and **iOS**." Android-first is fully supported.

### Feature coverage vs. requirements — CONFIRMED OUT OF THE BOX

From the official Calendar API docs (`wix.github.io/react-native-calendars/docs/Components/Calendar`):

- **Monthly view + prev/next navigation:** `<Calendar />` renders a single month grid with header arrows by default. Navigation is available via:
  - Built-in **arrow buttons** (`onPressArrowLeft` / `onPressArrowRight`, which receive callbacks to go to the previous/next month), or
  - **Swipe between months** via `enableSwipeMonths` (default false), or
  - `onMonthChange` / `onVisibleMonthsChange` callbacks to react to navigation.
  - `hideArrows`, `disableArrowLeft`, `disableArrowRight`, `renderArrow`, `minDate`, `maxDate`, `initialDate` give full control.
- **Highlight dates that contain events:** the `markedDates` prop takes a `YYYY-MM-DD` → marker map. Supported marker types (via `markingType`):
  - **dot** (single dot, custom `dotColor` per day) — the natural fit for "this date has event(s)".
  - **multi-dot** — `dots: [{key, color, selectedDotColor}]`, for showing multiple event categories on one day.
  - **period**, **multi-period**, and **custom** (full `customStyles` per day).
  - Period + dot can be combined; different marking types are NOT mutually stackable otherwise.
- **Tap a date to view its events:** `onDayPress={(date) => …}` fires on day press and returns a `DateData` object (including `dateString`, `day`, `month`, `year`, `timestamp`). `onDayLongPress` also available.
- **Add events directly from the calendar:** `onDayPress` is the hook — open your "add event" form/modal pre-filled with the tapped date. A `dayComponent` override is also available for custom day rendering (e.g., a `+` affordance).
- **List of events below the calendar:** two supported approaches:
  1. Compose `<Calendar />` + your own `FlatList`/`SectionList` driven by the selected date (simple, full control).
  2. Use the bundled **`<Agenda />`** component, which combines a scrollable month calendar **with an event list directly below it** out of the box. Agenda API includes `items` (date → events map), `loadItemsForMonth`, `selected`, `onDayPress`, `renderItem`, `renderEmptyDate`, `onDayChange`, and pull-to-refresh. Docs note: *"By default, agenda dates are marked if they have at least one item"* — so event highlighting in Agenda is automatic.

### Known limitations / caveats

1. **`markedDates` must be immutable** (official disclaimer): *"Make sure that `markedDates` param is immutable. If you change `markedDates` object content but the reference to it does not change, calendar update will not be triggered."* → Always build a **new object** (e.g., spread into a fresh object) when event data changes.
2. **`multi-period` marking expands height** and is *"only fully supported by the `<Calendar/>` component"*; using it with `<CalendarList/>` may overflow. (Not relevant if you use dot/multi-dot.)
3. **Loading indicator quirk:** `displayLoadingIndicator` only works correctly when `markedDates` has a value for *every day of the currently visible month*.
4. **Styling deep customization** via `stylesheet.*` theme overrides is powerful but officially unsupported if it breaks ("use at your own risk").
5. **Dates are keyed by local `YYYY-MM-DD` strings** — for birthdays/anniversaries/memorials, decide a consistent timezone policy when computing keys (anniversary dates are "floating" dates, not UTC instants).
6. Slightly heavier than minimalist alternatives (~4.7 MB unpacked, several deps), but pure-JS and widely battle-tested.

---

## 2. Hand-rolled grid (baseline alternative)

**What it would take** — a full month grid from scratch:

- Date math: days-in-month, leap years, first-weekday offset, 6-row grid construction; handling of adjacent-month padding days.
- Prev/next month state and title rendering.
- Event lookup: build a `Map<YYYY-MM-DD, Event[]>`; draw dot/badge per cell.
- Tap handling per cell → set selected date → filter a list below.
- Locale (month/day names), week-start (Sunday vs Monday), accessibility labels.
- Performance: memoize the grid per (month, events) so it doesn't rebuild every render; avoid re-rendering all 42 cells on each tap.
- Edge cases the library already solves for free: swipe gestures, disabled dates, min/max date graying, selected-state styling, multi-dot rendering, RTL, localization.

**Assessment:** Very feasible for this narrow feature set (~150–300 lines), gives zero dependencies and total design control, and is a reasonable choice for a simple birthday/anniversary tracker. But it re-implements (and must maintain) exactly what `react-native-calendars` already provides and has hardened over 2,600 commits. Recommended **only** if the team wants to avoid a dependency or needs a highly bespoke cell design that resists the library's theming.

---

## 3. Other credible calendar libraries

### 3.1 `react-native-big-calendar` (acro5piano)

- Latest: **4.19.0**, MIT. Dependencies: `dayjs`, `calendarize` (both JS-only → Expo Go compatible). ~589 stars. Lightweight (~9 KB).
- Modes: `'month' | 'week' | '3days' | 'day' | 'schedule' | 'custom'`.
- Month view renders events **inside the cells** (gcal/Outlook style) with `maxVisibleEventCount` and a "More" label — not a "dot + list below" pattern.
- Supports `onPressCell` (tap a date), `onPressDateHeader`, `onPressEvent`, and full theming.
- **Not the best fit** here: this app wants a clean month grid + separate event list, whereas big-calendar's strength is timed events displayed *in* the grid. Its month view is optimized for dense overlapping events rather than a single "this day has reminders" marker per day. Also note the maintainer's own README caveat that iOS receives less routine testing than Android/web.

### 3.2 `react-native-ui-datepicker` (farhoudshapouran)

- Latest: **3.3.0**, MIT. Dependencies: `dayjs`, `clsx`, `lodash`, `tailwind-merge`, `jalali-plugin-dayjs` (JS-only → Expo Go compatible).
- A **date picker** (single / range / multiple selection, calendar + time picker), **not an events calendar**. It has no event-marking API and no agenda/list view.
- **Not a fit** for an event-driven monthly view.

### 3.3 `react-native-modern-datepicker` (HosseinShabani)

- Latest: **1.0.0-beta.91** — still in beta; package published 2020 with an old dependency (`moment-jalaali`).
- A **date/time/month picker**, not an events calendar. No event markers or agenda list.
- **Not a fit**, and effectively unmaintained (beta, stale).

### 3.4 `expo-calendar` / Expo SDK `Calendar` (not a UI component)

- Expo SDK's `Calendar` module is an **API for the device's system calendars** (create/read OS calendar events), not a rendered calendar UI. It would be needed **only if** you wanted to sync reminders into the OS calendar — out of scope for this UI question, and irrelevant to "best UI component."

---

## Recommendation

**Use `react-native-calendars`.**

**Primary recommendation: `<Calendar />` (month view) + a custom event `FlatList` below it.**

- `<Calendar />` gives the monthly grid, prev/next arrows (and optional swipe), and event highlighting via `markedDates` with **dot** or **multi-dot** markers — all out of the box.
- `onDayPress` covers "tap a date to view its events" **and** doubles as the entry point for "add an event" (open a pre-filled form/modal).
- Drive the event list below from the selected date (`dateString`). This keeps the list fully under your control (sorting, grouping, swipe-to-delete, empty states) and avoids coupling to a heavier agenda layout.

**Secondary option:** use the bundled **`<Agenda />`** if you want the combined calendar + event-list UX with automatic date marking, at the cost of less control over the list's look/behavior.

**Why not the alternatives:**
- **Hand-rolled grid** — viable but re-implements what react-native-calendars already does; choose only for zero-dependency or bespoke-design reasons.
- **react-native-big-calendar** — excellent for timed events rendered in-cell (gcal style); wrong shape for "month dots + list below."
- **react-native-ui-datepicker / modern-datepicker** — pickers, not event calendars.
- **expo-calendar** — OS calendar API, not a UI component.

**Expo managed / Expo Go:** `react-native-calendars` is pure JavaScript with no native linking, so it runs in the Expo managed workflow and Expo Go with no development build. Install with `npx expo install react-native-calendars`.

**Key implementation reminders:**
1. Treat `markedDates` as immutable — rebuild the object (new reference) whenever event data changes.
2. Use `markingType="dot"` (or `"multi-dot"` to color-code birthday vs anniversary vs memorial).
3. Compute date keys in local time with a deliberate, documented timezone policy for floating dates.
4. Prefer the explicit arrow callbacks or `enableSwipeMonths` for Android-first navigation; both are supported on iOS later.

---

## Sources

- [react-native-calendars — GitHub README (wix/react-native-calendars)](https://github.com/wix/react-native-calendars)
- [Calendar component API — official docs](https://wix.github.io/react-native-calendars/docs/Components/Calendar)
- [Agenda component API — official docs (raw source)](https://raw.githubusercontent.com/wix/react-native-calendars/master/docsRNC/docs/Components/Agenda.md)
- [react-native-calendars — npm registry metadata (`/latest`)](https://registry.npmjs.org/react-native-calendars/latest)
- [react-native-big-calendar — GitHub README (acro5piano)](https://github.com/acro5piano/react-native-big-calendar)
- [react-native-big-calendar — npm registry metadata (`/latest`)](https://registry.npmjs.org/react-native-big-calendar/latest)
- [react-native-ui-datepicker — npm registry metadata (`/latest`)](https://registry.npmjs.org/react-native-ui-datepicker/latest)
- [react-native-modern-datepicker — npm registry metadata (`/latest`)](https://registry.npmjs.org/react-native-modern-datepicker/latest)
- [Using Expo SDK, React Native, and third-party libraries — Expo Documentation](https://docs.expo.dev/workflow/using-libraries/)
