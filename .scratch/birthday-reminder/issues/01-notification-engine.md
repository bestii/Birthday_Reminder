# Notification engine choice (expo-notifications vs Notifee)

Status: resolved
Type: research

## Question

Which library should power notifications on Android for reliable, recurring (annual) scheduling with "day-of" and "X days before" delivery and a configurable time? Investigate primary sources (Expo docs, Notifee docs, Android WorkManager/AlarmManager constraints) to determine whether expo-notifications alone covers annual recurrence and multi-rule scheduling, or whether Notifee (or a dev-build/native escape hatch) is required.

## Answer

Use **`expo-notifications` as the single scheduling engine**; Notifee is unnecessary and would make the #1 requirement harder.

- `expo-notifications` has a first-class `YEARLY` trigger (`day`, `month`, `hour`, `minute`) backed by Android's `YearlyTrigger`. Notifee's `RepeatFrequency` enum stops at `WEEKLY`, so it can't express annual recurrence natively.
- Exact time-of-day delivery requires the exact-alarm permission; expo-notifications' manifest does **not** declare `SCHEDULE_EXACT_ALARM` (and its config plugin doesn't add it), so it must be declared manually in `app.json` — prefer `USE_EXACT_ALARM` for a calendar/reminders product.
- Android 14 denies `SCHEDULE_EXACT_ALARM` by default for most new installs; `USE_EXACT_ALARM` is auto-granted for alarm-clock/calendar apps (Play policy applies).
- Thin app-side layer computes "X days before" dates and schedules the next N one-shot `DATE` triggers per rule, refreshed on launch/data change. iOS later via the `CALENDAR` trigger.

Detail: `.scratch/birthday-reminder/research/01-notification-engine.md`.
