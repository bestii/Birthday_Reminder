# Local persistence / storage choice — research findings

Status: research complete
Relates to: `.scratch/birthday-reminder/issues/02-local-persistence.md`

## Question

Which local storage library best fits the person/event/group/notification-rule data model (relational-ish, filter by group and type, sort by date and name) for a **local-first Expo managed-workflow** React Native app (Android first, iOS later)?

## Candidates investigated

Only **primary sources** (official docs / source repositories) were used:

- **expo-sqlite** (SQLite)
- **MMKV** (`react-native-mmkv`)
- **WatermelonDB** (`@nozbe/watermelondb`)
- **AsyncStorage** (`@react-native-async-storage/async-storage`)

---

## TL;DR comparison

| Criterion | expo-sqlite | MMKV | WatermelonDB | AsyncStorage |
|---|---|---|---|---|
| Category | Relational SQL database | Key/value store | Relational ORM over SQLite | Key/value store |
| Expo managed workflow | ✅ First-party Expo module, no prebuild needed for standard use | ⚠️ Requires `expo prebuild` (custom native) | ⚠️ Requires prebuild/dev client + community plugin | ✅ First-party Expo module |
| Works in Expo Go | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| Android support | ✅ | ✅ | ✅ (native/JSI setup) | ✅ |
| iOS support (future) | ✅ | ✅ | ✅ (CocoaPods, more setup) | ✅ |
| Filtering / sorting in the query layer | ✅ Native SQL `WHERE`/`ORDER BY`/`JOIN` | ❌ In-app JS only | ✅ Native query API | ❌ In-app JS only |
| Relational joins | ✅ SQL joins + foreign keys | ❌ Manual key modeling | ✅ First-class associations | ❌ Manual key modeling |
| Recommended fit for this app | ✅ Best | ❌ Wrong shape | ⚠️ Good model, heavy setup | ❌ Wrong shape |

---

## 1. expo-sqlite / SQLite

**Primary source:** <https://docs.expo.dev/versions/latest/sdk/sqlite/>

**What it is.** Expo's first-party binding over SQLite. The database is persisted across app restarts. Platform list is **Android, iOS, macOS, tvOS, Web**, and it is explicitly marked **"Included in Expo Go."**

**Managed-workflow compatibility (the decisive factor).** `expo-sqlite` is an Expo SDK package. Installation is just `npx expo install expo-sqlite` with **no native code or `expo prebuild` required** for standard usage. An optional config plugin exists only for advanced native build flags (FTS/SQLCipher/libSQL/vector extensions), which are not needed for v1.

**API directly covers every required operation:**

- **CRUD on all entities** — `db.runAsync()` for INSERT/UPDATE/DELETE, `getFirstAsync()` / `getAllAsync()` / `getEachAsync()` for reads, plus `prepareAsync()` prepared statements and `withTransactionAsync()` / `withExclusiveTransactionAsync()` for multi-write atomicity.
- **Filter events by group and by event type** — plain SQL `WHERE` over join tables (`event_group`, `event_type_id`), executed natively.
- **Sort by date and by name** — SQL `ORDER BY`.
- **Relational joins** (person → events, person → groups) — SQL `JOIN`; the docs show `PRAGMA foreign_keys = ON` is supported and recommend WAL journal mode.
- **Migrations** — first-class via `SQLiteProvider` + `onInit` using `PRAGMA user_version` (documented pattern), and/or Drizzle ORM (officially documented integration).
- **Bonus:** built-in DevTools inspector to browse/query the on-device DB; `serialize`/`backupDatabase` APIs relevant to the app's backup requirement; a drop-in `expo-sqlite/kv-store` replacement for AsyncStorage if key/value is ever needed alongside tables.

**iOS support.** Fully supported (iOS is in the platform list). One documented nuance: on Apple TV the DB lives in the caches directory; on iPhone/iPad it uses the app documents directory. App-Group sharing for extensions is documented via `Paths.appleSharedContainers`.

**Caveat (irrelevant for v1).** SQLCipher encryption is **not** supported in Expo Go (needs prebuild). Plain SQLite in Expo Go is fine.

---

## 2. MMKV (`react-native-mmkv`)

**Primary sources:**
- <https://github.com/margelo/react-native-mmkv>
- <https://github.com/margelo/react-native-mmkv/issues/638>

**What it is.** A fast, **fully synchronous key/value** store (strings, numbers, booleans, ArrayBuffers) over Tencent MMKV, using JSI/NitroModules. iOS, Android, and Web support.

**Managed-workflow compatibility.** The README's Expo section is:

```
npx expo install react-native-mmkv react-native-nitro-modules
npx expo prebuild
```

The `expo prebuild` step means it **requires a custom native build / development build** — it is a native C++ module that is **not in Expo Go**. This is confirmed directly by issue #638, whose error is `react-native-mmkv is not supported in Expo Go! Use EAS (expo prebuild) or eject to a bare workflow instead`. V4 also requires React Native ≥ 0.76.

**Fit for the data model.** MMKV is fundamentally a key/value store. There is **no query language, no `WHERE`/`ORDER BY`, and no joins**. The README's only "objects" example is `storage.set('user', JSON.stringify(user))` — i.e., serialize whole objects and `JSON.parse` them back. For this app that would mean:

- Filtering events by group/type → load all events into JS and filter in memory.
- Sorting by date/name → sort in JS.
- Person → events and person → groups → either duplicate data across keys or maintain secondary index keys by hand (with no transactional integrity across them).

That is exactly the class of problem a relational model solves, so MMKV is the wrong shape here despite its speed.

---

## 3. WatermelonDB

**Primary sources:**
- <https://watermelondb.dev/docs/Installation>
- <https://watermelondb.dev/docs/Setup>
- Config plugin: <https://github.com/morrowdigital/watermelondb-expo-plugin>

**What it is.** A high-level reactive database/ORM built **on top of SQLite**, with first-class associations, a query builder (filter/sort via `Q.where`, `Q.sortBy`), and observable queries — a genuinely good fit for a person → events → groups relational model.

**Managed-workflow compatibility (the blocker).** WatermelonDB is a native library:

- **iOS** requires editing the `Podfile` to add `simdjson` (CocoaPods) and running `pod install`.
- **Android** requires manual native wiring for the recommended JSI path (NDK, `settings.gradle`, `build.gradle`, `MainApplication.java`).
- There is **no first-party Expo config plugin**. The community-maintained `@morrowdigital/watermelondb-expo-plugin` exists and its README says it is "Tested against Expo SDK 54," but it requires **rebuilding with a custom development client** (i.e., `expo prebuild`), and it carries its own documented caveats (e.g., a manual `simdjson` Podfile conflict with Expo autolinking in newer SDKs).
- WatermelonDB is **not usable in Expo Go**.

So WatermelonDB gives the relational model, but it costs the fully-managed workflow: the project would move to a dev-build/prebuild model and depend on a third-party plugin that must track Expo SDK releases. That is a large operational tax for a v1 Android-first app when a first-party relational option already exists.

---

## 4. AsyncStorage

**Primary source:** <https://docs.expo.dev/versions/latest/sdk/async-storage/>

**What it is.** An asynchronous, **unencrypted, persistent key/value** store (backed by SQLite on native, IndexedDB on web). Platform list is Android, iOS, macOS, tvOS, Web, and it is marked **"Included in Expo Go."**

**Managed-workflow compatibility.** Excellent — `npx expo install @react-native-async-storage/async-storage`, no native config.

**Fit for the data model.** Same fundamental problem as MMKV (but slower and without sync APIs): no queries, no filtering/sorting, no joins. All required operations would be manual in-app JS over serialized JSON. It is appropriate for small config/token blobs, not for a person/event/group/notification-rule relational model.

**Note:** `expo-sqlite` now ships `expo-sqlite/kv-store`, a drop-in AsyncStorage replacement backed by SQLite — so even the "settings blob" use case AsyncStorage is often chosen for can be covered by expo-sqlite without adding a second dependency.

---

## Recommendation

**Use `expo-sqlite` (SQLite).**

Reasoning, in priority order:

1. **It is the only candidate that is both relational and fully managed-workflow.** It is a first-party Expo SDK package that runs in Expo Go and needs no `expo prebuild` for standard use. MMKV and WatermelonDB both require custom native builds (dev client / prebuild) — a material workflow regression for a v1 Android-first app, and WatermelonDB additionally relies on a community config plugin.
2. **It natively satisfies every stated operation.** SQL `WHERE` (filter by group and by event type), `ORDER BY` (sort by date and by name), `JOIN` (person → events, person → groups), foreign keys, and full CRUD. The key/value candidates cannot express any of these in the storage layer.
3. **Future iOS is a non-issue.** iOS is a first-class supported platform of `expo-sqlite`; the same schema/queries carry over unchanged.
4. **It aligns with the rest of the v1 requirements.** The documented `SQLiteProvider` + `PRAGMA user_version` migration pattern gives a safe schema-evolution path, and `serialize`/`backupDatabase` APIs line up with the "single self-contained backup file" requirement.
5. **It de-risks the data model.** If the team later wants a typed ORM/reactive layer, Drizzle ORM and Knex are officially documented integrations over `expo-sqlite`; WatermelonDB would require replacing the whole persistence layer.

**Rejected alternatives, one line each:**

- **MMKV** — excellent fast key/value store, but no query/join layer; also not Expo Go-compatible.
- **WatermelonDB** — good relational ORM, but heavy native setup and no first-party Expo support (needs prebuild + community plugin).
- **AsyncStorage** — fine for small blobs, but no querying/filtering/sorting/joins; superseded by `expo-sqlite/kv-store` when expo-sqlite is already present.

**Suggested schema direction for the next ticket** (matching the person-centric model): `person`, `event_type`, `group`, `event`, `notification_rule` tables plus join tables `person_group` (many-to-many) and optionally `event_group`; `event.person_id` → `person.id`; `event.event_type_id` → `event_type.id`. Use `PRAGMA foreign_keys = ON` and WAL mode at DB creation.

---

## Sources

- [SQLite — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [@react-native-async-storage/async-storage — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/async-storage/)
- [Third-party libraries supported in Expo Go — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/third-party-overview/)
- [react-native-mmkv — GitHub (margelo)](https://github.com/margelo/react-native-mmkv)
- [react-native-mmkv issue #638: "not supported in Expo Go"](https://github.com/margelo/react-native-mmkv/issues/638)
- [WatermelonDB — Installation](https://watermelondb.dev/docs/Installation)
- [WatermelonDB — Setup](https://watermelondb.dev/docs/Setup)
- [@morrowdigital/watermelondb-expo-plugin — GitHub](https://github.com/morrowdigital/watermelondb-expo-plugin)
- [react-native-async-storage — GitHub README](https://github.com/react-native-async-storage/async-storage)
