import { userHasPermission } from "../config/rbac.js";

export function requirePermission(...permissions) {
  return (req, res, next) => {
    const ok = permissions.some((p) => userHasPermission(req, p));
    if (!ok) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Insufficient permissions for this resource",
        required: permissions,
      });
    }
    next();
  };
}
