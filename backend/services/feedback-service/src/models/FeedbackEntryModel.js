import { randomUUID } from "node:crypto";
import { db } from "../db/database.js";

export function listByRequestId(requestId) {
  return db
    .prepare("SELECT * FROM feedback_entries WHERE request_id = ? ORDER BY created_at ASC")
    .all(requestId);
}

export function insert({ id, request_id, author_id, content, created_at }) {
  db.prepare(
    `INSERT INTO feedback_entries (id, request_id, author_id, content, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, request_id, author_id, content, created_at);
  return db.prepare("SELECT * FROM feedback_entries WHERE id = ?").get(id);
}
