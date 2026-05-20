import { env } from "../config/env.js";

export function verifyServiceKey(req, res, next) {
  const key = req.headers["x-service-key"];
  if (!key || key !== env.aiServiceKey) {
    return res.status(403).json({ detail: "Invalid service key", message: "Forbidden" });
  }
  next();
}
