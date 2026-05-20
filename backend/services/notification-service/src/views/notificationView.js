/**
 * MVC View: notification payload returned to clients.
 */
export function notificationFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    read: !!row.read,
    createdAt: row.created_at,
  };
}
