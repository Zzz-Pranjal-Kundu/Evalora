/**
 * Static RBAC matrix (JWT carries one primary role per user today).
 * Extend with fine-grained user_permissions from DB when employee-service lands.
 */
export const ROLES = {
  EMPLOYEE: "EMPLOYEE",
  MANAGER: "MANAGER",
  HR_ADMIN: "HR_ADMIN",
  LEADERSHIP: "LEADERSHIP",
  SUPER_ADMIN: "SUPER_ADMIN",
  /** Legacy alias mapped to full HR admin in JWT */
  ADMIN: "ADMIN",
};

/** permission -> roles that may access */
export const PERMISSIONS = {
  "dashboard:employee": [ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR_ADMIN, ROLES.LEADERSHIP, ROLES.SUPER_ADMIN, ROLES.ADMIN],
  "dashboard:manager": [ROLES.MANAGER, ROLES.HR_ADMIN, ROLES.SUPER_ADMIN, ROLES.ADMIN],
  "dashboard:hr": [ROLES.HR_ADMIN, ROLES.SUPER_ADMIN, ROLES.ADMIN],
  "dashboard:leadership": [ROLES.LEADERSHIP, ROLES.SUPER_ADMIN, ROLES.ADMIN],
  "ai:invoke": [ROLES.MANAGER, ROLES.HR_ADMIN, ROLES.LEADERSHIP, ROLES.SUPER_ADMIN, ROLES.ADMIN],
  "calibration:view": [ROLES.HR_ADMIN, ROLES.SUPER_ADMIN, ROLES.ADMIN],
  "settings:system": [ROLES.SUPER_ADMIN],
};

export function rolesForUser(req) {
  return req.user?.roles || [];
}

export function userHasPermission(req, permission) {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  const rs = rolesForUser(req);
  return rs.some((r) => allowed.includes(r));
}
