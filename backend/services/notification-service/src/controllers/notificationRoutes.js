import { Router } from "express";
import { body } from "express-validator";
import { NotificationController } from "./NotificationController.js";
import { jwtAuth } from "../middleware/jwtAuth.js";
import { internalAuth } from "../middleware/internalAuth.js";

const router = Router();

/** Coerce IDs from JSON (some callers send numbers) before validators run. */
function normalizeInternalNotifyBody(req, _res, next) {
  const b = req.body;
  if (b && typeof b === "object") {
    if (b.userId != null) b.userId = String(b.userId).trim();
    if (typeof b.title === "string") b.title = b.title.trim();
    if (typeof b.body === "string") b.body = b.body.trim();
  }
  next();
}

router.post(
  "/internal/notify",
  internalAuth,
  normalizeInternalNotifyBody,
  [
    body("userId").isString().notEmpty(),
    body("title").isString().notEmpty(),
    body("body").isString().notEmpty(),
  ],
  NotificationController.createInternal
);

router.get("/notifications", jwtAuth, NotificationController.list);
router.post("/notifications/read-all", jwtAuth, NotificationController.markAll);
router.post("/notifications/read-feedback", jwtAuth, NotificationController.markFeedbackRead);
router.post("/notifications/:id/read", jwtAuth, NotificationController.markRead);

export default router;
