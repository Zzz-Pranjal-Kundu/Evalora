import { db } from "../db/database.js";

export class RecognitionModel {
  static insert({ id, fromUserId, toUserId, valueTag, message, createdAt, visibility = "org_feed" }) {
    db.prepare(
      `INSERT INTO recognitions (id, from_user_id, to_user_id, value_tag, message, visibility, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, fromUserId, toUserId, valueTag, message, visibility, createdAt);
    return RecognitionModel.findById(id);
  }

  static findById(id) {
    return db.prepare("SELECT * FROM recognitions WHERE id = ?").get(id) ?? null;
  }

  static listFeed(limit = 200) {
    return db
      .prepare(
        `SELECT * FROM recognitions ORDER BY datetime(created_at) DESC LIMIT ?`
      )
      .all(limit);
  }
}
