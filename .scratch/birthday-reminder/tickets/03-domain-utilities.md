# 03 — Domain utilities

**What to build:** Pure, tested helpers for the recurring-date math: days-remaining ("Today" for same day, always count forward/wrap, Feb 29 observed Feb 28 in non-leap years), zodiac sign from month+day, and the three date-format presets (`MMM D, YYYY`, `D MMM YYYY`, `DD/MM/YYYY`).

**Blocked by:** 01 — App scaffold & navigation shell

**Status:** ready-for-agent

- [ ] Days-remaining returns "Today" for same-day and counts forward, wrapping to next year once the date passes.
- [ ] Feb 29 observes Feb 28 in non-leap years and Feb 29 in leap years, for all annual event types.
- [ ] Zodiac is computed from month+day only, correct across cusp boundaries.
- [ ] All three date-format presets render correctly.
- [ ] Unit tests cover the edge cases above.
