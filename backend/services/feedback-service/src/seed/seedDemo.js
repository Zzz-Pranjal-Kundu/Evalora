import { randomUUID } from "node:crypto";
import { loadOrg, userIdByEmail } from "./orgSeed.js";
import { logger } from "../utils/logger.js";
import * as FeedbackRequestModel from "../models/FeedbackRequestModel.js";
import * as FeedbackEntryModel from "../models/FeedbackEntryModel.js";

export async function seedDemoFeedback() {
  const org = loadOrg();
  if (!org?.demoData) return;
  const emp = userIdByEmail(org, org.demoData.reviewEmployeeEmail || "liam.park@epfms.demo");
  const mgr = userIdByEmail(org, org.demoData.reviewManagerEmail || "maya.singh@epfms.demo");
  if (!emp || !mgr) return;
  if (await FeedbackRequestModel.findIdByFromUserTopicLike(emp, "%Q2 customer readout%")) return;
  const now = new Date().toISOString();
  const reqDoneId = randomUUID();
  await FeedbackRequestModel.insert({
    id: reqDoneId,
    from_user_id: emp,
    to_user_id: mgr,
    topic: "360 / manager: Q2 customer readout — seeking candid coaching",
    created_at: now,
    status: "COMPLETED",
    visibility: "with_managers",
  });
  await FeedbackEntryModel.insert({
    id: randomUUID(),
    request_id: reqDoneId,
    author_id: mgr,
    content:
      "You owned the narrative in the exec review. For next time, tighten the risks slide and invite Finance earlier—they felt looped in late.",
    created_at: now,
  });
  await FeedbackRequestModel.insert({
    id: randomUUID(),
    from_user_id: mgr,
    to_user_id: emp,
    topic: "Continuous — Manager check-in: stakeholder communication plan",
    created_at: now,
    status: "OPEN",
    visibility: "with_managers",
  });
  logger.info("Seeded demo feedback threads (org JSON)");
}
