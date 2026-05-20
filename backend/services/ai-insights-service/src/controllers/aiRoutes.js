import { Router } from "express";
import { verifyServiceKey } from "../middleware/serviceKey.js";
import * as aiStubService from "../services/aiStubService.js";

const router = Router();
router.use(verifyServiceKey);

router.post("/summarize-feedback", (req, res) => {
  res.json(aiStubService.summarizeFeedback(req.body));
});

router.post("/generate-review-summary", (req, res) => {
  res.json(aiStubService.generateReviewSummary());
});

router.post("/check-review-comment-quality", (req, res) => {
  res.json(aiStubService.checkReviewCommentQuality());
});

router.post("/analyze-bias", (req, res) => {
  res.json(aiStubService.analyzeBias());
});

router.post("/competency-gap-summary", (req, res) => {
  res.json(aiStubService.competencyGapSummary());
});

router.post("/recommend-development-actions", (req, res) => {
  res.json(aiStubService.recommendDevelopmentActions());
});

router.post("/sentiment", (req, res) => {
  res.json(aiStubService.sentiment());
});

router.post("/extract-themes", (req, res) => {
  res.json(aiStubService.extractThemes(req.body));
});

router.post("/executive-summary", (req, res) => {
  res.json(aiStubService.executiveSummary(req.body));
});

export default router;
