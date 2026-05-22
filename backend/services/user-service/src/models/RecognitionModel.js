import { db } from "../db/database.js";

export class RecognitionModel {
  static async insert({ id, fromUserId, toUserId, valueTag, message, createdAt }) {
    const recognition = await db.recognition.create({
      data: {
        id,
        fromUserId,
        toUserId,
        badge: valueTag,
        message,
        createdAt: createdAt ? new Date(createdAt) : new Date()
      }
    });
    return RecognitionModel.findById(recognition.id);
  }

  static async findById(id) {
    if (!id) return null;
    const row = await db.recognition.findUnique({
      where: { id }
    });
    if (!row) return null;
    return {
      id: row.id,
      from_user_id: row.fromUserId,
      to_user_id: row.toUserId,
      value_tag: row.badge,
      message: row.message,
      visibility: "org_feed",
      created_at: row.createdAt.toISOString()
    };
  }

  static async listFeed(limit = 200) {
    const rows = await db.recognition.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    return rows.map((row) => ({
      id: row.id,
      from_user_id: row.fromUserId,
      to_user_id: row.toUserId,
      value_tag: row.badge,
      message: row.message,
      visibility: "org_feed",
      created_at: row.createdAt.toISOString()
    }));
  }
}
