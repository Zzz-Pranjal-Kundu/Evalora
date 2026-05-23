import * as ReviewModel from "../models/ReviewModel.js";
import * as CycleModel from "../models/CycleModel.js";
import { sendNotification } from "./notifyInternal.js";
import * as userClient from "./userClient.js";

const PRIV = new Set(["ADMIN", "HR_ADMIN", "SUPER_ADMIN", "LEADERSHIP"]);

/** @param {unknown} raw */
function normalizeReviewVisibility(raw) {
  if (typeof raw === "string" && raw.trim() === "with_managers") return "with_managers";
  return "participants_only";
}

export async function listReviewsForUser(userId, roles) {
  const r = roles || [];
  if (r.some((x) => PRIV.has(x))) {
    return await ReviewModel.findAll();
  }
  if (r.includes("MANAGER")) {
    return await ReviewModel.findForReviewerOrEmployee(userId);
  }
  return await ReviewModel.findForEmployee(userId);
}

async function notifyManagersOfReview(row, headline) {
  if (normalizeReviewVisibility(row?.visibility) !== "with_managers") return;
  const profile = await userClient.fetchProfile(row.employee_id);
  const mid = profile?.managerId != null ? String(profile.managerId).trim() : "";
  const reviewer = row?.reviewer_id != null ? String(row.reviewer_id).trim() : "";
  if (!mid || mid === reviewer) return;
  await sendNotification(mid, headline, `Formal review activity for someone on your team (cycle in progress).`);
}

export async function createReview(actor, body) {
  const {
    cycle_id,
    employee_id,
    reviewer_id,
    status = "PENDING",
    rating = null,
    summary = null,
  } = body || {};
  const roles = actor.roles || [];
  if (!roles.includes("ADMIN") && reviewer_id !== actor.id) {
    const err = new Error("Only reviewer or admin can create this review");
    err.statusCode = 403;
    throw err;
  }
  if (!(await CycleModel.existsById(cycle_id))) {
    const err = new Error("Cycle not found");
    err.statusCode = 400;
    throw err;
  }
  const visibility = normalizeReviewVisibility(body?.visibility);
  const row = await ReviewModel.insert({
    cycle_id,
    employee_id,
    reviewer_id,
    status,
    rating,
    summary,
    visibility,
  });
  if (row.status === "SUBMITTED") {
    await sendNotification(
      row.employee_id,
      "Performance review submitted",
      `Your manager submitted a formal review for the active cycle (status: ${row.status}).`
    );
    await notifyManagersOfReview(row, "Performance review submitted");
  } else if (row.status === "PENDING") {
    await sendNotification(
      row.employee_id,
      "Performance review opened",
      `Your manager opened a formal review for you in the current cycle (pending completion).`
    );
    await notifyManagersOfReview(row, "Performance review opened");
  }
  return row;
}

export async function updateReview(reviewId, actor, body) {
  const r = await ReviewModel.findById(reviewId);
  if (!r) return null;
  const roles = actor.roles || [];
  if (!roles.includes("ADMIN") && actor.id !== r.reviewer_id) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  const b = body || {};
  const status = b.status !== undefined ? b.status : r.status;
  const rating = b.rating !== undefined ? b.rating : r.rating;
  const summary = b.summary !== undefined ? b.summary : r.summary;
  const visibility = b.visibility !== undefined ? normalizeReviewVisibility(b.visibility) : normalizeReviewVisibility(r.visibility);
  const now = new Date().toISOString();
  const row = await ReviewModel.updateFields(reviewId, { status, rating, summary, visibility, updated_at: now });
  await sendNotification(row.employee_id, "Performance review updated", `Your review status is now ${row.status}.`);
  await notifyManagersOfReview(row, "Performance review updated");
  return row;
}
