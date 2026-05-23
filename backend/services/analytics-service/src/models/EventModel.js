import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const EventSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  event_type: { type: String, required: true },
  payload_json: { type: String, required: true },
  received_at: { type: String, required: true }
}, {
  versionKey: false,
  _id: false
});

const MetricSnapshotSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  metric_key: { type: String, required: true },
  dimensions_json: { type: String, required: true },
  value: { type: Number, required: true },
  recorded_at: { type: String, required: true }
}, {
  versionKey: false,
  _id: false
});

const EventModel = mongoose.model("Event", EventSchema, "events");
const MetricSnapshotModel = mongoose.model("MetricSnapshot", MetricSnapshotSchema, "metric_snapshots");

export async function insertEvent(eventType, payload) {
  const now = new Date().toISOString();
  const id = randomUUID();
  const payloadJson = JSON.stringify(payload ?? {});
  
  await EventModel.create({
    _id: id,
    event_type: eventType,
    payload_json: payloadJson,
    received_at: now
  });
  
  const snapId = randomUUID();
  await MetricSnapshotModel.create({
    _id: snapId,
    metric_key: `event_count:${eventType}`,
    dimensions_json: "{}",
    value: 1,
    recorded_at: now
  });
  
  return { id, event_type: eventType, payload_json: payloadJson, received_at: now };
}

export async function listRecent(limit) {
  const docs = await EventModel.find({}).sort({ received_at: -1 }).limit(limit).lean();
  return docs.map(d => ({ ...d, id: d._id }));
}

export async function countAll() {
  return await EventModel.countDocuments({});
}
