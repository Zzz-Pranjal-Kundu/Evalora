import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, Send, UserSearch } from "lucide-react";
import { api } from "../api/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDateTime } from "../utils/format.js";

const CATEGORIES = [
  { value: "360 / peer", label: "360° — Peer" },
  { value: "360 / manager", label: "360° — Manager" },
  { value: "360 / direct report", label: "360° — Direct report" },
  { value: "360 / client", label: "360° — Client / stakeholder" },
  { value: "Manager", label: "Continuous — Manager touchpoint" },
  { value: "Project", label: "Project contribution" },
  { value: "Strengths", label: "Strengths & growth" },
];

function buildTopic(category, detail) {
  const base = `${category}: ${detail.trim()}`;
  return base.length > 200 ? `${base.slice(0, 197)}…` : base;
}

export default function FeedbackPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [toUserId, setToUserId] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [detail, setDetail] = useState("");
  const [requestVisibility, setRequestVisibility] = useState("with_managers");
  const [entryContent, setEntryContent] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [detailRow, setDetailRow] = useState(null);

  const load = async () => {
    setError("");
    try {
      const [reqRes, dirRes] = await Promise.all([
        api.get("/feedback/requests"),
        api.get("/users/directory").catch(() => ({ data: [] })),
      ]);
      setItems(reqRes.data);
      setDirectory(Array.isArray(dirRes.data) ? dirRes.data : []);
      try {
        await api.post("/notifications/read-feedback", {});
      } catch {
        /* mark-read is best-effort */
      }
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

  useEffect(() => {
    if (!selectedId) {
      setDetailRow(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/feedback/requests/${selectedId}`);
        if (!cancelled) setDetailRow(data);
      } catch {
        if (!cancelled) setDetailRow(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const nameFor = (id) => {
    const row = directory.find((d) => d.userId === id);
    return row ? `${row.fullName}` : id.slice(0, 8) + "…";
  };

  const createRequest = async (e) => {
    e.preventDefault();
    if (!toUserId || !detail.trim()) return;
    setError("");
    try {
      await api.post("/feedback/requests", {
        to_user_id: toUserId,
        topic: buildTopic(category, detail),
        visibility: requestVisibility,
      });
      setToUserId("");
      setDetail("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const addEntry = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setError("");
    try {
      await api.post(`/feedback/requests/${selectedId}/entries`, { content: entryContent });
      setEntryContent("");
      await load();
      const { data } = await api.get(`/feedback/requests/${selectedId}`);
      setDetailRow(data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-loading">
          <span className="spinner" aria-hidden />
          Loading feedback…
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>360° &amp; continuous feedback</h1>
        <p>
          Collect structured input from managers, peers, direct reports, and clients—alongside ongoing conversation themes—so
          appraisals reflect multiple perspectives, not a single point in time.
        </p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card epfms-callout">
        <strong>How to run a quality 360</strong>
        <p className="muted" style={{ margin: "0.35rem 0 0" }}>
          Pick raters who see your work directly, describe the situations you want comments on, and debrief results with your
          manager before ratings are finalized. Link themes to the{" "}
          <Link to="/competencies">competency model</Link> for fair comparisons.
        </p>
      </div>

      <div className="card">
        <h2>New feedback request</h2>
        <form onSubmit={createRequest}>
          <div className="form-grid form-grid--2">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="recipient">Colleague</label>
              {directory.length === 0 ? (
                <p className="muted" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <UserSearch size={18} />
                  No other people in the directory yet. Register a second test user to try peer requests.
                </p>
              ) : (
                <select id="recipient" value={toUserId} onChange={(e) => setToUserId(e.target.value)} required>
                  <option value="">Select teammate…</option>
                  {directory.map((d) => (
                    <option key={d.userId} value={d.userId}>
                      {d.fullName}
                      {d.department ? ` — ${d.department}` : ""}
                      {d.team ? ` · ${d.team}` : ""}
                      {d.jobTitle ? ` (${d.jobTitle})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="cat">Type</label>
              <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="detail">What you would like feedback on</label>
              <textarea
                id="detail"
                rows={3}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                required
                placeholder="Be specific: situation, skills, or outcomes you want comments on."
              />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: "0.25rem" }}>
            <span id="fb-vis-label" className="form-label-block">
              Who can see this thread in the hub &amp; get manager alerts?
            </span>
            <div className="epfms-radio-stack" role="radiogroup" aria-labelledby="fb-vis-label">
              <label className="epfms-radio-row">
                <input
                  type="radio"
                  name="fb-vis"
                  checked={requestVisibility === "with_managers"}
                  onChange={() => setRequestVisibility("with_managers")}
                />
                <span>
                  <strong>Colleague + managers</strong> — managers of you and your colleague get activity notifications and
                  can open this thread (same as most enterprise 360 rollouts).
                </span>
              </label>
              <label className="epfms-radio-row">
                <input
                  type="radio"
                  name="fb-vis"
                  checked={requestVisibility === "participants_only"}
                  onChange={() => setRequestVisibility("participants_only")}
                />
                <span>
                  <strong>Only you &amp; your colleague</strong> — no manager notifications and managers do not see this
                  thread in their feedback hub (HR / admin roles can still access for compliance).
                </span>
              </label>
            </div>
          </div>
          <button type="submit" disabled={!directory.length}>
            <Send size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 6 }} />
            Send request
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Requests</h2>
        {items.length === 0 ? (
          <div className="empty-state" style={{ padding: "1.5rem 0" }}>
            <Inbox size={36} />
            <h3>No requests yet</h3>
            <p>When you send a request, it appears here. Select one to add a written response.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>With</th>
                  <th>Visibility</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const iSent = user?.id && r.from_user_id === user.id;
                  const withLabel = iSent ? `To ${nameFor(r.to_user_id)}` : `From ${nameFor(r.from_user_id)}`;
                  const vis = r.visibility === "participants_only" ? "participants_only" : "with_managers";
                  const managerView =
                    vis === "participants_only" ? (
                      <span className="badge badge--muted">Participants only</span>
                    ) : user?.id && r.from_user_id !== user.id && r.to_user_id !== user.id ? (
                      <span className="badge badge--warn">Manager line-of-sight</span>
                    ) : (
                      <span className="badge badge--muted">Colleague + managers</span>
                    );
                  return (
                    <tr key={r.id}>
                      <td>{r.topic}</td>
                      <td className="muted" style={{ fontSize: "0.85rem" }}>
                        {withLabel}
                      </td>
                      <td>{managerView}</td>
                      <td>
                        <span className={`badge ${r.status === "OPEN" ? "badge--warn" : "badge--done"}`}>{r.status}</span>
                      </td>
                      <td className="muted" style={{ fontSize: "0.85rem" }}>
                        {formatDateTime(r.created_at)}
                      </td>
                      <td>
                        <button type="button" className="btn-sm btn-ghost" onClick={() => setSelectedId(r.id)}>
                          {selectedId === r.id ? "Selected" : "Open"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && (
        <div className="card">
          <h2>Add response</h2>
          {detailRow && (
            <p className="muted" style={{ marginTop: 0 }}>
              Thread: <strong>{detailRow.topic}</strong>
            </p>
          )}
          {detailRow?.entries?.length > 0 && (
            <div className="feedback-thread">
              {detailRow.entries.map((en) => (
                <div key={en.id} className="feedback-thread__entry">
                  <div className="muted" style={{ fontSize: "0.75rem", marginBottom: "0.35rem" }}>
                    {nameFor(en.author_id)} · {formatDateTime(en.created_at)}
                  </div>
                  <div>{en.content}</div>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={addEntry}>
            {detailRow?.visibility === "participants_only" ? (
              <p className="muted" style={{ marginTop: 0, fontSize: "0.85rem" }}>
                This thread is <strong>participants-only</strong>: manager activity alerts are off for new responses.
              </p>
            ) : (
              <p className="muted" style={{ marginTop: 0, fontSize: "0.85rem" }}>
                This thread includes <strong>managers</strong> in the loop: new responses can notify managers of both
                participants.
              </p>
            )}
            <div className="form-group">
              <label htmlFor="entry">Your feedback</label>
              <textarea
                id="entry"
                rows={4}
                value={entryContent}
                onChange={(e) => setEntryContent(e.target.value)}
                placeholder="Balanced, actionable comments read best in real performance conversations."
                required
              />
            </div>
            <button type="submit">Submit response</button>
          </form>
        </div>
      )}
    </div>
  );
}
