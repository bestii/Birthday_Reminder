# Notification deep-link

Status: resolved
Type: grilling
Blocked by: 05

## Question

When the user taps a notification, what should it open? The person's detail view, the event, the Home screen, or the Calendar? For v1, is a deep-link required or is opening the app to Home acceptable?

## Answer

- **Tap opens the person's detail view** (the source of the event).
- **Deep-link in v1**: yes — carry the person/event id in the notification payload and route there via React Navigation.
