import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import gatewayRoutes from "./controllers/gatewayRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { swaggerSpec } from "./swagger.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true,
      exposedHeaders: ["Authorization"],
    })
  );
  app.use(express.json());

  app.use(
    rateLimit({
      windowMs: env.rateWindowMs,
      max: env.rateMax,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "api-gateway" });
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/api/v1", gatewayRoutes);
  app.use("/api", gatewayRoutes);
  app.use(errorHandler);
  return app;
}
