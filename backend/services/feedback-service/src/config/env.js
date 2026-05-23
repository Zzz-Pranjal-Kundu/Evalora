import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "8002", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/epfms",
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  internalKey: process.env.INTERNAL_SERVICE_KEY || "internal-dev-key",
  userServiceUrl: process.env.USER_SERVICE_URL || "http://localhost:3002",
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3003",
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || "http://localhost:8004",
  logLevel: process.env.LOG_LEVEL || "info",
};

