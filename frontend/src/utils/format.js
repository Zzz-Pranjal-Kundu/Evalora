export function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
  } catch {
    return iso;
  }
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return iso;
  }
}
