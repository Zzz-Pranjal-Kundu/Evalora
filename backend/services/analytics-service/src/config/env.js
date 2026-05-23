import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "8004", 10),
  mongodbUri: process.env.MONGODB_URI || "mongodb+srv://evaloraDB:GA75VaixhPv7Fhfm@cluster0.xuguph2.mongodb.net/epfms?retryWrites=true&w=majority&appName=Cluster0",
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  internalKey: process.env.INTERNAL_SERVICE_KEY || "internal-dev-key",
  logLevel: process.env.LOG_LEVEL || "info",
};

