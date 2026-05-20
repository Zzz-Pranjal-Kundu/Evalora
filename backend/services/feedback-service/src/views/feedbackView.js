export function toRequestRow(row) {
  return row;
}

export function toRequestList(rows) {
  return rows.map(toRequestRow);
}

export function toEntry(row) {
  return {
    id: row.id,
    request_id: row.request_id,
    author_id: row.author_id,
    content: row.content,
    created_at: row.created_at,
  };
}

export function requestDetail(r, entries) {
  return {
    id: r.id,
    from_user_id: r.from_user_id,
    to_user_id: r.to_user_id,
    topic: r.topic,
    status: r.status,
    visibility: r.visibility || "with_managers",
    created_at: r.created_at,
    entries: entries.map(toEntry),
  };
}
