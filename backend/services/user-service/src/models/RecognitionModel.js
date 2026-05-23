import mongoose from "mongoose";

const RecognitionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  from_user_id: { type: String, required: true },
  to_user_id: { type: String, required: true },
  value_tag: { type: String, required: true },
  message: { type: String, required: true },
  visibility: { type: String, default: "org_feed" },
  created_at: { type: String, required: true }
}, {
  versionKey: false,
  _id: false
});

const Recognition = mongoose.model("Recognition", RecognitionSchema, "recognitions");

export class RecognitionModel {
  static async insert({ id, fromUserId, toUserId, valueTag, message, createdAt, visibility = "org_feed" }) {
    await Recognition.create({
      _id: id,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      value_tag: valueTag,
      message: message,
      visibility: visibility,
      created_at: createdAt
    });
    return RecognitionModel.findById(id);
  }

  static async findById(id) {
    if (!id) return null;
    const doc = await Recognition.findById(id).lean();
    if (!doc) return null;
    return { ...doc, id: doc._id };
  }

  static async listFeed(limit = 200) {
    const docs = await Recognition.find({}).sort({ created_at: -1 }).limit(limit).lean();
    return docs.map(d => ({ ...d, id: d._id }));
  }
}
