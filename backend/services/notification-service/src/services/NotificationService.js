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
  static createInternal({ userId, title, body }) {
    const uid = String(userId ?? "").trim();
    const row = NotificationModel.create({ userId: uid, title, body });
    return notificationFromRow(row);
  }

  static listMine(userId) {
    const uid = String(userId ?? "").trim();
    return NotificationModel.listForUser(uid).map(notificationFromRow);
  }

  static markRead(userId, id) {
    const uid = String(userId ?? "").trim();
    const ok = NotificationModel.markRead(id, uid);
    if (!ok) {
      const err = new Error("Not found");
      err.statusCode = 404;
      throw err;
    }
    return { success: true };
  }

  static markAllRead(userId) {
    const uid = String(userId ?? "").trim();
    NotificationModel.markAllRead(uid);
    return { success: true };
  }

  static markFeedbackRelatedRead(userId) {
    const uid = String(userId ?? "").trim();
    const updated = NotificationModel.markReadByTitles(uid, FEEDBACK_NOTIFICATION_TITLES);
    return { success: true, updated };
  }
}
