import express from "express";
import cors from "cors";
import helmet from "helmet";
import aiRoutes from "./controllers/aiRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "ai-insights-service" });
  });

  app.use("/ai", aiRoutes);
  app.use(errorHandler);
  return app;
}
