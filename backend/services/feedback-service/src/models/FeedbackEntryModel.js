import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const FeedbackEntrySchema = new mongoose.Schema({
  _id: { type: String, required: true },
  request_id: { type: String, required: true },
  author_id: { type: String, required: true },
  content: { type: String, required: true },
  created_at: { type: String, required: true }
}, {
  versionKey: false,
  _id: false
});

const FeedbackEntry = mongoose.model("FeedbackEntry", FeedbackEntrySchema, "feedback_entries");

export async function listByRequestId(requestId) {
  if (!requestId) return [];
  const docs = await FeedbackEntry.find({ request_id: requestId }).sort({ created_at: 1 }).lean();
  return docs.map(d => ({ ...d, id: d._id }));
}

export async function insert({ id, request_id, author_id, content, created_at }) {
  const finalId = id || randomUUID();
  const now = created_at || new Date().toISOString();
  
  await FeedbackEntry.create({
    _id: finalId,
    request_id,
    author_id,
    content,
    created_at: now
  });
  
  const doc = await FeedbackEntry.findById(finalId).lean();
  return doc ? { ...doc, id: doc._id } : null;
}
