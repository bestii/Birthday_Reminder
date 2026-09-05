# 06 — Add Birthday form & create person

**What to build:** The FAB "Add Birthday" flow — a form (name required, optional birth date with optional year, optional profile photo via camera/gallery) that on save writes a Person plus a default Birthday event, then returns Home where the new person appears in a minimal list.

**Blocked by:** 02 — Database schema & repository; 03 — Domain utilities; 04 — Home shell & empty state

**Status:** ready-for-agent

- [ ] "Add Birthday" opens the form.
- [ ] Name is required; birth date (month/day) is optional with an optional year toggle.
- [ ] Optional profile photo via camera/gallery image picker.
- [ ] Save creates a Person plus a default Birthday event (the ≥1-event invariant holds).
- [ ] New person appears in a minimal Home list with days-remaining text.
