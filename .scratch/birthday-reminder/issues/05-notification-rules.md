# Notification rule semantics

Status: resolved
Type: grilling
Blocked by: 01

## Question

Precisely what do notification rules look like? How many can exist, what are the defaults, how does "on the day" vs "X days before" compose, what's the configurable time-of-day, and how does group targeting select which events notify? Confirm the engine can express these before locking the rule model.

## Answer

A **notification rule** = one timing (on-day or X-days-before) + one time-of-day + one set of groups. Multiple rules are supported.

- **Timing**: "X days before" is a positive integer 0–30, where 0 = on the day. UI presets common values (0, 1, 3, 7) but stores a plain integer.
- **Groups = event filter**: a rule fires only for events of people in the selected groups; no groups selected = everyone. (Not recipient routing — local-first, no accounts.)
- **Time-of-day**: per rule, not global.
- **Defaults**: one rule on first install — on the day at 9:00 AM, for everyone.
- **Collision**: one event → one notification (no collapsing multiple events into a single notification in v1).

This is expressible by the chosen engine (expo-notifications + app-side scheduling layer): compute each rule's next fire date per event, schedule one-shot triggers, refresh on launch/data change.
