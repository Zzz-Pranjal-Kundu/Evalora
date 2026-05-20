import winston from "winston";
import { env } from "../config/env.js";

export const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "notification-service" },
  transports: [new winston.transports.Console()],
});
