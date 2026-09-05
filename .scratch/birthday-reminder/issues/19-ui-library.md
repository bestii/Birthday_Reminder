# UI component library choice (react-native-paper)

Status: resolved
Type: grilling

## Question

Which UI component library should we use for a modern Material Design look across the app's screens (FAB, chips/pills, cards, search, lists, dialogs, theming)?

## Answer

Use **`react-native-paper`** (Material Design 3).

- Expo Go compatible, actively maintained, and ships the components our prototypes need out of the box: `FAB`, `Chip`, `Card`, `Searchbar`, `List`, `Dialog`, `Appbar`, plus light/dark/system theming.
- Maps 1:1 onto the approved prototypes (expanding FAB, group pills, cards, search field).
- Only peer dependency is `react-native-safe-area-context`, already installed.
- Wire it via a `PaperProvider` bridged to our existing `ThemeContext` color tokens so the theme source of truth stays in one place; screens consume Paper components, not hand-rolled styling.
