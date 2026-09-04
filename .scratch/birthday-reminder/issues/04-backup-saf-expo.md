# Backup/restore via Android Storage Access Framework in Expo

Status: resolved
Type: research

## Question

Can a managed Expo app open Android's Storage Access Framework (save-to-Drive / files picker) for exporting and importing a backup file without ejecting? Investigate primary sources (expo-file-system, expo-document-picker, expo-sharing) to determine the exact APIs and whether a development build / config plugin / native module is required.

## Answer

**Yes — managed Expo can export and import a single self-contained backup file via SAF, no eject and no cloud account.**

- **Export "save anywhere" (local files, Google Drive, etc.)**: open the SAF directory picker (`ACTION_OPEN_DOCUMENT_TREE`) via `Directory.pickDirectoryAsync()` (new API) or `StorageAccessFramework.requestDirectoryPermissionsAsync()` (legacy, now under `expo-file-system/legacy`), then create+write the backup file inside the chosen directory. A Google Drive folder is a valid destination.
- **Import**: SAF file picker (`ACTION_OPEN_DOCUMENT`) via `expo-document-picker` (`getDocumentAsync`) or `File.pickFileAsync()`, then read the picked file (`copyToCacheDirectory: true` gives a readable `file://` URI).
- **Needs a dev build/native module only** for the single-step native "Save As…" dialog (`ACTION_CREATE_DOCUMENT`), which Expo doesn't expose — still not an eject. Managed-only folder-pick-then-write is the v1 recommendation.
- `expo-sharing` only opens the share sheet (`ACTION_SEND`) — a complement, not a deterministic SAF write.

Detail: `.scratch/birthday-reminder/research/04-backup-saf-expo.md`.
