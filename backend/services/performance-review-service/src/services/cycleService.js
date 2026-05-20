import * as CycleModel from "../models/CycleModel.js";

export function listCycles() {
  return CycleModel.findAll();
}

export function createCycle({ name, start_date, end_date, status = "DRAFT" }) {
  return CycleModel.insert({ name, start_date, end_date, status });
}

export function getCycle(cycleId) {
  return CycleModel.findById(cycleId);
}

export function updateCycle(cycleId, body) {
  const cur = CycleModel.findById(cycleId);
  if (!cur) return null;
  const b = body || {};
  const name = b.name !== undefined ? b.name : cur.name;
  const start_date = b.start_date !== undefined ? b.start_date : cur.start_date;
  const end_date = b.end_date !== undefined ? b.end_date : cur.end_date;
  const status = b.status !== undefined ? b.status : cur.status;
  return CycleModel.updateFields(cycleId, { name, start_date, end_date, status });
}
