---
description: How to add a new notification type
---

1. Update the `Notification` type in `src/contexts/NotificationContext.tsx` to include the new type in the `type` union.
2. Update the `getIcon` function in `src/components/ui/notification-bell.tsx` to return an appropriate icon for the new type.
3. Update the `AdminNotifications` component in `src/components/admin/AdminNotifications.tsx` to include the new type in the type selection buttons.
4. (Optional) Update the database check constraint if you want to enforce types at the database level, though the current check constraint might need to be updated via a migration if it's strict.

Example: Adding a 'promotion' type
- Add 'promotion' to `Notification` type.
- Add `case 'promotion': return <Tag className="..." />` to `getIcon`.
- Add 'promotion' to the list of types in `AdminNotifications`.
