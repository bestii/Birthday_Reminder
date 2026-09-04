# Birthday Reminder

A local-first birthday and events reminder app for Android (iOS later via Expo). The app helps a person remember the annual dates that matter about the people they care about, and notifies them ahead of those dates.

## Language

**Person**:
The core entity — someone you want to remember. Has a name, profile photo, birth date (optional), and groups. Every event attaches to a person.
_Avoid_: Contact, friend, entry

**Event**:
A recurring (annual) significant date attached to a Person. Has a type, date, and notes.
_Avoid_: Reminder, occasion

**Event Type**:
A category of event: Birthday, Anniversary, Memorial, plus custom user-defined types.
_Avoid_: Kind, category

**Group**:
A user-defined label for organizing people; a person belongs to zero or more groups.
_Avoid_: Label, tag, list

**Notification Rule**:
A configured rule that triggers notifications for matching events (e.g., "3 days before, for Family").
_Avoid_: Alert, reminder rule

**Birth Date**:
A person's date of birth; the month and day drive the annual Birthday event, and the year is optional.
_Avoid_: DOB, birthday date

**Backup**:
A single self-contained file holding all app data, including profile photos.
_Avoid_: Export, snapshot
