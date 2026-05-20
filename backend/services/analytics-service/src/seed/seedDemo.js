import * as AnalyticsService from "../services/analyticsService.js";
import { db } from "../db/database.js";
import { logger } from "../utils/logger.js";

export function seedDemoEvents() {
  const n = db.prepare("SELECT COUNT(*) AS c FROM events").get().c;
  if (n > 0) return;
  const samples = [
    ["GOAL_CREATED", { owner: "demo", titleHint: "migration" }],
    ["GOAL_PROGRESS_UPDATED", { pct: 62 }],
    ["FEEDBACK_REQUEST_CREATED", { channel: "360" }],
    ["FEEDBACK_ENTRY_CREATED", { channel: "manager" }],
    ["REVIEW_SUBMITTED", { cycle: "annual" }],
    ["LOGIN_SUCCESS", { persona: "employee" }],
    ["LOGIN_SUCCESS", { persona: "manager" }],
    ["SELF_ASSESSMENT_SAVED", { source: "demo_stub" }],
    ["CHECKIN_LOGGED", { cadence: "weekly" }],
  ];
  for (const [eventType, payload] of samples) {
    AnalyticsService.recordEvent(eventType, payload);
  }
  logger.info("Seeded demo analytics events");
}
