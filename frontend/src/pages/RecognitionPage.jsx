import { useCallback, useEffect, useState } from "react";
import { Sparkles, Award } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/index.js";
import { formatDateTime } from "../utils/format.js";

const VALUES = ["Customer focus", "Innovation", "Teamwork", "Integrity", "Excellence"];

async function loadFeed() {
  const { data } = await api.get("/users/recognitions/feed");
  return Array.isArray(data) ? data : [];
}

export default function RecognitionPage() {
  const { user } = useAuth();
  const [directory, setDirectory] = useState([]);
  const [feed, setFeed] = useState([]);
  const [toUserId, setToUserId] = useState("");
  const [valueTag, setValueTag] = useState(VALUES[0]);
  const [message, setMessage] = useState("");
  const [feedVisibility, setFeedVisibility] = useState("org_feed");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const personalizedCount = feed.filter((row) => !!row.toUserId).length;

  const refreshFeed = useCallback(async () => {
    try {
      setFeed(await loadFeed());
    } catch {
      setFeed([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/users/directory");
        setDirectory(Array.isArray(data) ? data : []);
      } catch {
        setDirectory([]);
      }
    })();
    refreshFeed();
  }, [refreshFeed]);

  const nameFor = (id) => {
    const row = directory.find((d) => d.userId === id);
    return row ? row.fullName : "Colleague";
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      await api.post("/users/recognitions", {
        toUserId: toUserId || null,
        valueTag,
        message: message.trim(),
        visibility: feedVisibility,
      });
      setMessage("");
      setToUserId("");
      await refreshFeed();
      window.dispatchEvent(new CustomEvent("epfms-refresh-notifications"));
    } catch (err) {
      setError(err?.message || "Could not post recognition");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>
          <Sparkles size={28} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 10 }} />
          Recognition &amp; incentives
        </h1>
        <p>
          Celebrate high performance in public, value-based language. Tie recognition to outcomes customers care about—then
          let HR connect standout stories to rewards programs.
        </p>
      </header>

      <div className="card">
        <h2>
          <Award size={20} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 8 }} />
          Give a shout-out
        </h2>
        <form onSubmit={submit}>
          <div className="form-grid form-grid--2">
            <div className="form-group">
              <label htmlFor="who">Who are you recognizing?</label>
              <select id="who" value={toUserId} onChange={(e) => setToUserId(e.target.value)}>
                <option value="">Whole team / general</option>
                {directory
                  .filter((d) => d.userId !== user?.id)
                  .map((d) => (
                    <option key={d.userId} value={d.userId}>
                      {d.fullName}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="val">Company value demonstrated</label>
              <select id="val" value={valueTag} onChange={(e) => setValueTag(e.target.value)}>
                {VALUES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="msg">What happened—and why does it matter?</label>
              <textarea
                id="msg"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Specific behavior, business impact, and how others can learn from it."
              />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <span id="rec-vis-label" className="form-label-block">
                Who can see this on the recognition feed?
              </span>
              <div className="epfms-radio-stack" role="radiogroup" aria-labelledby="rec-vis-label">
                <label className="epfms-radio-row">
                  <input
                    type="radio"
                    name="rec-vis"
                    checked={feedVisibility === "org_feed"}
                    onChange={() => setFeedVisibility("org_feed")}
                  />
                  <span>
                    <strong>Organization feed</strong> — anyone signed in can see the shout-out in the list below.
                  </span>
                </label>
                <label className="epfms-radio-row">
                  <input
                    type="radio"
                    name="rec-vis"
                    checked={feedVisibility === "sender_recipient_only"}
                    onChange={() => setFeedVisibility("sender_recipient_only")}
                  />
                  <span>
                    <strong>Sender &amp; recipient only</strong> — hidden from the public feed except for you, the tagged
                    colleague (if any), and HR / admin roles. In-app notification to the recipient still applies when you
                    name someone.
                  </span>
                </label>
              </div>
            </div>
          </div>
          {error ? (
            <p className="muted" style={{ color: "var(--color-danger, #c00)", marginTop: "0.75rem" }}>
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={submitting}>
            {submitting ? "Posting…" : "Post recognition"}
          </button>
        </form>
        <p className="muted" style={{ margin: "1rem 0 0", fontSize: "0.8rem" }}>
          Choose feed visibility above. When you name a colleague, they still get an in-app notification for direct
          shout-outs.
        </p>
      </div>

      <div className="stat-grid" style={{ marginTop: "-0.25rem" }}>
        <div className="stat-card">
          <div className="stat-card__value">{feed.length}</div>
          <div className="stat-card__label">Total recognition posts</div>
          <p className="stat-card__hint">Organization-wide acknowledgements in this feed.</p>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{personalizedCount}</div>
          <div className="stat-card__label">Direct recognitions</div>
          <p className="stat-card__hint">Posts that tagged a specific colleague.</p>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{Math.max(0, feed.length - personalizedCount)}</div>
          <div className="stat-card__label">Team / org-wide shout-outs</div>
          <p className="stat-card__hint">General acknowledgements without named recipient.</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Recognition feed</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={refreshFeed}>
            Refresh feed
          </button>
        </div>
        {feed.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No entries yet. Recognition works best when it is frequent, specific, and aligned to strategy.
          </p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {feed.map((row) => (
              <li key={row.id} className="epfms-timeline__item" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <div className="muted" style={{ fontSize: "0.8rem" }}>
                  {formatDateTime(row.at)} · <span className="badge badge--active">{row.valueTag}</span>
                  {row.visibility === "sender_recipient_only" ? (
                    <span className="badge badge--muted" style={{ marginLeft: 6 }}>
                      Private on feed
                    </span>
                  ) : null}
                </div>
                <p style={{ margin: "0.35rem 0" }}>{row.message}</p>
                <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                  {row.fromUserId ? `From ${nameFor(row.fromUserId)} · ` : ""}
                  {row.toUserId ? `→ ${nameFor(row.toUserId)}` : "→ Team / org-wide"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
