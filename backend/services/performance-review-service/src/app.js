import express from "express";
import cors from "cors";
import helmet from "helmet";
import cycleRoutes from "./controllers/cycleRoutes.js";
import reviewRoutes from "./controllers/reviewRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "performance-review-service" });
  });

  app.use("/cycles", cycleRoutes);
  app.use("/reviews", reviewRoutes);

  app.use(errorHandler);
  return app;
}
