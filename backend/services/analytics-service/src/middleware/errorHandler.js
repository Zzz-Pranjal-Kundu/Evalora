import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  if (status >= 500) {
    logger.error(err.message, { stack: err.stack });
  }
  res.status(status).json({ detail: err.message || "Error", message: err.message || "Error" });
}
