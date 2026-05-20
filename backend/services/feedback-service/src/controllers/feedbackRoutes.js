import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth.js";
import * as feedbackService from "../services/feedbackDomainService.js";
import * as feedbackView from "../views/feedbackView.js";

const router = Router();

router.get("/requests", jwtAuth, async (req, res, next) => {
  try {
    const rows = await feedbackService.listRequests(req.user.id, req.user.roles || []);
    res.json(feedbackView.toRequestList(rows));
  } catch (e) {
    next(e);
  }
});

router.post("/requests", jwtAuth, async (req, res, next) => {
  try {
    const row = await feedbackService.createRequest(req.user.id, req.body);
    res.status(201).json(feedbackView.toRequestRow(row));
  } catch (e) {
    next(e);
  }
});

router.get("/requests/:request_id", jwtAuth, async (req, res, next) => {
  try {
    const detail = await feedbackService.getRequestDetail(req.params.request_id, req.user.id, req.user.roles || []);
    if (!detail) return res.status(404).json({ detail: "Not found", message: "Not found" });
    res.json(feedbackView.requestDetail(detail.request, detail.entries));
  } catch (e) {
    next(e);
  }
});

router.post("/requests/:request_id/entries", jwtAuth, async (req, res, next) => {
  try {
    const entry = await feedbackService.addEntry(
      req.params.request_id,
      req.user.id,
      req.user.roles || [],
      req.body?.content
    );
    res.status(201).json(feedbackView.toEntry(entry));
  } catch (e) {
    next(e);
  }
});

export default router;
