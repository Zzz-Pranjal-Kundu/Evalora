import * as aiStubView from "../views/aiStubView.js";

function words(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function summarizeFeedback(body) {
  const n = words(body?.text || "");
  return aiStubView.summarizeFeedback(n);
}

export function generateReviewSummary() {
  return aiStubView.reviewSummary();
}

export function checkReviewCommentQuality() {
  return aiStubView.reviewCommentQuality();
}

export function analyzeBias() {
  return aiStubView.biasAnalysis();
}

export function competencyGapSummary() {
  return aiStubView.competencyGap();
}

export function recommendDevelopmentActions() {
  return aiStubView.developmentActions();
}

export function sentiment() {
  return aiStubView.sentiment();
}

export function extractThemes(body) {
  const entries = Array.isArray(body?.entries) ? body.entries : [];
  return aiStubView.extractThemes(entries.length);
}

export function executiveSummary(body) {
  const metrics = body?.metrics && typeof body.metrics === "object" ? body.metrics : {};
  return aiStubView.executiveSummary(Object.keys(metrics));
}
