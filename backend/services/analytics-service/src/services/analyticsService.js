import * as EventModel from "../models/EventModel.js";
import * as dashboardView from "../views/dashboardView.js";

export function recordEvent(eventType, payload) {
  return EventModel.insertEvent(eventType, payload);
}

export function dashboard() {
  const rows = EventModel.listRecent(100);
  const totalEvents = EventModel.countAll();
  return dashboardView.buildDashboard(rows, totalEvents);
}
