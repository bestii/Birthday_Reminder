# Notification Engine Research — Birthday/Event Reminder App

**Question:** Which library should power Android notifications for a local-first React Native (Expo managed workflow) birthday/event reminder app where the #1 requirement is **reliable, flexible notifications**?

**Bottom line up front:** Use **`expo-notifications`** as the primary scheduling library. It is the only one of the two candidates that natively supports a **true annual calendar trigger** on Android (`SchedulableTriggerInputTypes.YEARLY`) *and* has a matching iOS calendar trigger for the later iOS port. **Notifee is not necessary for this use case** — and, counter-intuitively, it makes the core requirement *harder* because its `RepeatFrequency` only goes up to `WEEKLY` (no monthly/yearly). Notifee's only meaningful advantage here is richer *presentation* (custom layouts, actions, images, foreground services) and built-in exact-alarm permission plumbing — neither is required for reliable birthday/event reminders.

The one thing `expo-notifications` does **not** give you out of the box is exact-alarm permission wiring, so the recommendation is: **expo-notifications + an explicit `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM` manifest entry + a thin app-side scheduling layer** (details in §4).

---

## Requirements → capability matrix

| Requirement | expo-notifications | Notifee |
|---|---|---|
| "On the day" delivery | ✅ `YEARLY` trigger (Android) / `CALENDAR` trigger (iOS) | ⚠️ no yearly repeat — must chain one-shot triggers manually |
| "X days before" delivery | ✅ compute the date, then `DATE` (one-shot) or a computed `YEARLY` trigger | ⚠️ same manual approach (no yearly) |
| Configurable time-of-day | ✅ `hour` + `minute` on every calendar trigger | ✅ `timestamp` on `TimestampTrigger` |
| Annual recurrence | ✅ native (`YEARLY`) | ❌ **not supported** (`HOURLY`/`DAILY`/`WEEKLY` only) |
| Multiple rules / groups | ✅ one scheduled notification per rule (unique `identifier`) | ✅ one trigger notification per rule (unique `id`) |
| Android exact-time delivery | ⚠️ works **only if you declare the exact-alarm permission yourself** | ✅ declares `SCHEDULE_EXACT_ALARM` and exposes check/settings APIs |
| iOS later | ✅ `CalendarNotificationTrigger` maps to `UNCalendarNotificationTrigger` | ✅ iOS supported (but same yearly gap) |
| Expo managed workflow | ✅ config plugin, local notifications work in Expo Go | ⚠️ requires dev build / `expo prebuild` (native module) |

---

## 1. Can `expo-notifications` ALONE schedule annual recurrence reliably on Android?

### 1a. Annual recurrence capability — YES, it is a first-class trigger type

The Expo docs list `YEARLY` among `SchedulableTriggerInputTypes`, and `YearlyTriggerInput` accepts `day`, `month`, `hour`, `minute`:

> `YearlyTriggerInput` — "This trigger input will cause the notification to be delivered once every year when the `day`, `month`, `hour`, and `minute` date components match the specified values."
> Source: https://docs.expo.dev/versions/latest/sdk/notifications/#yearlytriggerinput

The Android implementation confirms a real yearly trigger (`YearlyTrigger` computes the next occurrence and rolls `Calendar.YEAR + 1` when the date has passed):

```kotlin
// expo-notifications .../notifications/triggers/NotificationTriggers.kt
class YearlyTrigger(... val day: Int, val month: Int, val hour: Int, val minute: Int) : ... {
  override fun nextTriggerDate(): Date? {
    val nextTriggerDate = Calendar.getInstance()
    nextTriggerDate[Calendar.DATE] = day
    nextTriggerDate[Calendar.MONTH] = month
    nextTriggerDate[Calendar.HOUR_OF_DAY] = hour
    nextTriggerDate[Calendar.MINUTE] = minute
    ...
    if (nextTriggerDate.before(rightNow)) nextTriggerDate.add(Calendar.YEAR, 1)
    return nextTriggerDate.time
  }
}
```
Source: https://github.com/expo/expo/blob/main/packages/expo-notifications/android/src/main/java/expo/modules/notifications/notifications/triggers/NotificationTriggers.kt

**Important foot-gun:** `month` is **0-indexed** (JS `Date` convention — January is `0`), per the Expo docs:
> "All properties are specified in JavaScript `Date` object's ranges (i.e. January is represented as 0)."
> Source: https://docs.expo.dev/versions/latest/sdk/notifications/#yearlytriggerinput

So "June 15 at 09:00" is `{ month: 5, day: 15, hour: 9, minute: 0 }`.

### 1b. "X days before" — supported, but only via your own date math

There is no `daysBefore` parameter. You compute the target date yourself:

- **For the next occurrence only:** schedule a one-shot `DATE` trigger at `(eventDate − X days) at time-of-day`.
- **For an annual "X days before" reminder:** either schedule a computed `YEARLY` trigger (note the cross-year edge case — e.g. "3 days before Jan 1" is Dec 29 of the *previous* year), or — more robustly — schedule the next N occurrences as explicit one-shot `DATE` triggers and refresh the schedule on app launch/data change (recommended, see §4).

### 1c. Exact time-of-day delivery — the reliability catch

The Android scheduler source shows **exactness is conditional on the exact-alarm permission**, and it **silently degrades to an inexact alarm** otherwise:

```kotlin
// expo-notifications .../service/delegates/ExpoSchedulingDelegate.kt
private fun setupAlarm(triggerAtMillis: Long, operation: PendingIntent) {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()) {
    AlarmManagerCompat.setExactAndAllowWhileIdle(alarmManager, AlarmManager.RTC_WAKEUP, triggerAtMillis, operation)
  } else {
    AlarmManagerCompat.setAndAllowWhileIdle(alarmManager, AlarmManager.RTC_WAKEUP, triggerAtMillis, operation)
  }
}
```
Source: https://github.com/expo/expo/blob/main/packages/expo-notifications/android/src/main/java/expo/modules/notifications/service/delegates/ExpoSchedulingDelegate.kt

Translation:
- **Android < 12 (API < 31):** always uses `setExactAndAllowWhileIdle` → exact.
- **Android 12+ (API ≥ 31):** exact **only if** `canScheduleExactAlarms()` is true; otherwise `setAndAllowWhileIdle` (inexact — the OS may batch/delay it).

Android's own docs describe the consequence of inexact delivery on 12+:
> "On Android 12 (API level 31) and higher, the system invokes the alarm within one hour of the supplied trigger time, unless any battery-saving restrictions are in effect…"
> Source: https://developer.android.com/develop/background-work/services/alarms/schedule

### 1d. The permission is NOT declared by the library — you must add it yourself

`expo-notifications`' Android manifest only declares `RECEIVE_BOOT_COMPLETED` and `POST_NOTIFICATIONS`:

```xml
<!-- expo-notifications android/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```
Source: https://github.com/expo/expo/blob/main/packages/expo-notifications/android/src/main/AndroidManifest.xml

The Expo docs therefore instruct the developer to add it manually:
> "Starting from Android 12 (API level 31), to schedule a notification that triggers at an exact time, you need to add `<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>` to AndroidManifest.xml."
> Source: https://docs.expo.dev/versions/latest/sdk/notifications/#android

The expo-notifications **config plugin does not add this permission** — it only configures icon/color/default channel/sounds:
> Source (plugin implementation): https://github.com/expo/expo/blob/main/packages/expo-notifications/plugin/src/withNotificationsAndroid.ts

In a managed workflow you add it via `app.json` → `expo.android.permissions` (e.g. `"android.permission.SCHEDULE_EXACT_ALARM"`).

### 1e. Android 12/13/14 behavior summary

- **Android 12 (API 31):** apps targeting 12+ must declare an "Alarms & reminders" permission or `setExact*` throws `SecurityException`. `SCHEDULE_EXACT_ALARM` is the standard choice.
  Source: https://developer.android.com/develop/background-work/services/alarms/schedule
- **Android 13 (API 33):** `USE_EXACT_ALARM` is introduced as an alternative (granted on install, cannot be revoked by the user, but subject to Google Play policy).
  Source: https://developer.android.com/develop/background-work/services/alarms/schedule
- **Android 14 (API 34):** `SCHEDULE_EXACT_ALARM` is **no longer pre-granted to most newly installed apps targeting 13+** — it is **denied by default**. Calendar/alarm-clock apps are directed to `USE_EXACT_ALARM` (granted on install, restricted by Play policy). Apps must check `canScheduleExactAlarms()` and, if denied, deep-link the user to Settings (`ACTION_REQUEST_SCHEDULE_EXACT_ALARM`) and gracefully degrade.
  Source: https://developer.android.com/about/versions/14/changes/schedule-exact-alarms

---

## 2. Where `expo-notifications` falls short for annual recurring + multiple rules

1. **No exact-alarm permission in the manifest and no runtime plumbing.** The library neither declares `SCHEDULE_EXACT_ALARM` nor exposes a JS API to check `canScheduleExactAlarms()` or open the "Alarms & reminders" settings. On Android 12+/14 the developer must add the permission *and* handle the denied-by-default flow themselves (e.g. via `expo-intent-launcher` for `ACTION_REQUEST_SCHEDULE_EXACT_ALARM`).
   Sources: manifest + plugin above; https://docs.expo.dev/versions/latest/sdk/notifications/#android

2. **Silent degradation.** If the permission is missing/revoked, `scheduleNotificationAsync` still *succeeds* but schedules an inexact alarm — no error, no signal to the app that the notification may be late. (Compare Android's own guidance to check `canScheduleExactAlarms()` before scheduling.)
   Source (code): https://github.com/expo/expo/blob/main/packages/expo-notifications/android/src/main/java/expo/modules/notifications/service/delegates/ExpoSchedulingDelegate.kt

3. **No auto-reschedule when exact-alarm permission is *granted* after being denied/revoked.** The library's receiver re-schedules on boot/reboot/package-replace only (`BOOT_COMPLETED`, `REBOOT`, `MY_PACKAGE_REPLACED`, `QUICKBOOT_POWERON`). It does **not** listen for `ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED`, so a user who grants the permission later won't get exact alarms until the app is reopened (or the device reboots).
   Source (manifest + `SETUP_ACTIONS`): https://github.com/expo/expo/blob/main/packages/expo-notifications/android/src/main/AndroidManifest.xml and https://github.com/expo/expo/blob/main/packages/expo-notifications/android/src/main/java/expo/modules/notifications/service/NotificationsService.kt

4. **"X days before" is not first-class.** It must be computed in JS. For annual events this means the app owns cross-year/leap-day date math, not the library.

5. **0-indexed month.** Easy to get wrong; must be normalized in your scheduling layer.

6. **No explicit documented per-app trigger cap** in expo-notifications, but each scheduled notification maps to one `AlarmManager` entry, so very large rule sets (many groups × many events × years ahead) should use a "schedule the next N occurrences, then refresh" strategy rather than unbounded schedules.

---

## 3. Is Notifee necessary? What does it add?

**Not necessary — and it does not solve the core requirement (annual recurrence).**

### 3a. Notifee does NOT support annual (or monthly) recurrence

Notifee's `TimestampTrigger.repeatFrequency` only supports hourly, daily, and weekly:

```ts
// @notifee/react-native src/types/Trigger.ts
export enum RepeatFrequency {
  NONE = -1,
  HOURLY = 0,
  DAILY = 1,
  WEEKLY = 2,
}
```
Source: https://github.com/invertase/notifee/blob/main/packages/react-native/src/types/Trigger.ts

The docs' own "update to weekly" example uses `RepeatFrequency.WEEKLY`, and there is no `YEARLY`/`MONTHLY`.
Source: https://notifee.app/react-native/docs/triggers

To get annual recurrence with Notifee you would have to schedule the next one-shot `TimestampTrigger` and **re-schedule the next year yourself** (e.g. in a foreground/background event handler after each fires) — strictly more work and more failure surface than expo-notifications' native yearly trigger.

### 3b. What Notifee *does* add (genuine advantages)

- **Declares `SCHEDULE_EXACT_ALARM` out of the box** (in its core Android manifest, which is merged into your app), plus `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, etc.:
  Source: https://github.com/invertase/notifee/blob/main/android/src/main/AndroidManifest.xml
- **Exact-alarm runtime APIs:** `getNotificationSettings().android.alarm` to detect `SCHEDULE_EXACT_ALARM` state, and `openAlarmPermissionSettings()` to deep-link to the Alarms & reminders settings.
  Source: https://notifee.app/react-native/docs/triggers
- **Auto-reschedule on permission grant:** it registers `AlarmPermissionBroadcastReceiver` for `ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED`, so triggers are re-created when the user grants exact-alarm access.
  Source: https://github.com/invertase/notifee/blob/main/android/src/main/AndroidManifest.xml
- **Explicit AlarmManager control:** `TimestampTrigger.alarmManager: true` → `AlarmManagerCompat.setExact`; `alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE }` for firing during idle/Doze.
  Source: https://notifee.app/react-native/docs/triggers
- **Richer presentation:** custom channels, notification styles (big picture/text/inbox), action buttons, images, foreground services — none required for a basic reminder.
- **Noted limit:** "Android has a system limit of 50 timestamp triggers active at one time."
  Source: https://notifee.app/react-native/docs/triggers

### 3c. Does it require a dev build / config plugin? YES

Notifee is a native module and is not available in Expo Go. Its own installation guide requires adding the config plugin and building:

> "Notifee has a built-in expo plugin… add `@notifee/react-native` to the list of plugins in your app's Expo config… ensure you run `expo prebuild` and rebuild your app."
> Source: https://notifee.app/react-native/docs/installation

By contrast, `expo-notifications`' **local** notification scheduling works in Expo Go (only *push/remote* notifications are unavailable in Expo Go on Android from SDK 53), though adding the exact-alarm permission still requires a build with the permission in the manifest:
> "Local notifications (in-app notifications) remain available in Expo Go."
> Source: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## 4. Recommended combination

### Recommendation: **`expo-notifications` as the single scheduling engine** (no Notifee for scheduling), plus two small additions.

**1. Library:** `expo-notifications` — the only candidate with native **annual** triggers on Android (`YEARLY`) and a matching iOS `CALENDAR` trigger for the later port.

**2. Manifest:** declare the exact-alarm permission yourself (the library's config plugin does not):
- In `app.json`: `"expo": { "android": { "permissions": ["android.permission.SCHEDULE_EXACT_ALARM"] } }`.
- For a calendar/reminder app that qualifies under Google Play policy, prefer **`USE_EXACT_ALARM`** on Android 13+ — it is granted on install and cannot be revoked, which is the strongest reliability posture for a reminders product. (It is restricted to calendar/alarm-clock use cases and subject to Play policy.)
  Source: https://developer.android.com/about/versions/14/changes/schedule-exact-alarms

**3. A thin scheduling layer in app code** that owns the rules → dates translation:
- Store events + rules ("on day at HH:mm", "X days before at HH:mm") in local data.
- On app launch, after any data change, and on notification response, compute the next N upcoming trigger instants per rule and schedule them as **one-shot `DATE` triggers** (with stable, rule-scoped identifiers). This is the most robust approach for "X days before" + annual + multiple rules + cross-year/leap-day correctness, and it avoids unbounded `AlarmManager` entries.
- Optionally use `YEARLY` triggers where the semantics are simple ("every year on the birthday date at HH:mm"), but the one-shot + refresh pattern is easier to reason about and test across DST/year boundaries.
- `expo-notifications` already re-schedules persisted notifications on reboot (`RECEIVE_BOOT_COMPLETED` is in its manifest and `setupScheduledNotifications()` replays the store), so one-shots survive restarts.
  Source (code): https://github.com/expo/expo/blob/main/packages/expo-notifications/android/src/main/java/expo/modules/notifications/service/delegates/ExpoSchedulingDelegate.kt

**4. Exact-alarm permission UX (Android 12+/14):**
- `expo-notifications` exposes no `canScheduleExactAlarms()`/settings API, so add the minimal missing piece yourself: detect denial and deep-link to `ACTION_REQUEST_SCHEDULE_EXACT_ALARM` (e.g. `expo-intent-launcher`), and re-run the scheduler when the app returns to foreground. This closes the exactness gap that is the library's one real weakness.

### Why *not* Notifee (for now)
- It cannot do annual recurrence natively (`WEEKLY` max) — it would force you to hand-roll the very thing that is your #1 requirement.
- It forces a dev build / config plugin with zero benefit to scheduling reliability over a correctly-permissioned expo-notifications.
- Its real value — rich notification presentation and ready-made exact-alarm permission APIs — is not needed for "a reliable reminder at the right time." **Revisit Notifee only if/when you want custom notification layouts, inline actions, or foreground-service behavior**, and at that point add it purely as a *display* layer while keeping expo-notifications (or your own date logic) as the scheduler.

---

## Assumptions
- "Expo managed workflow" = Expo SDK 53+ (the current `~57.0.17` doc set was used); the local-notification scheduling facts apply across recent SDK versions.
- "Reliable" = the notification fires at the requested calendar time even when the app is killed; this is why the exact-alarm permission is treated as mandatory rather than optional.
- iOS is out of scope for the v1 build, but the choice must not paint us into a corner; expo-notifications' `CALENDAR` trigger maps directly to `UNCalendarNotificationTrigger` with `repeats`, so annual recurrence is portable.
- If `USE_EXACT_ALARM` is chosen, the app must satisfy Google Play's calendar/alarm-clock policy before publishing.

## Sources
- [Notifications - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [expo-notifications NotificationScheduler.kt (source)](https://github.com/expo/expo/blob/main/packages/expo-notifications/android/src/main/java/expo/modules/notifications/notifications/scheduling/NotificationScheduler.kt)
- [expo-notifications NotificationTriggers.kt (source)](https://github.com/expo/expo/blob/main/packages/expo-notifications/android/src/main/java/expo/modules/notifications/notifications/triggers/NotificationTriggers.kt)
- [expo-notifications ExpoSchedulingDelegate.kt (source)](https://github.com/expo/expo/blob/main/packages/expo-notifications/android/src/main/java/expo/modules/notifications/service/delegates/ExpoSchedulingDelegate.kt)
- [expo-notifications AndroidManifest.xml (source)](https://github.com/expo/expo/blob/main/packages/expo-notifications/android/src/main/AndroidManifest.xml)
- [expo-notifications withNotificationsAndroid.ts (config plugin source)](https://github.com/expo/expo/blob/main/packages/expo-notifications/plugin/src/withNotificationsAndroid.ts)
- [Schedule alarms | Android Developers (AlarmManager)](https://developer.android.com/develop/background-work/services/alarms/schedule)
- [Schedule exact alarms are denied by default | Android Developers (Android 14)](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)
- [Triggers | Notifee](https://notifee.app/react-native/docs/triggers)
- [Installation | Notifee](https://notifee.app/react-native/docs/installation)
- [Permissions | Notifee (Android)](https://notifee.app/react-native/docs/android/permissions)
- [@notifee/react-native Trigger.ts (source)](https://github.com/invertase/notifee/blob/main/packages/react-native/src/types/Trigger.ts)
- [Notifee core AndroidManifest.xml (source)](https://github.com/invertase/notifee/blob/main/android/src/main/AndroidManifest.xml)
