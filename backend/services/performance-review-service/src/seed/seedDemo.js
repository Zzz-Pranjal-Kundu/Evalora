import { loadOrg, userIdByEmail } from "./orgSeed.js";
import { logger } from "../utils/logger.js";
import * as CycleModel from "../models/CycleModel.js";
import * as ReviewModel from "../models/ReviewModel.js";

export function seedIfEmpty() {
  if (CycleModel.count() > 0) return;
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const end = new Date(today.getTime() + 365 * 86400000).toISOString().slice(0, 10);
  CycleModel.insert({
    name: "Annual performance cycle",
    start_date: start,
    end_date: end,
    status: "ACTIVE",
  });
  logger.info("Seeded default review cycle");
}

export function seedDemoReviews() {
  const org = loadOrg();
  if (!org?.demoData) return;
  const emp = userIdByEmail(org, org.demoData.reviewEmployeeEmail || "liam.park@epfms.demo");
  const mgr = userIdByEmail(org, org.demoData.reviewManagerEmail || "maya.singh@epfms.demo");
  if (!emp || !mgr) return;
  const cycles = CycleModel.findAll();
  const cycle = cycles[0];
  if (!cycle) return;
  if (ReviewModel.hasAnyForEmployee(emp)) return;
  ReviewModel.insert({
    cycle_id: cycle.id,
    employee_id: emp,
    reviewer_id: mgr,
    status: "SUBMITTED",
    rating: 4.2,
    summary:
      "Consistently strong delivery on enterprise customer programs. Deepens trusted advisor relationships; continue scaling cross-pod coordination.",
    visibility: "with_managers",
  });
  logger.info("Seeded demo performance review (org JSON)");
}
