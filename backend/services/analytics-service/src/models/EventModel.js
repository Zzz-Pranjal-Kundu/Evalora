import { randomUUID } from "node:crypto";
import { db } from "../db/database.js";

export async function insertEvent(eventType, payload) {
  const now = new Date();
  const id = randomUUID();
  const payloadJson = JSON.stringify(payload ?? {});
  
  const event = await db.event.create({
    data: {
      id,
      eventType,
      payloadJson,
      receivedAt: now
    }
  });

  const snapId = randomUUID();
  await db.metricSnapshot.create({
    data: {
      id: snapId,
      metricKey: `event_count:${eventType}`,
      dimensionsJson: "{}",
      value: 1.0,
      recordedAt: now
    }
  });

  return {
    id: event.id,
    event_type: event.eventType,
    payload_json: event.payloadJson,
    received_at: event.receivedAt.toISOString()
  };
}

export async function listRecent(limit) {
  const list = await db.event.findMany({
    orderBy: { receivedAt: 'desc' },
    take: limit
  });
  return list.map((item) => ({
    id: item.id,
    event_type: item.eventType,
    payload_json: item.payloadJson,
    received_at: item.receivedAt.toISOString()
  }));
}

export async function countAll() {
  return await db.event.count();
}
