/** Stub JSON payloads returned to the gateway (replace with real model output later). */

export function summarizeFeedback(wordCount) {
  return {
    summary: `Stub summary (${wordCount} words). Replace with LLM summarization.`,
    themes: [],
  };
}

export function reviewSummary() {
  return { summary: "Stub manager review narrative.", risks: [] };
}

export function reviewCommentQuality() {
  return { clarity: 0.8, actionability: 0.65, notes: ["Stub heuristic only"] };
}

export function biasAnalysis() {
  return { flags: [], severity: "low", detail: "Stub — integrate fairness model." };
}

export function competencyGap() {
  return { gaps: [], summary: "Stub competency gap narrative." };
}

export function developmentActions() {
  return { actions: ["Shadow senior stakeholder", "Complete advanced analytics course"] };
}

export function sentiment() {
  return { label: "neutral", score: 0.5 };
}

export function extractThemes(entryCount) {
  return { themes: [`theme-from-${entryCount}-entries`] };
}

export function executiveSummary(metricsKeys) {
  return {
    headline: "Org performance steady (stub).",
    bullets: ["Review cycle on track", "Feedback cadence within band"],
    inputKeys: metricsKeys,
  };
}
