import * as CycleModel from "../models/CycleModel.js";

export async function listCycles() {
  return await CycleModel.findAll();
}

export async function createCycle({ name, start_date, end_date, status = "DRAFT" }) {
  return await CycleModel.insert({ name, start_date, end_date, status });
}

export async function getCycle(cycleId) {
  return await CycleModel.findById(cycleId);
}

export async function updateCycle(cycleId, body) {
  const cur = await CycleModel.findById(cycleId);
  if (!cur) return null;
  const b = body || {};
  const name = b.name !== undefined ? b.name : cur.name;
  const start_date = b.start_date !== undefined ? b.start_date : cur.start_date;
  const end_date = b.end_date !== undefined ? b.end_date : cur.end_date;
  const status = b.status !== undefined ? b.status : cur.status;
  return await CycleModel.updateFields(cycleId, { name, start_date, end_date, status });
}
