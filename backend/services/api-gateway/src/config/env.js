import dotenv from "dotenv";

dotenv.config();

// Listen port: use GATEWAY_PORT only (avoids accidental PORT=3001 from a copied auth .env).
export const env = {
  port: parseInt(process.env.GATEWAY_PORT || "8080", 10),
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  internalKey: process.env.INTERNAL_SERVICE_KEY || "internal-dev-key",
  authUrl: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  userUrl: process.env.USER_SERVICE_URL || "http://localhost:3002",
  notificationUrl: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3003",
  performanceUrl: process.env.PERFORMANCE_SERVICE_URL || "http://localhost:8001",
  feedbackUrl: process.env.FEEDBACK_SERVICE_URL || "http://localhost:8002",
  analyticsUrl: process.env.ANALYTICS_SERVICE_URL || "http://localhost:8004",
  aiInsightsUrl: process.env.AI_INSIGHTS_SERVICE_URL || "http://localhost:8005",
  aiServiceKey: process.env.AI_SERVICE_KEY || "epfms-local-ai-key-change-me",
  rateWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  rateMax: parseInt(process.env.RATE_LIMIT_MAX || "200", 10),
  logLevel: process.env.LOG_LEVEL || "info",
};
