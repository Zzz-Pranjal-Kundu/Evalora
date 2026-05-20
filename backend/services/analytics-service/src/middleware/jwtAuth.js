import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function jwtAuth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    if (!h.toLowerCase().startsWith("bearer ")) {
      return res.status(401).json({ detail: "Missing token", message: "Missing token" });
    }
    const token = h.slice(7).trim();
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    req.user = { id: payload.sub, roles: payload.roles || [] };
    next();
  } catch {
    return res.status(401).json({ detail: "Invalid token", message: "Invalid token" });
  }
}

export function requireManagerOrAdmin(req, res, next) {
  const allowed = new Set(["ADMIN", "MANAGER", "HR_ADMIN", "SUPER_ADMIN", "LEADERSHIP"]);
  if (!(req.user.roles || []).some((r) => allowed.has(r))) {
    return res.status(403).json({ detail: "Forbidden", message: "Forbidden" });
  }
  next();
}

export function verifyInternal(req, res, next) {
  const key = req.headers["x-internal-key"];
  if (!key || key !== env.internalKey) {
    return res.status(403).json({ detail: "Forbidden", message: "Forbidden" });
  }
  next();
}
