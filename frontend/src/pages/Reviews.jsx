import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Filter,
  Pencil,
  Sparkles,
  MessageSquareText,
  CalendarRange,
  FileCheck,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api } from "../api/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, formatDateTime } from "../utils/format.js";
import { canManageTeamReviews } from "../config/rbac.js";

function cycleLabel(cycles, id) {
  const c = cycles.find((x) => x.id === id);
  return c?.name || "Cycle";
}

function RatingBar({ value }) {
  const n = Number(value);
  if (value == null || Number.isNaN(n)) {
    return <span className="muted">Not rated</span>;
  }
  const pct = Math.min(100, Math.max(0, (n / 5) * 100));
  return (
    <div className="epfms-rating-bar-wrap" title={`${n.toFixed(1)} / 5`}>
      <div className="epfms-rating-bar" style={{ "--pct": `${pct}%` }} />
      <span className="epfms-rating-bar__num">{n.toFixed(1)}</span>
    </div>
  );
}

function canEditReview(user, review) {
  if (!user?.id || !review) return false;
  if (user.id === review.reviewer_id) return true;
  return ["ADMIN", "SUPER_ADMIN", "HR_ADMIN"].includes(user.role);
}

export default function Reviews() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterCycleId, setFilterCycleId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({
    rating: 4,
    summary: "",
    status: "SUBMITTED",
    visibility: "participants_only",
  });

  const [form, setForm] = useState({
    cycleId: "",
    employeeId: "",
    reviewerId: user?.id || "",
    summary: "",
    rating: 4,
    visibility: "participants_only",
  });

  const load = useCallback(async () => {
    setError("");
    try {
      const [cRes, rRes, dRes] = await Promise.all([
        api.get("/performance/cycles"),
        api.get("/performance/reviews"),
        api.get("/users/directory").catch(() => ({ data: [] })),
      ]);
      setCycles(Array.isArray(cRes.data) ? cRes.data : []);
      setReviews(Array.isArray(rRes.data) ? rRes.data : []);
      setDirectory(Array.isArray(dRes.data) ? dRes.data : []);
      setForm((f) => ({
        ...f,
        cycleId: f.cycleId || (cRes.data[0]?.id ?? ""),
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setForm((f) => ({ ...f, reviewerId: user?.id || "" }));
  }, [user]);

  const nameFor = useCallback(
    (id) => {
      if (!id) return "—";
      if (user?.id === id) return `${user.email?.split("@")[0] || "You"} (you)`;
      const row = directory.find((d) => d.userId === id);
      return row ? row.fullName : `${String(id).slice(0, 8)}…`;
    },
    [directory, user]
  );

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (filterCycleId !== "all" && r.cycle_id !== filterCycleId) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (q) {
        const blob = `${nameFor(r.employee_id)} ${nameFor(r.reviewer_id)} ${r.summary || ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [reviews, filterCycleId, filterStatus, search, nameFor]);

  const stats = useMemo(() => {
    const pool = filteredReviews;
    const submitted = pool.filter((r) => r.status === "SUBMITTED").length;
    const pending = pool.filter((r) => r.status === "PENDING").length;
    const rated = pool.filter((r) => r.rating != null && r.status === "SUBMITTED");
    const avg =
      rated.length > 0 ? rated.reduce((s, r) => s + Number(r.rating), 0) / rated.length : null;
    return { total: pool.length, submitted, pending, avg };
  }, [filteredReviews]);

  const canCreate = canManageTeamReviews(user?.role);

  const openEdit = (r) => {
    setEditRow(r);
    setEditForm({
      rating: r.rating != null ? Number(r.rating) : 4,
      summary: r.summary || "",
      status: r.status || "PENDING",
      visibility: r.visibility === "with_managers" ? "with_managers" : "participants_only",
    });
    setEditOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editRow) return;
    setSaving(true);
    setError("");
    try {
      await api.patch(`/performance/reviews/${editRow.id}`, {
        rating: Number(editForm.rating),
        summary: editForm.summary.trim(),
        status: editForm.status,
        visibility: editForm.visibility,
      });
      setEditOpen(false);
      setEditRow(null);
      await load();
      window.dispatchEvent(new CustomEvent("epfms-refresh-notifications"));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const postReview = async (status) => {
    if (!form.employeeId) {
      setError("Choose an employee first.");
      return;
    }
    if (status === "SUBMITTED" && !form.summary.trim()) {
      setError("Add a written summary before submitting a final review.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/performance/reviews", {
        cycle_id: form.cycleId,
        employee_id: form.employeeId,
        reviewer_id: form.reviewerId,
        status,
        rating: form.rating === "" ? null : Number(form.rating),
        summary: form.summary.trim() || null,
        visibility: form.visibility,
      });
      if (status === "SUBMITTED") {
        setForm((f) => ({ ...f, summary: "", employeeId: "" }));
      } else {
        setForm((f) => ({ ...f, summary: "" }));
      }
      await load();
      window.dispatchEvent(new CustomEvent("epfms-refresh-notifications"));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-loading">
          <span className="spinner" aria-hidden />
          Loading reviews…
        </div>
      </div>
    );
  }

  return (
    <div className="page page--reviews">
      <header className="page-header page-header__row epfms-reviews-hero">
        <div>
          <h1>
            <ClipboardList size={28} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 10 }} />
            Performance reviews
          </h1>
          <p className="epfms-reviews-hero__lead">
            Formal ratings and narrative for each cycle — separate from day-to-day{" "}
            <Link to="/feedback">feedback</Link> threads, but meant to be informed by them.
          </p>
          <div className="epfms-reviews-hero__links">
            <Link to="/feedback" className="epfms-pill-link">
              <MessageSquareText size={14} /> Feedback
            </Link>
            <Link to="/competencies" className="epfms-pill-link">
              <Sparkles size={14} /> Competencies
            </Link>
            <Link to="/self-assessment" className="epfms-pill-link">
              <FileCheck size={14} /> Self-assessment
            </Link>
          </div>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {!canCreate && (
        <div className="card epfms-callout">
          <strong>Your side of the story</strong>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>
            When your manager publishes a review for this cycle, it will show below. Until then, keep{" "}
            <Link to="/feedback">feedback</Link> and <Link to="/self-assessment">self-assessment</Link> current so the
            conversation is grounded in evidence.
          </p>
        </div>
      )}

      <div className="epfms-review-stats">
        <div className="epfms-review-stat">
          <div className="epfms-review-stat__value">{stats.total}</div>
          <div className="epfms-review-stat__label">In view</div>
          <p className="epfms-review-stat__hint">After filters &amp; search.</p>
        </div>
        <div className="epfms-review-stat">
          <div className="epfms-review-stat__value">{stats.submitted}</div>
          <div className="epfms-review-stat__label">Submitted</div>
          <p className="epfms-review-stat__hint">Finalized in the list.</p>
        </div>
        <div className="epfms-review-stat">
          <div className="epfms-review-stat__value">{stats.pending}</div>
          <div className="epfms-review-stat__label">Drafts</div>
          <p className="epfms-review-stat__hint">Still in progress.</p>
        </div>
        <div className="epfms-review-stat">
          <div className="epfms-review-stat__value">{stats.avg != null ? stats.avg.toFixed(1) : "—"}</div>
          <div className="epfms-review-stat__label">Avg rating</div>
          <p className="epfms-review-stat__hint">Submitted reviews only.</p>
        </div>
      </div>

      <section className="card epfms-reviews-cycles">
        <h2 className="epfms-reviews-section-title">
          <CalendarRange size={20} style={{ verticalAlign: "text-bottom", marginRight: 8 }} />
          Cycles
        </h2>
        {cycles.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No cycles yet — start the performance-review service with a fresh DB to pick up the seeded annual cycle.
          </p>
        ) : (
          <div className="epfms-cycle-cards">
            {cycles.map((c) => (
              <div
                key={c.id}
                className={`epfms-cycle-card${c.status === "ACTIVE" ? " epfms-cycle-card--active" : ""}`}
                role="group"
                aria-label={c.name}
              >
                <div className="epfms-cycle-card__head">
                  <strong>{c.name}</strong>
                  <span className={`badge ${c.status === "ACTIVE" ? "badge--active" : "badge--muted"}`}>{c.status}</span>
                </div>
                <div className="muted epfms-cycle-card__dates">
                  {formatDate(c.start_date)} — {formatDate(c.end_date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="epfms-reviews-toolbar">
          <h2 className="epfms-reviews-section-title" style={{ marginBottom: 0 }}>
            <Filter size={20} style={{ verticalAlign: "text-bottom", marginRight: 8 }} />
            Review records
          </h2>
          <div className="epfms-reviews-toolbar__controls">
            <input
              type="search"
              className="epfms-reviews-search"
              placeholder="Search by name or summary…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Filter reviews"
            />
            <select value={filterCycleId} onChange={(e) => setFilterCycleId(e.target.value)} aria-label="Cycle">
              <option value="all">All cycles</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Status">
              <option value="all">All statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="PENDING">Draft / pending</option>
            </select>
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="empty-state epfms-reviews-empty">
            <ClipboardList size={40} />
            <h3>No reviews match</h3>
            <p className="muted">
              {reviews.length === 0
                ? canCreate
                  ? "Create a draft or submitted review using the composer below."
                  : "Nothing on file for you yet in this workspace."
                : "Try clearing filters or search."}
            </p>
          </div>
        ) : (
          <ul className="epfms-review-card-list">
            {filteredReviews.map((r) => {
              const expanded = expandedId === r.id;
              const summary = r.summary || "";
              const clip = 220;
              const long = summary.length > clip;
              const showText = expanded || !long ? summary : `${summary.slice(0, clip)}…`;
              return (
                <li key={r.id} className="epfms-review-card">
                  <div className="epfms-review-card__top">
                    <div>
                      <div className="epfms-review-card__people">
                        <span className="epfms-review-card__label">Employee</span>
                        <strong>{nameFor(r.employee_id)}</strong>
                      </div>
                      <div className="epfms-review-card__people muted" style={{ marginTop: "0.35rem" }}>
                        <span className="epfms-review-card__label">Reviewer</span>
                        {nameFor(r.reviewer_id)}
                      </div>
                    </div>
                    <div className="epfms-review-card__meta">
                      <span className="badge badge--muted">{cycleLabel(cycles, r.cycle_id)}</span>
                      <span className={`badge ${r.status === "SUBMITTED" ? "badge--done" : "badge--warn"}`}>
                        {r.status === "PENDING" ? "Draft" : r.status}
                      </span>
                      {r.visibility === "with_managers" ? (
                        <span className="badge badge--warn">Mgr notified</span>
                      ) : (
                        <span className="badge badge--muted">Employee alerts only</span>
                      )}
                    </div>
                  </div>
                  <div className="epfms-review-card__rating-row">
                    <RatingBar value={r.rating} />
                  </div>
                  {summary ? (
                    <div className="epfms-review-card__summary">
                      <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{showText}</p>
                      {long && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm epfms-review-card__toggle"
                          onClick={() => setExpandedId(expanded ? null : r.id)}
                        >
                          {expanded ? (
                            <>
                              <ChevronUp size={14} /> Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown size={14} /> Read full summary
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="muted" style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
                      No summary text yet.
                    </p>
                  )}
                  <div className="epfms-review-card__foot muted">
                    Updated {formatDateTime(r.updated_at || r.created_at)}
                    {canEditReview(user, r) && (
                      <button type="button" className="btn btn-sm btn-secondary epfms-review-card__edit" onClick={() => openEdit(r)}>
                        <Pencil size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                        Edit
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {canCreate && (
        <section className="card epfms-reviews-composer">
          <h2 className="epfms-reviews-section-title">Write or update an appraisal</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Save a <strong>draft</strong> to park work in progress, or <strong>submit</strong> when the narrative and rating
            are ready (employee gets notified on submit). You can always edit later from the list.
          </p>
          <form
            className="epfms-reviews-form"
            onSubmit={(e) => {
              e.preventDefault();
              postReview("SUBMITTED");
            }}
          >
            <div className="form-grid form-grid--2">
              <div className="form-group">
                <label htmlFor="cycle">Cycle</label>
                <select id="cycle" value={form.cycleId} onChange={(e) => setForm({ ...form, cycleId: e.target.value })}>
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="emp">Employee</label>
                <select
                  id="emp"
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  required
                >
                  <option value="">Select employee…</option>
                  {directory.map((d) => (
                    <option key={d.userId} value={d.userId}>
                      {d.fullName}
                      {d.jobTitle ? ` — ${d.jobTitle}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="rev">Reviewer</label>
                <select id="rev" value={form.reviewerId} onChange={(e) => setForm({ ...form, reviewerId: e.target.value })} required>
                  <option value={user?.id}>You ({user?.email})</option>
                  {directory.map((d) => (
                    <option key={d.userId} value={d.userId}>
                      {d.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="rating">Rating (1–5)</label>
                <input
                  id="rating"
                  type="range"
                  min={1}
                  max={5}
                  step={0.1}
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                />
                <div className="epfms-range-readout">{Number(form.rating).toFixed(1)} / 5</div>
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="summary">Summary &amp; evidence</label>
                <textarea
                  id="summary"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  rows={5}
                  placeholder="Strengths, misses, expectations for next period — tie to outcomes or behaviors you actually observed."
                />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <span id="rev-vis-label" className="form-label-block">
                  Notification audience
                </span>
                <div className="epfms-radio-stack" role="radiogroup" aria-labelledby="rev-vis-label">
                  <label className="epfms-radio-row">
                    <input
                      type="radio"
                      name="rev-vis"
                      checked={form.visibility === "participants_only"}
                      onChange={() => setForm({ ...form, visibility: "participants_only" })}
                    />
                    <span>
                      <strong>Employee only</strong> — in-app alert for the employee; no extra ping to their people
                      manager.
                    </span>
                  </label>
                  <label className="epfms-radio-row">
                    <input
                      type="radio"
                      name="rev-vis"
                      checked={form.visibility === "with_managers"}
                      onChange={() => setForm({ ...form, visibility: "with_managers" })}
                    />
                    <span>
                      <strong>Employee + people manager</strong> — also notify their manager (from profile) on submit and
                      on edits, unless they are the reviewer.
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="epfms-reviews-form__actions">
              <button type="button" className="btn-secondary" disabled={saving} onClick={() => postReview("PENDING")}>
                Save draft
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Working…" : "Submit final review"}
              </button>
            </div>
          </form>
        </section>
      )}

      {editOpen && editRow && (
        <div className="epfms-modal-backdrop" role="presentation" onClick={() => !saving && setEditOpen(false)}>
          <div
            className="epfms-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-review-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="epfms-modal__head">
              <h2 id="edit-review-title">Edit review</h2>
              <button type="button" className="btn btn-ghost btn-sm" disabled={saving} onClick={() => setEditOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <p className="muted" style={{ marginTop: 0 }}>
              {nameFor(editRow.employee_id)} · {cycleLabel(cycles, editRow.cycle_id)}
            </p>
            <form onSubmit={saveEdit} className="epfms-modal__body">
              <div className="form-group">
                <label htmlFor="edit-rating">Rating (1–5)</label>
                <input
                  id="edit-rating"
                  type="range"
                  min={1}
                  max={5}
                  step={0.1}
                  value={editForm.rating}
                  onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                />
                <div className="epfms-range-readout">{Number(editForm.rating).toFixed(1)} / 5</div>
              </div>
              <div className="form-group">
                <label htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="PENDING">Draft / pending</option>
                  <option value="SUBMITTED">Submitted</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="edit-summary">Summary</label>
                <textarea
                  id="edit-summary"
                  rows={5}
                  value={editForm.summary}
                  onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <span className="form-label-block">Notifications</span>
                <div className="epfms-radio-stack">
                  <label className="epfms-radio-row">
                    <input
                      type="radio"
                      name="edit-vis"
                      checked={editForm.visibility === "participants_only"}
                      onChange={() => setEditForm({ ...editForm, visibility: "participants_only" })}
                    />
                    <span>Employee only</span>
                  </label>
                  <label className="epfms-radio-row">
                    <input
                      type="radio"
                      name="edit-vis"
                      checked={editForm.visibility === "with_managers"}
                      onChange={() => setEditForm({ ...editForm, visibility: "with_managers" })}
                    />
                    <span>Employee + people manager</span>
                  </label>
                </div>
              </div>
              <div className="epfms-modal__actions">
                <button type="button" className="btn-secondary" disabled={saving} onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
