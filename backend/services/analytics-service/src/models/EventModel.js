import { randomUUID } from "node:crypto";
import { db } from "../db/database.js";

export function insertEvent(eventType, payload) {
  const now = new Date().toISOString();
  const id = randomUUID();
  const payloadJson = JSON.stringify(payload ?? {});
  db.prepare(`INSERT INTO events (id, event_type, payload_json, received_at) VALUES (?, ?, ?, ?)`).run(
    id,
    eventType,
    payloadJson,
    now
  );
  const snapId = randomUUID();
  db.prepare(
    `INSERT INTO metric_snapshots (id, metric_key, dimensions_json, value, recorded_at)
     VALUES (?, ?, ?, 1, ?)`
  ).run(snapId, `event_count:${eventType}`, "{}", now);
  return { id, event_type: eventType, payload_json: payloadJson, received_at: now };
}

export function listRecent(limit) {
  return db.prepare("SELECT * FROM events ORDER BY received_at DESC LIMIT ?").all(limit);
}

export function countAll() {
  const totalRow = db.prepare("SELECT COUNT(*) AS c FROM events").get();
  return Number(totalRow?.c || 0);
}
