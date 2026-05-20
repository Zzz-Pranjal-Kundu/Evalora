/**
 * MVC View: API representation of a user (no secrets).
 */
export function userToPublic(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };
}
