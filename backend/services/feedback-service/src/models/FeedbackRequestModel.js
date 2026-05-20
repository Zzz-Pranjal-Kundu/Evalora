import { randomUUID } from "node:crypto";
import { db } from "../db/database.js";

export function findAllOrdered() {
  return db.prepare("SELECT * FROM feedback_requests ORDER BY created_at DESC").all();
}

export function findWhereOr(parts, params) {
  const sql = `SELECT * FROM feedback_requests WHERE ${parts.join(" OR ")} ORDER BY created_at DESC`;
  return db.prepare(sql).all(...params);
}

export function findById(requestId) {
  return db.prepare("SELECT * FROM feedback_requests WHERE id = ?").get(requestId);
}

export function insert({
  id,
  from_user_id,
  to_user_id,
  topic,
  created_at,
  status = "OPEN",
  visibility = "with_managers",
}) {
  db.prepare(
    `INSERT INTO feedback_requests (id, from_user_id, to_user_id, topic, status, visibility, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, from_user_id, to_user_id, topic, status, visibility, created_at);
  return findById(id);
}

export function findIdByFromUserTopicLike(fromUserId, topicLike) {
  return db
    .prepare(`SELECT id FROM feedback_requests WHERE from_user_id = ? AND topic LIKE ? LIMIT 1`)
    .get(fromUserId, topicLike);
}

export function markCompleted(requestId) {
  db.prepare(`UPDATE feedback_requests SET status = 'COMPLETED' WHERE id = ?`).run(requestId);
}
