import * as AnalyticsService from "../services/analyticsService.js";
import { db } from "../db/database.js";
import { logger } from "../utils/logger.js";

export async function seedDemoEvents() {
  const n = await db.event.count();
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
    await AnalyticsService.recordEvent(eventType, payload);
  }
  logger.info("Seeded demo analytics events");
}
