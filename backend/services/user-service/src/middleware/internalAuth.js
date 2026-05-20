import { env } from "../config/env.js";

export function internalAuth(req, res, next) {
  const key = req.headers["x-internal-key"];
  if (!key || key !== env.internalKey) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}
