import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./controllers/authRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { swaggerSpec } from "./swagger.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "auth-service" });
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/auth", authRoutes);
  app.use(errorHandler);
  return app;
}
