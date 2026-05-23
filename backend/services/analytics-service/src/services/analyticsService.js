import * as EventModel from "../models/EventModel.js";
import * as dashboardView from "../views/dashboardView.js";

export async function recordEvent(eventType, payload) {
  return await EventModel.insertEvent(eventType, payload);
}

export async function dashboard() {
  const rows = await EventModel.listRecent(100);
  const totalEvents = await EventModel.countAll();
  return dashboardView.buildDashboard(rows, totalEvents);
}
