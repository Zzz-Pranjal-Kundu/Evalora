import { NotificationModel } from "../models/NotificationModel.js";
import { notificationFromRow } from "../views/notificationView.js";

/** Titles emitted by `feedback-service` via internal notify (keep in sync with feedbackDomainService). */
export const FEEDBACK_NOTIFICATION_TITLES = [
  "New feedback request",
  "Team feedback activity",
  "Feedback response received",
  "Feedback thread updated",
];

export class NotificationService {
  static async createInternal({ userId, title, body }) {
    const uid = String(userId ?? "").trim();
    const row = await NotificationModel.create({ userId: uid, title, body });
    return notificationFromRow(row);
  }

  static async listMine(userId) {
    const uid = String(userId ?? "").trim();
    const list = await NotificationModel.listForUser(uid);
    return list.map(notificationFromRow);
  }

  static async markRead(userId, id) {
    const uid = String(userId ?? "").trim();
    const ok = await NotificationModel.markRead(id, uid);
    if (!ok) {
      const err = new Error("Not found");
      err.statusCode = 404;
      throw err;
    }
    return { success: true };
  }

  static async markAllRead(userId) {
    const uid = String(userId ?? "").trim();
    await NotificationModel.markAllRead(uid);
    return { success: true };
  }

  static async markFeedbackRelatedRead(userId) {
    const uid = String(userId ?? "").trim();
    const updated = await NotificationModel.markReadByTitles(uid, FEEDBACK_NOTIFICATION_TITLES);
    return { success: true, updated };
  }
}
