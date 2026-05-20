import { Router } from "express";
import { jwtAuth, requireRoles } from "../middleware/jwtAuth.js";
import * as reviewService from "../services/reviewService.js";
import * as reviewView from "../views/reviewView.js";

const router = Router();

router.get("/", jwtAuth, (req, res) => {
  res.json(reviewView.toReviewList(reviewService.listReviewsForUser(req.user.id, req.user.roles || [])));
});

router.post(
  "/",
  jwtAuth,
  requireRoles("ADMIN", "MANAGER", "HR_ADMIN", "SUPER_ADMIN", "LEADERSHIP"),
  async (req, res) => {
  try {
    const { cycle_id, employee_id, reviewer_id } = req.body || {};
    if (!cycle_id || !employee_id || !reviewer_id) {
      return res.status(400).json({ detail: "cycle_id, employee_id, reviewer_id required", message: "Invalid body" });
    }
    const row = await reviewService.createReview(req.user, req.body);
    res.status(201).json(reviewView.toReview(row));
  } catch (e) {
    const status = e.statusCode || 500;
    res.status(status).json({ detail: e.message, message: e.message });
  }
});

router.patch("/:review_id", jwtAuth, async (req, res) => {
  try {
    const row = await reviewService.updateReview(req.params.review_id, req.user, req.body);
    if (!row) return res.status(404).json({ detail: "Not found", message: "Not found" });
    res.json(reviewView.toReview(row));
  } catch (e) {
    const status = e.statusCode || 500;
    res.status(status).json({ detail: e.message, message: e.message });
  }
});

export default router;
