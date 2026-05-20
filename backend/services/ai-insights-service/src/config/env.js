import dotenv from "dotenv";

dotenv.config();

/** Default matches api-gateway `AI_SERVICE_KEY` fallback */
export const env = {
  port: parseInt(process.env.PORT || "8005", 10),
  aiServiceKey: process.env.AI_SERVICE_KEY || "epfms-local-ai-key-change-me",
  logLevel: process.env.LOG_LEVEL || "info",
};
