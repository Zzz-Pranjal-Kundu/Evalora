import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const ReviewCycleSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  start_date: { type: String, required: true },
  end_date: { type: String, required: true },
  status: { type: String, default: "DRAFT" },
  created_at: { type: String, required: true }
}, {
  versionKey: false,
  _id: false
});

const ReviewCycle = mongoose.model("ReviewCycle", ReviewCycleSchema, "review_cycles");

export async function findAll() {
  const docs = await ReviewCycle.find({}).sort({ created_at: -1 }).lean();
  return docs.map(d => ({ ...d, id: d._id }));
}

export async function findById(cycleId) {
  if (!cycleId) return null;
  const doc = await ReviewCycle.findById(cycleId).lean();
  if (!doc) return null;
  return { ...doc, id: doc._id };
}

export async function insert({ name, start_date, end_date, status = "DRAFT" }) {
  const id = randomUUID();
  const created_at = new Date().toISOString();
  await ReviewCycle.create({
    _id: id,
    name,
    start_date,
    end_date,
    status,
    created_at
  });
  return findById(id);
}

export async function updateFields(cycleId, { name, start_date, end_date, status }) {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (start_date !== undefined) updates.start_date = start_date;
  if (end_date !== undefined) updates.end_date = end_date;
  if (status !== undefined) updates.status = status;
  
  await ReviewCycle.findByIdAndUpdate(cycleId, { $set: updates });
  return findById(cycleId);
}

export async function existsById(cycleId) {
  if (!cycleId) return false;
  const count = await ReviewCycle.countDocuments({ _id: cycleId });
  return count > 0;
}

export async function count() {
  return await ReviewCycle.countDocuments({});
}
