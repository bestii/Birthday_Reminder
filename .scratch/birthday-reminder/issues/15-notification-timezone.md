# Notification timezone handling

Status: resolved
Type: grilling
Blocked by: 05

## Question

How should scheduled notifications behave when the device changes timezones? Recompute all pending notifications on timezone change, or leave them as originally scheduled?

## Answer

- **On timezone change**: recompute and reschedule all pending notifications, so they fire at the same *local* time in the new zone.
- **Implementation**: listen for timezone change and re-run the existing scheduler (which already reschedules on launch/data change). No background polling.
- **Day boundary**: local calendar day; "X days before" is computed in local time.
