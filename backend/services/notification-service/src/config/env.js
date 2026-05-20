import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "3003", 10),
  databasePath: process.env.DATABASE_PATH || "../../data/notification.db",
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  internalKey: process.env.INTERNAL_SERVICE_KEY || "internal-dev-key",
  logLevel: process.env.LOG_LEVEL || "info",
};
