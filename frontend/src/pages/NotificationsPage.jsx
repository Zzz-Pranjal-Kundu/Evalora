import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { api } from "../api/index.js";
import { formatDateTime } from "../utils/format.js";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setError("");
    try {
      const { data } = await api.get("/notifications");
      let list = Array.isArray(data) ? data : [];
      if (list.some((n) => !n.read)) {
        await api.post("/notifications/read-all", {});
        const { data: again } = await api.get("/notifications");
        list = Array.isArray(again) ? again : [];
      }
      setItems(list);
      window.dispatchEvent(new CustomEvent("epfms-refresh-notifications"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    try {
      await api.post("/notifications/read-all", {});
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const unread = items.filter((n) => !n.read).length;
  const readCount = items.length - unread;

  if (loading) {
    return (
      <div className="page">
        <div className="page-loading">
          <span className="spinner" aria-hidden />
          Loading notifications…
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header page-header__row">
        <div>
          <h1>Notifications</h1>
          <p>
            {unread > 0 ? (
              <>
                You have <strong>{unread}</strong> unread {unread === 1 ? "item" : "items"}. Opening this inbox marks them
                read and clears the alert badge.
              </>
            ) : (
              "System and workflow updates appear here. New items are marked read when you open this page."
            )}
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={markAll} disabled={!items.length}>
          Mark all read
        </button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__value">{unread}</div>
          <div className="stat-card__label">Unread alerts</div>
          <p className="stat-card__hint">Items that still need acknowledgement.</p>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{readCount}</div>
          <div className="stat-card__label">Processed</div>
          <p className="stat-card__hint">Updates already reviewed by you.</p>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{items.length}</div>
          <div className="stat-card__label">Total in inbox</div>
          <p className="stat-card__hint">Workflow and system notifications retained in this session.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {items.length === 0 ? (
          <div className="empty-state" style={{ padding: "3rem 1.5rem" }}>
            <BellOff size={40} />
            <h3>All caught up</h3>
            <p className="muted" style={{ margin: 0, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
              When reviews or feedback events trigger alerts, they will show in this inbox with timestamps.
            </p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((n) => (
              <li
                key={n.id}
                style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "1px solid var(--color-border)",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                  background: n.read ? "transparent" : "rgb(239 246 255 / 0.6)",
                }}
              >
                <Bell size={20} style={{ flexShrink: 0, marginTop: 2, color: n.read ? "var(--color-muted)" : "var(--color-primary)" }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <strong>{n.title}</strong>
                    {!n.read && <span className="badge badge--active">New</span>}
                    {n.read && <span className="badge badge--muted">Read</span>}
                  </div>
                  {n.body && <div className="muted" style={{ marginTop: "0.35rem", fontSize: "0.9rem" }}>{n.body}</div>}
                  <div className="muted" style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
                    {formatDateTime(n.createdAt || n.created_at)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
