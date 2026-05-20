import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databasePath: process.env.DATABASE_PATH || "../../data/auth.db",
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  logLevel: process.env.LOG_LEVEL || "info",
};
