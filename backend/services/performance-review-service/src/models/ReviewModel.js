import { randomUUID } from "node:crypto";
import { db } from "../db/database.js";

export function findAll() {
  return db.prepare("SELECT * FROM reviews ORDER BY created_at DESC").all();
}

export function findForReviewerOrEmployee(userId) {
  return db
    .prepare(
      `SELECT * FROM reviews WHERE reviewer_id = ? OR employee_id = ?
       ORDER BY created_at DESC`
    )
    .all(userId, userId);
}

export function findForEmployee(userId) {
  return db.prepare("SELECT * FROM reviews WHERE employee_id = ? ORDER BY created_at DESC").all(userId);
}

export function findById(reviewId) {
  return db.prepare("SELECT * FROM reviews WHERE id = ?").get(reviewId);
}

export function hasAnyForEmployee(employeeId) {
  return !!db.prepare("SELECT id FROM reviews WHERE employee_id = ? LIMIT 1").get(employeeId);
}

export function insert({
  cycle_id,
  employee_id,
  reviewer_id,
  status,
  rating,
  summary,
  visibility = "participants_only",
}) {
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO reviews (id, cycle_id, employee_id, reviewer_id, status, rating, summary, visibility, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, cycle_id, employee_id, reviewer_id, status, rating, summary, visibility, now, now);
  return findById(id);
}

export function updateFields(reviewId, { status, rating, summary, visibility, updated_at }) {
  const prev = findById(reviewId);
  if (!prev) return null;
  const vis = visibility !== undefined ? visibility : prev.visibility || "participants_only";
  db.prepare(`UPDATE reviews SET status = ?, rating = ?, summary = ?, visibility = ?, updated_at = ? WHERE id = ?`).run(
    status,
    rating,
    summary,
    vis,
    updated_at,
    reviewId
  );
  return findById(reviewId);
}
