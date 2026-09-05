# 16 — Backup & restore

**What to build:** The Backup screen (via hamburger) — export a versioned JSON backup (v1, base64-embedded photos) via SAF directory picker; import via document picker, migrating older backups forward and rejecting newer ones with a clear message.

**Blocked by:** 02 — Database schema & repository

**Status:** ready-for-agent

- [ ] Hamburger → Backup opens the screen with Export and Import actions.
- [ ] Export writes a single v1 JSON file (data + version header + base64 photos) to a user-chosen SAF directory.
- [ ] Import reads a picked file and restores data + photos.
- [ ] Older backup versions migrate forward on import.
- [ ] Newer backup versions are rejected with an "update the app first" message.
- [ ] Restore validates before committing (no partial state).
