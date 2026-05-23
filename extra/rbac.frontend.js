/**
 * Client-side mirrors of gateway RBAC for navigation and route guards.
 *
 * IMPORTANT: These checks are UI-only (hide nav items, redirect unauthorised
 * routes).  The API gateway MUST enforce the same role rules independently on
 * every backend endpoint — never rely solely on this file for security.
 *
 * Role hierarchy (most → least privileged):
 *   SUPER_ADMIN > ADMIN (legacy, prefer HR_ADMIN / SUPER_ADMIN) > HR_ADMIN
 *                > LEADERSHIP > MANAGER > EMPLOYEE
 *
 * NOTE: ADMIN is kept for backwards compatibility with existing accounts but
 * should not be assigned to new users.  Migrate to HR_ADMIN or SUPER_ADMIN.
 */

export const ROLES = {
  EMPLOYEE:    "EMPLOYEE",
  MANAGER:     "MANAGER",
  HR_ADMIN:    "HR_ADMIN",
  LEADERSHIP:  "LEADERSHIP",
  /** @deprecated Use HR_ADMIN or SUPER_ADMIN for new accounts. */
  ADMIN:       "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
};

// ---------------------------------------------------------------------------
// Role sets — defined once, reused by every guard below.
// ---------------------------------------------------------------------------

/** Roles with elevated / non-employee access. */
const privileged = new Set([
  ROLES.ADMIN,
  ROLES.HR_ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.MANAGER,
  ROLES.LEADERSHIP,
]);

/** Roles that may access the analytics workspace. */
const analyticsRoles = new Set([
  ROLES.ADMIN,
  ROLES.HR_ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.MANAGER,
  ROLES.LEADERSHIP,
]);

/** Roles that may access HR-specific pages and operations. */
const hrRoles = new Set([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.SUPER_ADMIN]);

/**
 * Roles that may access leadership insights.
 * NOTE: intentionally excludes MANAGER — managers use the manager dashboard.
 */
const leadershipRoles = new Set([
  ROLES.LEADERSHIP,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
]);

/**
 * Organization directory & charts.
 *
 * ALL authenticated roles may open /org.  However, the OrganizationPage
 * component applies a second layer of defence:
 *   - Privileged roles  → GET /users/profiles  (full roster)
 *   - EMPLOYEE / others → GET /users/profiles/me + GET /users/directory
 *                         (own profile + public directory only)
 * This means employees never receive data they are not entitled to, even
 * though the route itself is unrestricted.
 */
const orgRoles = new Set([
  ROLES.EMPLOYEE,
  ROLES.MANAGER,
  ROLES.HR_ADMIN,
  ROLES.LEADERSHIP,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
]);

/** Roles that may access calibration sessions. */
const calibrationRoles = new Set([
  ROLES.HR_ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
]);

// ---------------------------------------------------------------------------
// Guard functions
// ---------------------------------------------------------------------------

/** Analytics workspace access. */
export function canSeeAnalytics(role) {
  return Boolean(role && analyticsRoles.has(role));
}

/** HR hub navigation and operations. */
export function canSeeHrHub(role) {
  return Boolean(role && hrRoles.has(role));
}

/** Leadership insights navigation and dashboard tile. */
export function canSeeLeadership(role) {
  return Boolean(role && leadershipRoles.has(role));
}

/**
 * Org directory & charts route.
 * All roles are permitted; data scoping is enforced inside OrganizationPage
 * (see comment on orgRoles above).
 */
export function canSeeOrgWorkspace(role) {
  return Boolean(role && orgRoles.has(role));
}

/** Calibration sessions. */
export function canSeeCalibration(role) {
  return Boolean(role && calibrationRoles.has(role));
}

/** Create / edit / submit formal performance reviews. */
export function canManageTeamReviews(role) {
  return Boolean(role && privileged.has(role));
}

/**
 * Full org roster query — GET /users/profiles.
 * Returns false for EMPLOYEE; they fall back to profiles/me + directory.
 */
export function canListAllProfiles(role) {
  if (!role) return false;
  return privileged.has(role);
}

/** Manager dashboard tile. */
export function canSeeManagerDashboard(role) {
  return Boolean(role && privileged.has(role));
}

/** HR dashboard tile. */
export function canSeeHrDashboard(role) {
  return Boolean(role && hrRoles.has(role));
}

/**
 * Central route-level access check used by the sidebar to hide nav items
 * and by canAccessPath calls in Dashboard links.
 *
 * Intentionally avoids leaking denied path names — callers should use the
 * boolean return value only and never expose the path string to the user in
 * error messages.
 */
export function canAccessPath(role, path) {
  if (!role) return false;
  switch (path) {
    case "/analytics":   return canSeeAnalytics(role);
    case "/hr":          return canSeeHrHub(role);
    case "/leadership":  return canSeeLeadership(role);
    case "/calibration": return canSeeCalibration(role);
    case "/org":         return canSeeOrgWorkspace(role);
    case "/admin":       return role === ROLES.SUPER_ADMIN;
    default:             return true;
  }
}

// ---------------------------------------------------------------------------
// Pre-exported role arrays consumed by RoleRoute components in AppRoutes.jsx
// ---------------------------------------------------------------------------

export const ANALYTICS_ROLE_LIST   = [...analyticsRoles];
export const HR_HUB_ROLE_LIST      = [...hrRoles];
export const LEADERSHIP_ROLE_LIST  = [...leadershipRoles];
export const ORG_ROLE_LIST         = [...orgRoles];
export const CALIBRATION_ROLE_LIST = [...calibrationRoles];
export const SUPER_ADMIN_ROLE_LIST = [ROLES.SUPER_ADMIN];
