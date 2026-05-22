import { randomUUID } from "crypto";
import { db } from "../db/database.js";

export class NotificationModel {
  static async create({ userId, title, body }) {
    const id = randomUUID();
    const notification = await db.notification.create({
      data: {
        id,
        userId,
        title,
        body,
        read: false
      }
    });
    return NotificationModel.findById(notification.id);
  }

  static async findById(id) {
    if (!id) return null;
    const row = await db.notification.findUnique({
      where: { id }
    });
    if (!row) return null;
    return {
      id: row.id,
      user_id: row.userId,
      title: row.title,
      body: row.body,
      read: row.read ? 1 : 0,
      created_at: row.createdAt.toISOString()
    };
  }

  static async listForUser(userId, { limit = 50 } = {}) {
    if (!userId) return [];
    const list = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    return list.map((row) => ({
      id: row.id,
      user_id: row.userId,
      title: row.title,
      body: row.body,
      read: row.read ? 1 : 0,
      created_at: row.createdAt.toISOString()
    }));
  }

  static async markRead(id, userId) {
    if (!id || !userId) return false;
    const res = await db.notification.updateMany({
      where: { id, userId },
      data: { read: true }
    });
    return res.count > 0;
  }

  static async markAllRead(userId) {
    if (!userId) return;
    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
  }

  /** Marks unread rows whose title matches feedback-service notification titles. */
  static async markReadByTitles(userId, titles) {
    if (!userId || !titles?.length) return 0;
    const res = await db.notification.updateMany({
      where: {
        userId,
        read: false,
        title: { in: titles }
      },
      data: { read: true }
    });
    return res.count;
  }
}
