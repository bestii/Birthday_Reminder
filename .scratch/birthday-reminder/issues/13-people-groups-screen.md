# Manage Groups screen

Status: resolved
Type: prototype
Blocked by: 06

## Question

What should the Manage Groups screen look like? It must support only adding and deleting custom groups (Family, Friends, Work). People assignment to groups happens exclusively in a person's detail view, not here. Produce a rough prototype.

## Answer

**Variant A wins** (simple list + trash):

- Header: "Manage Groups" title + a `+` button to add a new group.
- Each group row shows name + people count, with a trash icon that deletes immediately.
- Empty state: "No groups yet. Tap + to create your first group."
- People are **not** listed or assigned here — assignment lives in the person detail view.

Prototype asset: `.scratch/birthday-reminder/prototypes/manage-groups-screen.html`.
