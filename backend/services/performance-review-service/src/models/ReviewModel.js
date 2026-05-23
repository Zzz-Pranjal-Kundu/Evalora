import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const ReviewSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  cycle_id: { type: String, required: true },
  employee_id: { type: String, required: true },
  reviewer_id: { type: String, required: true },
  status: { type: String, required: true },
  rating: { type: Number, default: 0 },
  summary: { type: String, default: "" },
  visibility: { type: String, default: "participants_only" },
  created_at: { type: String, required: true },
  updated_at: { type: String, required: true }
}, {
  versionKey: false,
  _id: false
});

const Review = mongoose.model("Review", ReviewSchema, "reviews");

export async function findAll() {
  const docs = await Review.find({}).sort({ created_at: -1 }).lean();
  return docs.map(d => ({ ...d, id: d._id }));
}

export async function findForReviewerOrEmployee(userId) {
  if (!userId) return [];
  const docs = await Review.find({
    $or: [
      { reviewer_id: userId },
      { employee_id: userId }
    ]
  }).sort({ created_at: -1 }).lean();
  return docs.map(d => ({ ...d, id: d._id }));
}

export async function findForEmployee(userId) {
  if (!userId) return [];
  const docs = await Review.find({ employee_id: userId }).sort({ created_at: -1 }).lean();
  return docs.map(d => ({ ...d, id: d._id }));
}

export async function findById(reviewId) {
  if (!reviewId) return null;
  const doc = await Review.findById(reviewId).lean();
  if (!doc) return null;
  return { ...doc, id: doc._id };
}

export async function hasAnyForEmployee(employeeId) {
  if (!employeeId) return false;
  const count = await Review.countDocuments({ employee_id: employeeId });
  return count > 0;
}

export async function insert({
  cycle_id,
  employee_id,
  reviewer_id,
  status,
  rating,
  summary,
  visibility = "participants_only",
}) {
  const now = new Date().toISOString();
  const id = randomUUID();
  await Review.create({
    _id: id,
    cycle_id,
    employee_id,
    reviewer_id,
    status,
    rating,
    summary,
    visibility,
    created_at: now,
    updated_at: now
  });
  return findById(id);
}

export async function updateFields(reviewId, { status, rating, summary, visibility, updated_at }) {
  const prev = await findById(reviewId);
  if (!prev) return null;
  
  const vis = visibility !== undefined ? visibility : prev.visibility || "participants_only";
  const upDate = updated_at || new Date().toISOString();
  
  const updates = {};
  if (status !== undefined) updates.status = status;
  if (rating !== undefined) updates.rating = rating;
  if (summary !== undefined) updates.summary = summary;
  if (vis !== undefined) updates.visibility = vis;
  updates.updated_at = upDate;
  
  await Review.findByIdAndUpdate(reviewId, { $set: updates });
  return findById(reviewId);
}
