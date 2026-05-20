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
    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
    };
    next();
  } catch {
    return res.status(401).json({ detail: "Invalid token", message: "Invalid token" });
  }
}

export function requireRoles(...allowed) {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    if (!allowed.some((r) => roles.includes(r))) {
      return res.status(403).json({ detail: "Forbidden", message: "Forbidden" });
    }
    next();
  };
}
