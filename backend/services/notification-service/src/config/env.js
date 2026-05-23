import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "3003", 10),
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/epfms",
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  internalKey: process.env.INTERNAL_SERVICE_KEY || "internal-dev-key",
  logLevel: process.env.LOG_LEVEL || "info",
};

