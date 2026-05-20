import { randomUUID } from "crypto";
import { db } from "../db/database.js";

export class NotificationModel {
  static create({ userId, title, body }) {
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO notifications (id, user_id, title, body, read, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`
    ).run(id, userId, title, body, now);
    return NotificationModel.findById(id);
  }

  static findById(id) {
    return db.prepare("SELECT * FROM notifications WHERE id = ?").get(id) ?? null;
  }

  static listForUser(userId, { limit = 50 } = {}) {
    return db
      .prepare(
        `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
      )
      .all(userId, limit);
  }

  static markRead(id, userId) {
    const res = db
      .prepare(
        `UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`
      )
      .run(id, userId);
    return res.changes > 0;
  }

  static markAllRead(userId) {
    db.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ?`).run(userId);
  }

  /** Marks unread rows whose title matches feedback-service notification titles. */
  static markReadByTitles(userId, titles) {
    if (!titles?.length) return 0;
    const placeholders = titles.map(() => "?").join(", ");
    const res = db
      .prepare(
        `UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0 AND title IN (${placeholders})`
      )
      .run(userId, ...titles);
    return Number(res.changes ?? 0);
  }
}
