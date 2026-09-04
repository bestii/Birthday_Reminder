# Days-remaining edge cases

Status: resolved
Type: grilling
Blocked by: 06

## Question

How should "days remaining" handle (a) a birthday that is today, and (b) a Feb 29 (leap-day) birth date in non-leap years?

## Answer

- **Birthday today**: show **"Today"** (accent/highlighted), not "0 days".
- **Passed this year**: always count forward to the next occurrence, wrapping into next year.
- **Feb 29 in non-leap years**: observed on **Feb 28**; Feb 29 in leap years.
- **Scope**: applies to **all annual events** (birthday, anniversary, memorial, custom), not just birthdays.
