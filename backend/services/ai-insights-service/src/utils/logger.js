import winston from "winston";
import { env } from "../config/env.js";

export const logger = winston.createLogger({
  level: env.logLevel,
  transports: [new winston.transports.Console({ format: winston.format.simple() })],
});
