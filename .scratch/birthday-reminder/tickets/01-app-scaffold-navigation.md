# 01 — App scaffold & navigation shell

**What to build:** A new Expo managed (TypeScript) app that boots into a two-tab interface (Home, Calendar), with the core dependencies installed and configured. `USE_EXACT_ALARM` is declared so notifications can fire at exact times later. Light/dark/system theme scaffolding is in place and persisted.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] App boots in Expo Go / dev client to Home + Calendar tabs.
- [ ] Dependencies installed and wired: expo-sqlite, expo-notifications, react-native-calendars, expo-image-picker, navigation.
- [ ] `USE_EXACT_ALARM` declared in app config; notification channel setup stubbed.
- [ ] No `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` or battery-optimization exemption requested (not needed — see issue 18).
- [ ] Theme renders light/dark/system from a stored preference (default: system), verified via a temporary toggle.
