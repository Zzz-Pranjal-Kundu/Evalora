/** Client-side mirrors of gateway RBAC for navigation and route guards. */

export const ROLES = {
  EMPLOYEE: "EMPLOYEE",
  MANAGER: "MANAGER",
  HR_ADMIN: "HR_ADMIN",
  LEADERSHIP: "LEADERSHIP",
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
};

const privileged = new Set([
  ROLES.ADMIN,
  ROLES.HR_ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.MANAGER,
  ROLES.LEADERSHIP,
]);
const analyticsRoles = new Set([
  ROLES.ADMIN,
  ROLES.HR_ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.MANAGER,
  ROLES.LEADERSHIP,
]);
const hrNav = new Set([ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.SUPER_ADMIN]);
const leadershipNav = new Set([ROLES.LEADERSHIP, ROLES.SUPER_ADMIN, ROLES.ADMIN]);
/** Organization directory & charts — read-only for all roles in this workspace. */
const orgNav = new Set([
  ROLES.EMPLOYEE,
  ROLES.MANAGER,
  ROLES.HR_ADMIN,
  ROLES.LEADERSHIP,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
]);
const calibrationNav = new Set([ROLES.HR_ADMIN, ROLES.SUPER_ADMIN, ROLES.ADMIN]);

/** Roles allowed to open the analytics workspace (matches gateway-style analytics use). */
export const ANALYTICS_ROLE_LIST = [
  ROLES.MANAGER,
  ROLES.HR_ADMIN,
  ROLES.LEADERSHIP,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
];

export function canSeeAnalytics(role) {
  return role && analyticsRoles.has(role);
}

export function canSeeHrHub(role) {
  return role && hrNav.has(role);
}

export function canSeeLeadership(role) {
  return role && leadershipNav.has(role);
}

export function canSeeOrgWorkspace(role) {
  return role && orgNav.has(role);
}

export function canSeeCalibration(role) {
  return role && calibrationNav.has(role);
}

export function canManageTeamReviews(role) {
  return role && privileged.has(role);
}

/** Can call GET /users/profiles (full org roster for dashboards). */
export function canListAllProfiles(role) {
  if (!role) return false;
  return ["MANAGER", "HR_ADMIN", "SUPER_ADMIN", "ADMIN", "LEADERSHIP"].includes(role);
}

export function canSeeManagerDashboard(role) {
  return role && privileged.has(role);
}

export function canSeeHrDashboard(role) {
  return role && hrNav.has(role);
}

/**
 * Sidebar / deep-link guard: path must match React Router `to` (no trailing slash).
 */
export function canAccessPath(role, path) {
  if (!role) return false;
  switch (path) {
    case "/analytics":
      return canSeeAnalytics(role);
    case "/hr":
      return canSeeHrHub(role);
    case "/leadership":
      return canSeeLeadership(role);
    case "/admin":
      return role === ROLES.SUPER_ADMIN;
    case "/org":
      return canSeeOrgWorkspace(role);
    case "/calibration":
      return canSeeCalibration(role);
    default:
      return true;
  }
}

export const HR_HUB_ROLE_LIST = Array.from(hrNav);
export const LEADERSHIP_ROLE_LIST = Array.from(leadershipNav);
export const ORG_ROLE_LIST = Array.from(orgNav);
export const CALIBRATION_ROLE_LIST = Array.from(calibrationNav);
export const SUPER_ADMIN_ROLE_LIST = [ROLES.SUPER_ADMIN];
