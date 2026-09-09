# 03 — Domain utilities

**What to build:** Pure, tested helpers for the recurring-date math: days-remaining ("Today" for same day, always count forward/wrap, Feb 29 observed Feb 28 in non-leap years), zodiac sign from month+day, and the three date-format presets (`MMM D, YYYY`, `D MMM YYYY`, `DD/MM/YYYY`).

**Blocked by:** 01 — App scaffold & navigation shell

**Status:** done

- [x] Days-remaining returns "Today" for same-day and counts forward, wrapping to next year once the date passes.
- [x] Feb 29 observes Feb 28 in non-leap years and Feb 29 in leap years, for all annual event types.
- [x] Zodiac is computed from month+day only, correct across cusp boundaries.
- [x] All three date-format presets render correctly.
- [x] Unit tests cover the edge cases above.
