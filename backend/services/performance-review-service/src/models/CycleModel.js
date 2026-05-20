import { randomUUID } from "node:crypto";
import { db } from "../db/database.js";

export function findAll() {
  return db.prepare("SELECT * FROM review_cycles ORDER BY created_at DESC").all();
}

export function findById(cycleId) {
  return db.prepare("SELECT * FROM review_cycles WHERE id = ?").get(cycleId);
}

export function insert({ name, start_date, end_date, status = "DRAFT" }) {
  const id = randomUUID();
  const created_at = new Date().toISOString();
  db.prepare(
    `INSERT INTO review_cycles (id, name, start_date, end_date, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, name, start_date, end_date, status, created_at);
  return findById(id);
}

export function updateFields(cycleId, { name, start_date, end_date, status }) {
  db.prepare(`UPDATE review_cycles SET name = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?`).run(
    name,
    start_date,
    end_date,
    status,
    cycleId
  );
  return findById(cycleId);
}

export function existsById(cycleId) {
  return !!db.prepare("SELECT id FROM review_cycles WHERE id = ?").get(cycleId);
}

export function count() {
  return Number(db.prepare("SELECT COUNT(*) AS c FROM review_cycles").get().c);
}
