// Server-side RBAC enforcement. This is the authoritative security boundary — the frontend rbac.js only hides UI elements and must never be trusted on its own.

/**
 * Gateway RBAC middleware
 */

import jwt from "jsonwebtoken";
import { userHasPermission } from "../config/rbac.js";

// For CommonJS Static Analysis Compatibility:
// "use strict";
// module.exports = { ROLES, ALL_ROLES, PRIVILEGED_ROLES, ANALYTICS_ROLES, HR_ROLES, LEADERSHIP_ROLES, SUPER_ADMIN_ROLES, requireRole, requireAuth, requireRoleForPath, requirePermission };

// ---------------------------------------------------------------------------
// Role constants (keep in sync with frontend src/config/rbac.js)
// ---------------------------------------------------------------------------

export const ROLES = Object.freeze({
  EMPLOYEE:    "EMPLOYEE",
  MANAGER:     "MANAGER",
  HR_ADMIN:    "HR_ADMIN",
  LEADERSHIP:  "LEADERSHIP",
  /** @deprecated Prefer HR_ADMIN or SUPER_ADMIN for new accounts. JSDoc: Use HR_ADMIN or SUPER_ADMIN for new accounts. */
  ADMIN:       "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
});

// ---------------------------------------------------------------------------
// Named role sets — export so proxy route files can import by name
// ---------------------------------------------------------------------------

/** All authenticated roles — any valid JWT. */
export const ALL_ROLES = Object.values(ROLES);

/** Non-employee privileged roles. */
export const PRIVILEGED_ROLES = [
  ROLES.MANAGER,
  ROLES.HR_ADMIN,
  ROLES.LEADERSHIP,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

/** Analytics workspace. */
export const ANALYTICS_ROLES = [
  ROLES.MANAGER,
  ROLES.HR_ADMIN,
  ROLES.LEADERSHIP,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

/** HR hub and calibration operations. */
export const HR_ROLES = [
  ROLES.HR_ADMIN,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

/** Leadership insights. */
export const LEADERSHIP_ROLES = [
  ROLES.LEADERSHIP,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

/** System administration — super admin only. */
export const SUPER_ADMIN_ROLES = [ROLES.SUPER_ADMIN];

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

/**
 * Returns an Express middleware that allows the request only if the JWT role
 * claim is included in `allowedRoles`.
 *
 * Expects a prior `authenticateJWT` middleware to have set `req.user` with at
 * minimum `{ role: string }`.
 *
 * @param {string[]} allowedRoles
 * @returns {import("express").RequestHandler}
 */
export function requireRole(allowedRoles) {
  const allowed = new Set(allowedRoles);

  return function rbacMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required.",
      });
    }

    const role = req.user.role;

    if (!role || !allowed.has(role)) {
      // 403 — authenticated but not authorised.
      // Return a generic message; never reveal which roles ARE allowed.
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to access this resource.",
      });
    }

    return next();
  };
}

/**
 * Convenience: allow any authenticated user (role is present and non-empty).
 * Equivalent to `requireRole(ALL_ROLES)` but skips the Set lookup.
 */
export function requireAuth(req, res, next) {
  if (!req.user?.role) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required.",
    });
  }
  return next();
}

/**
 * Express middleware that checks the permission of the current user.
 * Kept for backward compatibility with gatewayRoutes.js and legacy config.
 * 
 * @param {string} permission 
 * @returns {import("express").RequestHandler}
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    // Standardize user roles/role fields for userHasPermission helper compatibility
    if (req.user && req.user.role && (!req.user.roles || req.user.roles.length === 0)) {
      req.user.roles = [req.user.role];
    }
    if (!userHasPermission(req, permission)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to access this resource.",
      });
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// Route-path → required role mapping
// Mirrors canAccessPath() in frontend/src/config/rbac.js exactly.
// ---------------------------------------------------------------------------

/**
 * Maps API path prefixes to their required role sets.
 * Used by `requireRoleForPath` below.
 *
 * Order matters — more specific prefixes must come first.
 */
const PATH_ROLE_MAP = [
  { prefix: "/api/analytics",              roles: ANALYTICS_ROLES },
  { prefix: "/api/v1/analytics",           roles: ANALYTICS_ROLES },
  { prefix: "/api/dashboards/hr",          roles: HR_ROLES },
  { prefix: "/api/v1/dashboards/hr",       roles: HR_ROLES },
  { prefix: "/api/dashboards/leadership",  roles: LEADERSHIP_ROLES },
  { prefix: "/api/v1/dashboards/leadership", roles: LEADERSHIP_ROLES },
  { prefix: "/api/dashboards/manager",     roles: PRIVILEGED_ROLES },
  { prefix: "/api/v1/dashboards/manager",  roles: PRIVILEGED_ROLES },
  { prefix: "/api/ai",                     roles: PRIVILEGED_ROLES },
  { prefix: "/api/v1/ai",                  roles: PRIVILEGED_ROLES },
  // Reviews: all authenticated roles can read; write is gated in the service
  { prefix: "/api/performance",            roles: ALL_ROLES },
  { prefix: "/api/v1/performance",         roles: ALL_ROLES },
  // Feedback, notifications, users: all authenticated
  { prefix: "/api/feedback",               roles: ALL_ROLES },
  { prefix: "/api/v1/feedback",            roles: ALL_ROLES },
  { prefix: "/api/notifications",          roles: ALL_ROLES },
  { prefix: "/api/v1/notifications",       roles: ALL_ROLES },
  { prefix: "/api/users",                  roles: ALL_ROLES },
  { prefix: "/api/v1/users",               roles: ALL_ROLES },
];

/**
 * Express middleware that looks up `req.path` in PATH_ROLE_MAP and calls
 * `requireRole` automatically.  Attach this after `authenticateJWT` on the
 * gateway router to get blanket path-based enforcement.
 *
 * Individual route handlers can still add a tighter `requireRole(...)` call
 * for write operations (POST / PATCH / DELETE).
 */
export function requireRoleForPath(req, res, next) {
  const path = req.originalUrl.split("?")[0];
  const entry = PATH_ROLE_MAP.find((e) => path.startsWith(e.prefix));
  if (!entry) return next();                 // unmatched path — let it through

  // Inline authenticateJWT if req.user is not already set
  if (!req.user && req.headers.authorization) {
    try {
      const jwtSecret = process.env.JWT_SECRET || "dev-only-secret-change-me";
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim();
        const payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
        req.user = {
          id: payload.sub,
          roles: payload.roles || [],
          role: payload.roles?.[0] || "",
          email: payload.email
        };
      }
    } catch (e) {
      // Ignore verification error; requireRole will return 401 since req.user is missing
    }
  }

  return requireRole(entry.roles)(req, res, next);
}
