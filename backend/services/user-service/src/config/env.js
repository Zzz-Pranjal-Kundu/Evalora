import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "3002", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databasePath: process.env.DATABASE_PATH || "../../data/user.db",
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  internalKey: process.env.INTERNAL_SERVICE_KEY || "internal-dev-key",
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3003",
  logLevel: process.env.LOG_LEVEL || "info",
};
