import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const FeedbackRequestSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  from_user_id: { type: String, required: true },
  to_user_id: { type: String, required: true },
  topic: { type: String, required: true },
  status: { type: String, default: "OPEN" },
  visibility: { type: String, default: "with_managers" },
  created_at: { type: String, required: true }
}, {
  versionKey: false,
  _id: false
});

const FeedbackRequest = mongoose.model("FeedbackRequest", FeedbackRequestSchema, "feedback_requests");

export async function findAllOrdered() {
  const docs = await FeedbackRequest.find({}).sort({ created_at: -1 }).lean();
  return docs.map(d => ({ ...d, id: d._id }));
}

export async function findWhereOr(parts, params) {
  // Convert SQLite dynamic queries (e.g. from_user_id = ? OR to_user_id = ?) to Mongoose
  // Parts look like: ["from_user_id = ?", "to_user_id = ?"]
  // Params: [userId, userId]
  const queryOr = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const val = params[i];
    if (part.includes("from_user_id")) {
      queryOr.push({ from_user_id: val });
    } else if (part.includes("to_user_id")) {
      queryOr.push({ to_user_id: val });
    }
  }
  
  const docs = await FeedbackRequest.find({
    $or: queryOr
  }).sort({ created_at: -1 }).lean();
  
  return docs.map(d => ({ ...d, id: d._id }));
}

export async function findById(requestId) {
  if (!requestId) return null;
  const doc = await FeedbackRequest.findById(requestId).lean();
  if (!doc) return null;
  return { ...doc, id: doc._id };
}

export async function insert({
  id,
  from_user_id,
  to_user_id,
  topic,
  created_at,
  status = "OPEN",
  visibility = "with_managers",
}) {
  const finalId = id || randomUUID();
  const now = created_at || new Date().toISOString();
  
  await FeedbackRequest.create({
    _id: finalId,
    from_user_id,
    to_user_id,
    topic,
    status,
    visibility,
    created_at: now
  });
  
  return findById(finalId);
}

export async function findIdByFromUserTopicLike(fromUserId, topicLike) {
  if (!fromUserId || !topicLike) return null;
  const regexStr = topicLike.replace(/%/g, ".*");
  const row = await FeedbackRequest.findOne({
    from_user_id: fromUserId,
    topic: { $regex: new RegExp(regexStr, "i") }
  }, { _id: 1 }).lean();
  
  return row ? { id: row._id } : null;
}

export async function markCompleted(requestId) {
  await FeedbackRequest.findByIdAndUpdate(requestId, { $set: { status: "COMPLETED" } });
}
