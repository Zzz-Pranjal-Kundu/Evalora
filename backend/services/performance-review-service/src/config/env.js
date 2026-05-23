import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "8001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/epfms",
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3003",
  userServiceUrl: process.env.USER_SERVICE_URL || "http://localhost:3002",
  internalKey: process.env.INTERNAL_SERVICE_KEY || "internal-dev-key",
  logLevel: process.env.LOG_LEVEL || "info",
};

