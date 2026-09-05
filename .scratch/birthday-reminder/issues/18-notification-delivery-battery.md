# Notification delivery & battery optimization strategy

Status: resolved
Type: grilling
Blocked by: 01

## Question

This is a notification app that must fire reminders while the user is not using it. How do we guarantee delivery against Android's battery-optimization behaviour (Doze, reboot, OEM killers, force-stop)? And how far ahead ("N") should the scheduler's one-shot triggers reach?

## Answer

We never run a background service — notifications are OS-scheduled exact alarms, handed to Android's `AlarmManager` via `expo-notifications` after the app computes fire dates once. So battery optimization is mostly a non-issue, and the mechanisms reduce to one permission plus a scheduling horizon.

- **Exact alarm (`USE_EXACT_ALARM`)** — declared in `app.json`, auto-granted for calendar/reminder apps. This is what keeps Doze from deferring fire times. Required.
- **Battery-optimization exemption (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`)** — not needed. It only helps persistent background services; we have none to exempt. Skipped.
- **Reboot** — handled: `RECEIVE_BOOT_COMPLETED` is auto-added by `expo-notifications`; alarms persist and re-register on boot.
- **Force-stop** — cannot be fixed; Android blocks all alarms until the app is manually reopened. Documented limitation, not code-around-able.
- **OEM aggressive killers** — minimal exposure since we run no service; residual risk lives only in the refresh window below.

**Scheduling horizon N = 12 months.** The scheduler computes every matching event's next fire date for the coming 12 months and schedules those one-shot triggers, recomputing on launch / data change / timezone change. This bounds the "user never reopens the app" failure to a year, not a week. `N` is expressed as a named constant so it can be tuned without touching scheduling logic.

**Runtime environment for notification work.** We use local notifications only — no push/remote notifications, no FCM token registration. Local scheduling still works in Expo Go, but Expo Go cannot honour our `USE_EXACT_ALARM` permission or the `expo-notifications` config plugin (it ships a fixed prebuilt manifest). Notification tickets (13–15) must therefore be built and verified in a **development build** (`npx expo run:android`); Expo Go is acceptable for UI-only tickets. The `expo-notifications` `defaultChannel` is FCM-push-only and is intentionally left unset.
