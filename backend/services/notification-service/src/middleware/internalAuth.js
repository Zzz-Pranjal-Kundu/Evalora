import { env } from "../config/env.js";

export function internalAuth(req, res, next) {
  if (req.headers["x-internal-key"] !== env.internalKey) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}
