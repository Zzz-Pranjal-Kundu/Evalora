import { Router } from "express";
import { jwtAuth, requireManagerOrAdmin } from "../middleware/jwtAuth.js";
import * as AnalyticsService from "../services/analyticsService.js";

const router = Router();

router.get("/dashboard", jwtAuth, requireManagerOrAdmin, (req, res) => {
  res.json(AnalyticsService.dashboard());
});

export default router;
