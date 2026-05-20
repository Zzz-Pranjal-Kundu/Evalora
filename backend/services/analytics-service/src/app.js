import express from "express";
import cors from "cors";
import helmet from "helmet";
import internalRoutes from "./controllers/internalRoutes.js";
import analyticsRoutes from "./controllers/analyticsRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "analytics-service" });
  });

  app.use("/", internalRoutes);
  app.use("/analytics", analyticsRoutes);
  app.use(errorHandler);
  return app;
}
