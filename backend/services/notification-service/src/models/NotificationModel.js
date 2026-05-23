import mongoose from "mongoose";
import { randomUUID } from "crypto";

const NotificationSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  user_id: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  read: { type: Number, default: 0 },
  created_at: { type: String, required: true }
}, {
  versionKey: false,
  _id: false
});

const Notification = mongoose.model("Notification", NotificationSchema, "notifications");

export class NotificationModel {
  static async create({ userId, title, body }) {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    await Notification.create({
      _id: id,
      user_id: userId,
      title,
      body,
      read: 0,
      created_at: now
    });
    
    return NotificationModel.findById(id);
  }

  static async findById(id) {
    if (!id) return null;
    const doc = await Notification.findById(id).lean();
    if (!doc) return null;
    return { ...doc, id: doc._id };
  }

  static async listForUser(userId, { limit = 50 } = {}) {
    if (!userId) return [];
    const docs = await Notification.find({ user_id: userId }).sort({ created_at: -1 }).limit(limit).lean();
    return docs.map(d => ({ ...d, id: d._id }));
  }

  static async markRead(id, userId) {
    const res = await Notification.updateOne({ _id: id, user_id: userId }, { $set: { read: 1 } });
    return res.modifiedCount > 0;
  }

  static async markAllRead(userId) {
    await Notification.updateMany({ user_id: userId }, { $set: { read: 1 } });
  }

  static async markReadByTitles(userId, titles) {
    if (!titles?.length) return 0;
    const res = await Notification.updateMany({
      user_id: userId,
      read: 0,
      title: { $in: titles }
    }, { $set: { read: 1 } });
    return res.modifiedCount;
  }
}
