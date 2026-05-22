import { randomUUID } from "node:crypto";
import { db } from "../db/database.js";

function mapCycle(c) {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    start_date: c.startDate.toISOString().slice(0, 10),
    end_date: c.endDate.toISOString().slice(0, 10),
    status: c.status,
    created_at: c.createdAt.toISOString()
  };
}

export async function findAll() {
  const list = await db.reviewCycle.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return list.map(mapCycle);
}

export async function findById(cycleId) {
  if (!cycleId) return null;
  const c = await db.reviewCycle.findUnique({
    where: { id: cycleId }
  });
  return mapCycle(c);
}

export async function insert({ name, start_date, end_date, status = "DRAFT" }) {
  const id = randomUUID();
  const c = await db.reviewCycle.create({
    data: {
      id,
      name,
      startDate: new Date(start_date),
      endDate: new Date(end_date),
      status
    }
  });
  return findById(c.id);
}

export async function updateFields(cycleId, { name, start_date, end_date, status }) {
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (start_date !== undefined) updateData.startDate = new Date(start_date);
  if (end_date !== undefined) updateData.endDate = new Date(end_date);
  if (status !== undefined) updateData.status = status;

  await db.reviewCycle.update({
    where: { id: cycleId },
    data: updateData
  });
  return findById(cycleId);
}

export async function existsById(cycleId) {
  if (!cycleId) return false;
  const count = await db.reviewCycle.count({
    where: { id: cycleId }
  });
  return count > 0;
}

export async function count() {
  return await db.reviewCycle.count();
}
