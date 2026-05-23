import { Router } from "express";
import { jwtAuth, requireManagerOrAdmin } from "../middleware/jwtAuth.js";
import * as AnalyticsService from "../services/analyticsService.js";

const router = Router();

router.get("/dashboard", jwtAuth, requireManagerOrAdmin, async (req, res) => {
  try {
    const data = await AnalyticsService.dashboard();
    res.json(data);
  } catch (e) {
    res.status(500).json({ detail: e.message, message: e.message });
  }
});

export default router;
