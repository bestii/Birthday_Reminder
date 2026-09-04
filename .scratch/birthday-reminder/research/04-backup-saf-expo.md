# Backup/restore via Android Storage Access Framework in Expo

Status: **researched** — answers issue `04-backup-saf-expo.md`
Type: research

---

## TL;DR

**Yes — a managed Expo app can export a single self-contained backup file and import/restore
from it via Android's Storage Access Framework (SAF), letting the user save anywhere Android
supports (device folders, Google Drive, etc.), with no eject, no bare workflow, and no cloud
account.**

Concretely, in a managed app (Expo Go *or* a CNG dev build) you can:

1. **Export** the backup by opening the SAF **directory picker**
   (`ACTION_OPEN_DOCUMENT_TREE`), then creating + writing a file inside the user-chosen
   directory. The picked directory can be a Google Drive folder, so "save to Drive" works.
   This is available via:
   - the **new** `expo-file-system` API: `Directory.pickDirectoryAsync()` +
     `backupFile.copy(dir)` (or `dir.createFile()` + `file.write()`), or
   - the **legacy** API: `StorageAccessFramework.requestDirectoryPermissionsAsync()` +
     `createFileAsync()` + `writeAsStringAsync(..., { encoding: 'base64' })`.
2. **Import** by opening the SAF **file picker** (`ACTION_OPEN_DOCUMENT`) via
   `expo-document-picker` (`getDocumentAsync`) or the new `File.pickFileAsync()`, then reading
   the picked file.

The one thing that is **not** available in managed workflow is the *single-step* native
"Save As…" / "Create document" dialog (`ACTION_CREATE_DOCUMENT`) — the picker where the user
types a filename and taps a cloud/location in one screen. No Expo API exposes it. Getting that
specific UX requires a small custom Expo module (plus a config plugin if needed) and therefore a
**development build / custom production build** — but still **not** ejecting to bare workflow.

> Terminology note: "managed" here means CNG-managed (no checked-in `android/`/`ios/`
> directories; `expo run:android`/`eas build` generate them). Adding custom native code does not
> eject you — you stay on the managed/CNG path, but you can no longer run that particular native
> code in stock Expo Go.

---

## Requirements mapping

| Requirement | Managed (Expo Go / CNG build) | Needs dev build / native module |
|---|---|---|
| Export all app data (incl. profile photos) into one file | ✅ build file in app sandbox (base64 or zip) with `expo-file-system` | — |
| Let user pick save destination anywhere SAF supports (local, Drive) | ✅ SAF directory picker (`ACTION_OPEN_DOCUMENT_TREE`) | — |
| Write the backup file into the chosen SAF directory | ✅ `Directory.createFile`/`copy` (new) or `createFileAsync`+`writeAsStringAsync` (legacy) | — |
| Import a backup file the user chooses | ✅ SAF file picker (`ACTION_OPEN_DOCUMENT`) via `expo-document-picker` / `File.pickFileAsync` | — |
| No mandatory cloud account / login | ✅ SAF works with local storage; Drive appears as a provider only if the user has it | — |
| Single-step "Save As" / `ACTION_CREATE_DOCUMENT` file dialog | ❌ not exposed by any Expo API | ✅ custom Expo module + dev build |

---

## Primary-source findings

### 1. `expo-file-system` — new API (SDK 54+)

Docs: [FileSystem — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/)
(docs page is marked **"Included in Expo Go"**). The relevant Android-native pieces live in the
expo/expo monorepo.

**Directory picker (the SAF write-destination picker) is built into the new API.**

- `Directory.pickDirectoryAsync(initialUri?)` → `Directory`. This maps to
  `Intent.ACTION_OPEN_DOCUMENT_TREE` and, on success, calls
  `contentResolver.takePersistableUriPermission(...)` so the app keeps access across restarts.
  Source:
  [`FileSystemModule.kt`](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/FileSystemModule.kt)
  (`pickDirectoryAsync`) and
  [`FilePickerContract.kt`](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/FilePickerContract.kt)
  (`PickerType.DIRECTORY` → `ACTION_OPEN_DOCUMENT_TREE`; `takePersistableUriPermission`).

- `File.pickFileAsync({ mimeTypes, multipleFiles, initialUri })` → `{ canceled, result }` uses
  `ACTION_OPEN_DOCUMENT` — same contract file, `PickerType.FILE`.

**Writing into the picked directory works with the new API:**

- `Directory.createFile(name, mimeType)` → `File` works for SAF tree URIs. The native
  `FileSystemDirectory.createFile` delegates to `SAFDocumentFile.createFile(...)`, which calls
  `DocumentFile.createFile(mimeType, displayName)`.
  Source:
  [`FileSystemDirectory.kt`](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/FileSystemDirectory.kt)
  and
  [`SAFDocumentFile.kt`](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/unifiedfile/SAFDocumentFile.kt).

- `File.write(content)` / `File.writeSync(content)` writes to a `content://` SAF URI via
  `contentResolver.openOutputStream(uri, "w")`. **Caveat:** `File.create()` itself is
  explicitly rejected for SAF `content://` URIs ("use `Directory.createFile` instead"), so the
  correct sequence is *create via the picked Directory, then write*, not `File.create()`.
  Source:
  [`FileSystemFile.kt`](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/FileSystemFile.kt).

- `File.copy(destination)` / `Directory.copy(destination)` can target a SAF directory directly.
  The `SAF` copy strategy creates the child (file or directory) inside the tree URI, preserving
  the source name and respecting `overwrite`.
  Sources:
  [`CopyMoveStrategy.kt`](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/fsops/CopyMoveStrategy.kt),
  [`DestinationSink.kt`](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/fsops/DestinationSink.kt).

> Net: `backupFile.copy(await Directory.pickDirectoryAsync())` is a complete managed-only
> SAF "save anywhere" export in one directory-picker interaction.

### 2. `expo-file-system` — legacy API and `StorageAccessFramework`

Docs: [FileSystem (legacy) — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem-legacy/)
(also "Included in Expo Go"). The legacy `StorageAccessFramework` namespace wraps the same SAF
primitives:

- `requestDirectoryPermissionsAsync(initialFileUrl?)` → `{ granted, directoryUri }` opens
  `ACTION_OPEN_DOCUMENT_TREE` and takes a **persistable** URI permission. This is the SAF
  write-destination picker. Marked **Android 11+** in the docs.
- `createFileAsync(parentUri, fileName, mimeType)` → new SAF file URI (empty file).
- `makeDirectoryAsync(parentUri, dirName)` → new SAF directory URI.
- `readDirectoryAsync(dirUri)` → list of SAF child URIs.
- `writeAsStringAsync(fileUri, contents, { encoding: 'base64' })`, `readAsStringAsync`,
  `deleteAsync`, `copyAsync`/`moveAsync` accept SAF URIs.

Important documented caveat: **"when you're using SAF URI the file needs to exist. You can't
create a new file"** for `writeAsStringAsync` — so the legacy export sequence must create the
file with `createFileAsync` first.

The implementation confirms this — `getOutputStream` for an SAF URI opens
`contentResolver.openOutputStream(uri, "w"/"wa")`, and `createSAFFileAsync` uses
`DocumentFile.createFile(...)`.
Source:
[`FileSystemLegacyModule.kt`](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/legacy/FileSystemLegacyModule.kt).

**⚠️ Import-path gotcha in SDK 54+:** `StorageAccessFramework` is defined in the **legacy**
module. In the current source the main entry does **not** re-export it:

- New main entry (`expo-file-system`) exports `File`, `Directory`, `Paths`, task classes, and
  `legacyWarnings` only:
  [`src/index.ts`](https://github.com/expo/expo/blob/main/packages/expo-file-system/src/index.ts).
- The legacy entry (`expo-file-system/legacy`) re-exports `./FileSystem`, which contains
  `export namespace StorageAccessFramework`:
  [`src/legacy/index.ts`](https://github.com/expo/expo/blob/main/packages/expo-file-system/src/legacy/index.ts),
  [`src/legacy/FileSystem.ts`](https://github.com/expo/expo/blob/main/packages/expo-file-system/src/legacy/FileSystem.ts).

So use **`import { StorageAccessFramework } from 'expo-file-system/legacy'`** (and
`import * as FileSystem from 'expo-file-system/legacy'` for the other legacy helpers). The
legacy docs page still shows `import { StorageAccessFramework } from 'expo-file-system'` — that
example is stale for SDK 54+; the source code is authoritative. All plain legacy methods
(`getInfoAsync`, `copyAsync`, `writeAsStringAsync`, …) imported from the **main**
`expo-file-system` entry now throw at runtime via
[`legacyWarnings.ts`](https://github.com/expo/expo/blob/main/packages/expo-file-system/src/legacyWarnings.ts).

### 3. `expo-document-picker` — import (SAF file picker)

Docs: [DocumentPicker — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/document-picker/)
("Included in Expo Go").

- `getDocumentAsync({ type, copyToCacheDirectory, multiple })` launches
  `Intent.ACTION_OPEN_DOCUMENT` + `CATEGORY_OPENABLE` — the SAF picker. Source:
  [`DocumentPickerModule.kt`](https://github.com/expo/expo/blob/main/packages/expo-document-picker/android/src/main/java/expo/modules/documentpicker/DocumentPickerModule.kt).
- With the default `copyToCacheDirectory: true`, the picked `content://` document is **copied to
  the app cache** and a `file://` URI is returned — this is the most robust option for reading a
  backup immediately with any file API. Docs explicitly call out this option exists so
  `expo-file-system` can read the file right after picking.
- With `copyToCacheDirectory: false`, you get the raw `content://` SAF URI; `expo-file-system`
  can still read `content://` (read-only) via its stream readers.

### 4. `expo-sharing` — export via share sheet (complement, not SAF)

Docs: [Sharing — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/sharing/)
("Included in Expo Go").

- `Sharing.shareAsync(fileUrl, { mimeType, dialogTitle, UTI })` opens the Android share sheet
  (`ACTION_SEND`). From there the user can send the backup to "Save to Drive", the Files app,
  Gmail, etc.
- This is **not** the SAF "save to a specific location" flow: it's "hand this file to another
  app", the destination is whatever share target the user picks, and the receiving app decides
  what to do with the bytes. It works in managed/Expo Go, and is a fine *secondary* export path,
  but it is not a deterministic SAF write and has no direct import counterpart (the SDK 54
  incoming-share feature is experimental and is about *other apps sharing into* yours, not a
  backup restore UI).

### 5. What requires a dev build / native module: `ACTION_CREATE_DOCUMENT`

The canonical one-tap Android "Save As" dialog (user types filename + chooses cloud/location in
a single system sheet) is `Intent.ACTION_CREATE_DOCUMENT`. A search of the primary source for the
two relevant packages shows Expo only ever launches:

- `ACTION_OPEN_DOCUMENT` (import file picker) — `File.pickFileAsync`, `expo-document-picker`
- `ACTION_OPEN_DOCUMENT_TREE` (directory picker) — `Directory.pickDirectoryAsync`,
  `StorageAccessFramework.requestDirectoryPermissionsAsync`

`FilePickerContract.kt` (above) constructs only these two intents; `DocumentPickerModule.kt`
(above) only `ACTION_OPEN_DOCUMENT`. There is **no** `ACTION_CREATE_DOCUMENT` anywhere in the
Expo `expo-file-system` or `expo-document-picker` code, and no config-plugin toggle turns it on.

Therefore:

- **Managed workflow (Expo Go):** SAF export must go through the **directory picker**
  (two-step UX: pick folder → app writes a file inside it). "Save to Drive" is fully supported
  because a Google Drive folder is a valid `ACTION_OPEN_DOCUMENT_TREE` selection.
- **Single-step "Save As…" dialog:** requires a small custom Expo module that calls
  `ACTION_CREATE_DOCUMENT` (and `takePersistableUriPermission`), optionally exposed through a
  config plugin for any manifest/`FileProvider` needs. That module ships in a **development
  build or production build** via CNG (`npx expo run:android` / `eas build`) — but you remain on
  the managed path, no bare workflow.

Reference for the Android side: [Android Storage Access Framework / document provider](https://developer.android.com/guide/topics/providers/document-provider)
and [Expo development builds intro](https://docs.expo.dev/develop/development-builds/introduction/).

---

## Recommended implementation (v1, managed-only)

Build the backup as **one file** in the app sandbox (single ZIP containing the serialized DB +
all profile photos, or a single JSON with photos base64-embedded). Then:

### Export (SAF "save anywhere", managed)

Preferred (new API):

```ts
import { Directory, File, Paths } from 'expo-file-system';

// 1. Build the single backup file in app storage
const backup = new File(Paths.cache, 'birthday-reminder-backup.zip');
backup.write(bytes); // or build via archive library

// 2. Let the user pick a destination folder (local or Drive) and write into it
const dir = await Directory.pickDirectoryAsync();
await backup.copy(dir, { overwrite: true });
```

Legacy equivalent (also managed):

```ts
import * as FileSystem from 'expo-file-system/legacy';
const { StorageAccessFramework } = FileSystem;

const backupUri = FileSystem.cacheDirectory + 'backup.zip';
// ...build backup at backupUri...
const perm = await StorageAccessFramework.requestDirectoryPermissionsAsync();
if (perm.granted) {
  const fileUri = await StorageAccessFramework.createFileAsync(
    perm.directoryUri, 'birthday-reminder-backup', 'application/zip'
  );
  const b64 = await FileSystem.readAsStringAsync(backupUri, { encoding: 'base64' });
  await StorageAccessFramework.writeAsStringAsync(fileUri, b64, { encoding: 'base64' });
}
```

### Import (SAF file picker, managed)

```ts
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

const result = await DocumentPicker.getDocumentAsync({
  type: ['application/zip', 'application/octet-stream', '*/*'],
  copyToCacheDirectory: true, // default; gives a readable file:// URI
});
if (!result.canceled) {
  const file = new File(result.assets[0].uri);
  const bytes = await file.bytes(); // or .text() for JSON
  await restoreBackup(bytes);
}
```

`File.pickFileAsync()` (new API) is an equally valid import picker; `expo-document-picker` with
the default `copyToCacheDirectory` is the most battle-tested path.

### When to build the custom native module instead

Only if the product hard-requires the **native single-step "Save As…" sheet**
(`ACTION_CREATE_DOCUMENT`) rather than the folder-pick-then-write UX. In that case: add a local
Expo module (e.g. via `npx create-expo-module@latest --local`) implementing
`ACTION_CREATE_DOCUMENT` + `takePersistableUriPermission`, and ship with a dev build — no eject.

---

## Caveats to plan around

- **Directory-picker UX is two-step**, not "Save As". The user picks a folder; the app writes
  the file into it. This is the SAF trade-off that avoids any storage permission and any cloud
  login.
- **Persistable permissions**: `expo-file-system` takes `takePersistableUriPermission`
  automatically on both the new and legacy pickers, but the returned tree/document URI is
  per-selection — don't assume it survives if the user revokes access in Android's settings.
- **`File.create()` is not valid for SAF `content://` URIs** — always create the child via
  `Directory.createFile()` (new) or `StorageAccessFramework.createFileAsync()` (legacy).
- **Legacy `writeAsStringAsync` requires the SAF file to already exist**; create first, then
  write.
- **Import reading**: prefer `copyToCacheDirectory: true` (default) in `expo-document-picker`
  for reliable immediate reads; raw `content://` URIs are read-only and provider-dependent.
- **Base64 vs zip**: base64-embedding photos is simple but ~33% larger and memory-heavy for big
  libraries; a ZIP container is more scalable but needs an archiver dependency. Either is a
  single file and satisfies the "one self-contained backup" requirement.
- **Bundle the whole backup into one file in-app** — SAF copy/write operates on a file, so
  multi-file export would need manual fan-out inside the picked directory (possible, but the
  spec calls for a single file).

---

## Sources

- [FileSystem — Expo Documentation (new API)](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [FileSystem (legacy) — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem-legacy/)
- [DocumentPicker — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/document-picker/)
- [Sharing — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/sharing/)
- [Introduction to development builds — Expo Documentation](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android: Storage Access Framework / document provider](https://developer.android.com/guide/topics/providers/document-provider)
- [expo-file-system src/index.ts (main entry, no SAF re-export)](https://github.com/expo/expo/blob/main/packages/expo-file-system/src/index.ts)
- [expo-file-system src/legacy/index.ts](https://github.com/expo/expo/blob/main/packages/expo-file-system/src/legacy/index.ts)
- [expo-file-system src/legacy/FileSystem.ts (StorageAccessFramework)](https://github.com/expo/expo/blob/main/packages/expo-file-system/src/legacy/FileSystem.ts)
- [expo-file-system src/legacyWarnings.ts (legacy methods throw from main entry)](https://github.com/expo/expo/blob/main/packages/expo-file-system/src/legacyWarnings.ts)
- [expo-file-system FileSystemModule.kt (pickFileAsync / pickDirectoryAsync)](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/FileSystemModule.kt)
- [expo-file-system FilePickerContract.kt (OPEN_DOCUMENT / OPEN_DOCUMENT_TREE + persistable permission)](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/FilePickerContract.kt)
- [expo-file-system FileSystemFile.kt (File.create rejects SAF URIs)](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/FileSystemFile.kt)
- [expo-file-system FileSystemDirectory.kt (Directory.createFile for SAF)](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/FileSystemDirectory.kt)
- [expo-file-system SAFDocumentFile.kt (createFile / outputStream)](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/unifiedfile/SAFDocumentFile.kt)
- [expo-file-system FileSystemPath.kt (SAF detection, copy/move)](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/FileSystemPath.kt)
- [expo-file-system CopyMoveStrategy.kt (SAF copy destination)](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/fsops/CopyMoveStrategy.kt)
- [expo-file-system DestinationSink.kt (SAF receiveFrom creates file/dir)](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/fsops/DestinationSink.kt)
- [expo-file-system FileSystemLegacyModule.kt (requestDirectoryPermissionsAsync / createSAFFileAsync / SAF write)](https://github.com/expo/expo/blob/main/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/legacy/FileSystemLegacyModule.kt)
- [expo-document-picker DocumentPickerModule.kt (ACTION_OPEN_DOCUMENT, copyToCacheDirectory)](https://github.com/expo/expo/blob/main/packages/expo-document-picker/android/src/main/java/expo/modules/documentpicker/DocumentPickerModule.kt)
- [expo-document-picker src/types.ts](https://github.com/expo/expo/blob/main/packages/expo-document-picker/src/types.ts)
