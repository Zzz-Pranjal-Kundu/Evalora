import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import profileRoutes from "./controllers/profileRoutes.js";
import recognitionRoutes from "./controllers/recognitionRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { swaggerSpec } from "./swagger.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "user-service" });
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/", profileRoutes);
  app.use("/", recognitionRoutes);
  app.use(errorHandler);
  return app;
}
