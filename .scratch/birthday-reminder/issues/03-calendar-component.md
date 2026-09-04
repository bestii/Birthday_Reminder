# Calendar UI component choice

Status: resolved
Type: research

## Question

Which calendar component (react-native-calendars vs hand-rolled grid vs alternatives) best supports a monthly view with prev/next navigation, highlighted dates containing events, tap-a-date-to-view-events, and add-from-calendar, inside Expo managed workflow? Investigate primary sources and recommend one.

## Answer

Use **`react-native-calendars` (Wix)** — pure JS, no native code, confirmed Expo/Expo Go compatible (`npx expo install react-native-calendars`).

- Monthly grid + prev/next via built-in arrows (optional swipe with `enableSwipeMonths`).
- Event highlighting via `markedDates` with `dot`/`multi-dot`/period (multi-dot enables color-coding by event type).
- Tap date via `onDayPress` (returns `dateString`); add-from-calendar hooks off that.
- Event list below: drive a `FlatList` from the selected date, or use bundled `<Agenda />` for calendar+list.

Gotchas to honor: `markedDates` must be immutable (rebuild on change); date keys are local `YYYY-MM-DD` strings, so pin a timezone policy for floating dates.

Detail: `.scratch/birthday-reminder/research/03-calendar-component.md`.
