# 15 — Notification deep-link

**What to build:** Tapping a notification opens the source person's detail view, routed via a person id carried in the notification payload.

**Blocked by:** 08 — Person detail & event edit; 13 — Notification scheduling engine

**Status:** ready-for-agent

- [ ] Notification payload carries the person id.
- [ ] Tapping the notification routes to that person's detail view.
- [ ] Cold start (app not running) resolves the deep-link to the detail view.
- [ ] Invalid or missing id falls back to Home.
