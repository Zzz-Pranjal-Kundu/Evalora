import { Router } from "express";
import { verifyInternal } from "../middleware/jwtAuth.js";
import * as AnalyticsService from "../services/analyticsService.js";

const router = Router();

router.post("/internal/events", verifyInternal, async (req, res) => {
  const { eventType, payload } = req.body || {};
  if (!eventType) {
    return res.status(400).json({ detail: "eventType required", message: "Invalid body" });
  }
  await AnalyticsService.recordEvent(eventType, typeof payload === "object" && payload ? payload : {});
  res.status(201).json({ ok: true });
});

export default router;
