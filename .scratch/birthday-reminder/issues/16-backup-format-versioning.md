# Backup format versioning

Status: resolved
Type: grilling
Blocked by: 04

## Question

Should the backup file carry a schema/version marker so future app versions can migrate forward on restore? What happens when importing a backup from a newer version into an older app?

## Answer

- **Version marker**: yes — a header with a schema/format version.
- **Older backup into newer app**: migrate forward.
- **Newer backup into older app**: reject with a clear "update the app first" message.
- **v1 format**: a single JSON file with data + metadata header and profile photos base64-embedded, version `1`. Revisit a zip format (v2) only if backups grow too large.
