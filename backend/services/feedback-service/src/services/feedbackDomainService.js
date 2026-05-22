import { randomUUID } from "node:crypto";
import * as FeedbackRequestModel from "../models/FeedbackRequestModel.js";
import * as FeedbackEntryModel from "../models/FeedbackEntryModel.js";
import * as userClient from "./userClient.js";
import { sendNotification } from "./notifyInternal.js";
import { recordEvent } from "./analyticsClient.js";

const PRIV = new Set(["HR_ADMIN", "SUPER_ADMIN", "ADMIN", "LEADERSHIP"]);

/** @typedef {"with_managers" | "participants_only"} FeedbackVisibility */

function isPrivileged(roles) {
  return (roles || []).some((r) => PRIV.has(r));
}

/** @param {unknown} raw @returns {FeedbackVisibility} */
function normalizeFeedbackVisibility(raw) {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (v === "participants_only") return "participants_only";
  return "with_managers";
}

async function managedUserIds(managerId) {
  const ids = await userClient.fetchReportUserIds(managerId);
  return new Set(ids);
}

async function canAccessRequest(r, viewerId, roles, managed) {
  if (!r) return false;
  if (isPrivileged(roles)) return true;
  if (r.from_user_id === viewerId || r.to_user_id === viewerId) return true;
  const vis = r.visibility || "with_managers";
  if (vis === "participants_only") return false;
  return managed.has(r.from_user_id) || managed.has(r.to_user_id);
}

export async function listRequests(userId, roles) {
  let rows;
  if (isPrivileged(roles)) {
    rows = await FeedbackRequestModel.findAllOrdered();
  } else {
    const managed = await managedUserIds(userId);
    const parts = ["from_user_id = ?", "to_user_id = ?"];
    const params = [userId, userId];
    for (const m of managed) {
      parts.push("from_user_id = ?");
      parts.push("to_user_id = ?");
      params.push(m, m);
    }
    rows = await FeedbackRequestModel.findWhereOr(parts, params);
  }
  return rows.filter((r) => {
    const vis = r.visibility || "with_managers";
    if (vis !== "participants_only") return true;
    if (isPrivileged(roles)) return true;
    return r.from_user_id === userId || r.to_user_id === userId;
  });
}

export async function createRequest(actorId, body) {
  const { to_user_id, topic } = body || {};
  if (!to_user_id || !topic || !String(topic).trim()) {
    const err = new Error("to_user_id and topic required");
    err.statusCode = 400;
    throw err;
  }
  const visibility = normalizeFeedbackVisibility(body?.visibility);
  const now = new Date().toISOString();
  const id = randomUUID();
  const row = await FeedbackRequestModel.insert({
    id,
    from_user_id: actorId,
    to_user_id,
    topic,
    created_at: now,
    visibility,
  });
  await recordEvent("FEEDBACK_REQUEST_CREATED", { requestId: id, to: to_user_id });
  const fromName = await userClient.displayName(actorId);
  const toName = await userClient.displayName(to_user_id);
  const preview = topic.length <= 180 ? topic : `${topic.slice(0, 177)}…`;
  await sendNotification(to_user_id, "New feedback request", `${fromName} asked you for feedback: ${preview}`);
  if (visibility === "with_managers") {
    const managerIds = new Set();
    for (const uid of [actorId, to_user_id]) {
      const p = await userClient.fetchProfile(uid);
      if (p?.managerId != null && String(p.managerId).trim()) managerIds.add(String(p.managerId).trim());
    }
    const actor = String(actorId ?? "").trim();
    for (const mid of managerIds) {
      if (mid === actor) continue;
      await sendNotification(
        mid,
        "Team feedback activity",
        `${fromName} sent a feedback request to ${toName}. Topic: ${preview}`
      );
    }
  }
  return row;
}

export async function getRequestDetail(requestId, userId, roles) {
  const r = await FeedbackRequestModel.findById(requestId);
  if (!r) return null;
  const managed = await managedUserIds(userId);
  if (!(await canAccessRequest(r, userId, roles, managed))) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  const entries = await FeedbackEntryModel.listByRequestId(requestId);
  return { request: r, entries };
}

export async function addEntry(requestId, actorId, roles, content) {
  if (!content || !String(content).trim()) {
    const err = new Error("content required");
    err.statusCode = 400;
    throw err;
  }
  const r = await FeedbackRequestModel.findById(requestId);
  if (!r) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
  const managed = await managedUserIds(actorId);
  if (!(await canAccessRequest(r, actorId, roles, managed))) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  if (r.from_user_id !== actorId && r.to_user_id !== actorId) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
  const now = new Date().toISOString();
  const eid = randomUUID();
  const entry = await FeedbackEntryModel.insert({
    id: eid,
    request_id: requestId,
    author_id: actorId,
    content,
    created_at: now,
  });
  await FeedbackRequestModel.markCompleted(requestId);
  await recordEvent("FEEDBACK_ENTRY_CREATED", { requestId, entryId: eid });
  const otherId = actorId === r.to_user_id ? r.from_user_id : r.to_user_id;
  const authorName = await userClient.displayName(actorId);
  const preview = content.length <= 160 ? content : `${content.slice(0, 157)}…`;
  if (otherId !== actorId) {
    const topicBit = r.topic.length <= 100 ? r.topic : `${r.topic.slice(0, 97)}…`;
    await sendNotification(
      otherId,
      "Feedback response received",
      `${authorName} added a response on "${topicBit}". ${preview}`
    );
  }
  const mgrSet = new Set();
  for (const uid of [r.from_user_id, r.to_user_id]) {
    const p = await userClient.fetchProfile(uid);
    if (p?.managerId != null && String(p.managerId).trim()) mgrSet.add(String(p.managerId).trim());
  }
  const threadVis = r.visibility || "with_managers";
  const author = String(actorId ?? "").trim();
  if (threadVis === "with_managers") {
    for (const mid of mgrSet) {
      if (mid === author) continue;
      await sendNotification(
        mid,
        "Feedback thread updated",
        `${authorName} posted on a feedback thread involving your team. ${preview}`
      );
    }
  }
  return entry;
}
