export function buildDashboard(rows, totalEvents) {
  const byType = {};
  for (const r of rows) {
    byType[r.event_type] = (byType[r.event_type] || 0) + 1;
  }
  const labels = Object.keys(byType).slice(0, 8);
  const values = labels.map((k) => byType[k]);
  const recent = rows.slice(0, 15).map((r) => ({
    id: r.id,
    eventType: r.event_type,
    receivedAt: r.received_at,
    payload: JSON.parse(r.payload_json || "{}"),
  }));
  return {
    summary: { totalEvents },
    eventsByType: byType,
    chart: { labels, values },
    recentEvents: recent,
  };
}
