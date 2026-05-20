import { Router } from "express";
import { body } from "express-validator";
import { jwtAuth } from "../middleware/jwtAuth.js";
import { RecognitionController } from "./RecognitionController.js";

const router = Router();

router.get("/recognitions/feed", jwtAuth, RecognitionController.listFeed);

router.post(
  "/recognitions",
  jwtAuth,
  [
    body("message").isString().trim().notEmpty().withMessage("Message is required"),
    body("valueTag").optional({ nullable: true }).isString().trim().notEmpty(),
    body("visibility")
      .optional()
      .isIn(["org_feed", "sender_recipient_only"])
      .withMessage("visibility must be org_feed or sender_recipient_only"),
  ],
  RecognitionController.create
);

export default router;
