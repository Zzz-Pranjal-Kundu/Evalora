import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ClipboardList,
  MessageSquareText,
  Bell,
  CalendarRange,
  Users,
  Building2,
  LineChart,
  ClipboardSignature,
  Sprout,
  Sparkles,
  BookOpen,
  Network,
  Flag,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/index.js";
import { formatDate, formatDateTime } from "../utils/format.js";
import {
  canSeeManagerDashboard,
  canSeeHrDashboard,
  canSeeLeadership,
  canSeeAnalytics,
  canAccessPath,
  canListAllProfiles,
} from "../config/rbac.js";
import { EPFMS_TAGLINE } from "../constants/epfms.js";

async function safeCount(getter) {
  try {
    const { data } = await getter();
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return null;
  }
}

async function safeJson(getter) {
  try {
    const { data } = await getter();
    return data;
  } catch {
    return null;
  }
}

function relTime(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const hours = (Date.now() - t) / 3600000;
  if (hours < 1) return `${Math.max(1, Math.floor(hours * 60))}m ago`;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 7) return `${Math.floor(days)}d ago`;
  return formatDateTime(iso);
}

function deptColor(name) {
  let h = 0;
  const s = String(name || "");
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h} 58% 46%)`;
}

function buildOrgSnapshot(people, currentUserId) {
  const list = Array.isArray(people) ? people : [];
  const byDept = {};
  const byTeam = {};
  for (const p of list) {
    const d = p.department || "—";
    const t = p.team || "—";
    byDept[d] = (byDept[d] || 0) + 1;
    byTeam[t] = (byTeam[t] || 0) + 1;
  }
  const deptRows = Object.entries(byDept).sort((a, b) => b[1] - a[1]);
  const teamRows = Object.entries(byTeam).sort((a, b) => b[1] - a[1]);
  const directReports = currentUserId
    ? list.filter((p) => p.managerId === currentUserId)
    : [];
  return { headcount: list.length, deptRows, teamRows, directReports };
}

function roleHomeSubtitle(role) {
  switch (role) {
    case "MANAGER":
      return "Balance your own performance cycle with clear actions for your team.";
    case "HR_ADMIN":
      return "Keep cycles, fairness, and employee experience aligned across the organization.";
    case "LEADERSHIP":
      return "Monitor organizational health without losing sight of individual growth.";
    case "SUPER_ADMIN":
    case "ADMIN":
      return "Operate the performance and feedback platform with full administrative context.";
    default:
      return "See feedback and formal reviews for the active cycle in one place.";
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();

  /**
   * RoleRoute now passes only { accessDenied: true } — no deniedPath — so we
   * show a generic message that does not leak restricted route names.
   */
  const [accessNotice, setAccessNotice] = useState(
    () => !!location.state?.accessDenied
  );

  const [cycles, setCycles] = useState([]);
  const [stats, setStats] = useState({
    feedback: null,
    reviews: null,
    notifications: null,
    recognitions: null,
  });
  const [managerDash, setManagerDash] = useState(null);
  const [hrDash, setHrDash] = useState(null);
  const [leadershipDash, setLeadershipDash] = useState(null);
  const [orgRoster, setOrgRoster] = useState([]);
  const [feedbackActivity, setFeedbackActivity] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role;

  const orgSnapshot = useMemo(
    () => buildOrgSnapshot(orgRoster, user?.id),
    [orgRoster, user?.id]
  );

  const nameById = useMemo(() => {
    const m = {};
    for (const p of orgRoster) {
      if (p?.userId) m[p.userId] = p.fullName || p.userId;
    }
    if (user?.id) {
      m[user.id] = m[user.id] || user?.email?.split("@")[0] || "You";
    }
    return m;
  }, [orgRoster, user]);

  const displayName = useMemo(() => {
    const me = orgRoster.find((p) => p.userId === user?.id);
    if (me?.fullName) return me.fullName;
    const local = user?.email?.split("@")[0];
    return local
      ? local.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "there";
  }, [orgRoster, user]);

  const activityItems = useMemo(() => {
    const items = [];
    for (const n of recentNotifications.slice(0, 6)) {
      const t = n.createdAt || n.created_at;
      items.push({
        key: `n-${n.id}`,
        icon: "bell",
        title: n.title || "Notification",
        sub: n.body || "",
        time: relTime(t),
        link: "/notifications",
      });
    }
    const fb = feedbackActivity[0];
    if (fb) {
      const fromN = nameById[fb.from_user_id] || "Colleague";
      items.splice(1, 0, {
        key: `fb-${fb.id}`,
        icon: "msg",
        title: "New feedback received",
        sub: `From ${fromN}${
          fb.topic
            ? ` · ${fb.topic.slice(0, 72)}${fb.topic.length > 72 ? "…" : ""}`
            : ""
        }`,
        time: relTime(fb.created_at),
        link: "/feedback",
      });
    }
    return items.slice(0, 8);
  }, [recentNotifications, feedbackActivity, nameById]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cycleData, feedback, reviews, notifications, recognitions] =
        await Promise.all([
          safeJson(() => api.get("/performance/cycles")),
          safeCount(() => api.get("/feedback/requests")),
          safeCount(() => api.get("/performance/reviews")),
          safeCount(() => api.get("/notifications")),
          safeCount(() => api.get("/users/recognitions/feed")),
        ]);

      let mDash = null;
      let hDash = null;
      let lDash = null;
      if (canSeeManagerDashboard(role)) {
        mDash = await safeJson(() => api.get("/dashboards/manager"));
      }
      if (canSeeHrDashboard(role)) {
        hDash = await safeJson(() => api.get("/dashboards/hr"));
      }
      if (canSeeLeadership(role)) {
        lDash = await safeJson(() => api.get("/dashboards/leadership"));
      }

      let roster = [];
      try {
        if (canListAllProfiles(role)) {
          const full = await safeJson(() => api.get("/users/profiles"));
          roster = Array.isArray(full) ? full : [];
        } else {
          const me = await safeJson(() => api.get("/users/profiles/me"));
          const dir = await safeJson(() => api.get("/users/directory"));
          const d = Array.isArray(dir) ? dir : [];
          roster = me
            ? [me, ...d.filter((row) => row.userId !== me.userId)]
            : d;
        }
      } catch {
        roster = [];
      }

      let fbRows = [];
      try {
        const rawFb = await safeJson(() => api.get("/feedback/requests"));
        fbRows = Array.isArray(rawFb) ? rawFb.slice(0, 12) : [];
      } catch {
        fbRows = [];
      }

      let notifRows = [];
      try {
        const rawN = await safeJson(() => api.get("/notifications"));
        notifRows = Array.isArray(rawN) ? rawN.slice(0, 12) : [];
      } catch {
        notifRows = [];
      }

      if (!cancelled) {
        setCycles(Array.isArray(cycleData) ? cycleData : []);
        setStats({ feedback, reviews, notifications, recognitions });
        setManagerDash(mDash);
        setHrDash(hDash);
        setLeadershipDash(lDash);
        setOrgRoster(roster);
        setFeedbackActivity(fbRows);
        setRecentNotifications(notifRows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, user?.id]);

  const fmt = (n) => (n === null ? "—" : String(n));
  const activeCycle = cycles.find((c) => c.status === "ACTIVE") || cycles[0];

  return (
    <div className="page page--home">
      {accessNotice && (
        <div
          className="alert alert-error"
          style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}
        >
          {/* Generic message — does not mention which route was denied */}
          <span>
            That page is not available for your role. Use the menu to navigate
            to pages your organisation has assigned to you.
          </span>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setAccessNotice(false)}
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="page-loading">
          <span className="spinner" aria-hidden />
          Loading your performance snapshot…
        </div>
      ) : (
        <>
          <div className="dash-hero-grid">
            <div className="dash-welcome">
              <div className="dash-welcome__body">
                <h1 className="dash-welcome__title">
                  Welcome back, {displayName} 👋
                </h1>
                <p className="dash-welcome__lead">{EPFMS_TAGLINE}</p>
                <p
                  className="muted"
                  style={{ margin: "0 0 1rem", fontSize: "0.88rem" }}
                >
                  {roleHomeSubtitle(role)}
                </p>
                <div className="dash-welcome__chips">
                  <span className="dash-welcome__chip dash-welcome__chip--cycle">
                    <span
                      className="topbar__chip-dot topbar__chip-dot--live"
                      style={{ marginRight: 4 }}
                    />
                    Cycle: {activeCycle ? "Active" : "Awaiting"}
                  </span>
                  <span className="dash-welcome__chip dash-welcome__chip--role">
                    Role: {role || "Employee"}
                  </span>
                  <span className="dash-welcome__chip dash-welcome__chip--ws">
                    Workspace: EPFMS Core
                  </span>
                </div>
              </div>
              <div className="dash-welcome__art" aria-hidden>
                <svg viewBox="0 0 120 100" width="120" height="100">
                  <defs>
                    <linearGradient
                      id="m1"
                      x1="0%"
                      y1="100%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop
                        offset="0%"
                        stopColor="#1677ff"
                        stopOpacity="0.35"
                      />
                      <stop
                        offset="100%"
                        stopColor="#36cfc9"
                        stopOpacity="0.5"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M10 85 L35 45 L55 60 L80 25 L110 85 Z"
                    fill="url(#m1)"
                    stroke="#1677ff"
                    strokeWidth="1.5"
                    opacity="0.9"
                  />
                  <rect
                    x="52"
                    y="18"
                    width="4"
                    height="22"
                    fill="#d46b08"
                    rx="1"
                  />
                  <path d="M54 18 L68 28 L54 32 Z" fill="#fa8c16" />
                </svg>
              </div>
            </div>
            <div className="dash-glance">
              <h2 className="dash-glance__title">At a glance</h2>
              <div className="dash-glance__grid">
                <Link to="/feedback" className="dash-glance__tile">
                  <div className="dash-glance__icon dash-glance__icon--feedback">
                    <MessageSquareText size={18} />
                  </div>
                  <div className="dash-glance__value">
                    {fmt(stats.feedback)}
                  </div>
                  <div className="dash-glance__label">Feedback</div>
                  <div className="dash-glance__sub">
                    Requests in your workspace
                  </div>
                </Link>
                <Link to="/reviews" className="dash-glance__tile">
                  <div className="dash-glance__icon dash-glance__icon--reviews">
                    <ClipboardList size={18} />
                  </div>
                  <div className="dash-glance__value">
                    {fmt(stats.reviews)}
                  </div>
                  <div className="dash-glance__label">Reviews</div>
                  <div className="dash-glance__sub">In progress / on file</div>
                </Link>
                <Link to="/notifications" className="dash-glance__tile">
                  <div className="dash-glance__icon dash-glance__icon--notifications">
                    <Bell size={18} />
                  </div>
                  <div className="dash-glance__value">
                    {fmt(stats.notifications)}
                  </div>
                  <div className="dash-glance__label">Notifications</div>
                  <div className="dash-glance__sub">
                    Unread-friendly snapshot
                  </div>
                </Link>
                <Link to="/recognition" className="dash-glance__tile">
                  <div className="dash-glance__icon dash-glance__icon--recognition">
                    <Sparkles size={18} />
                  </div>
                  <div className="dash-glance__value">
                    {fmt(stats.recognitions)}
                  </div>
                  <div className="dash-glance__label">Recognition</div>
                  <div className="dash-glance__sub">Posts in org feed</div>
                </Link>
              </div>
              <div className="dash-glance__footer">
                <Link to="/feedback">Open feedback &amp; reviews →</Link>
              </div>
            </div>
          </div>

          <div
            className="epfms-pillar-grid card"
            style={{ marginBottom: "1.5rem" }}
          >
            <h2 className="epfms-pillar-grid__title">
              What this platform covers
            </h2>
            <p className="muted epfms-pillar-grid__lead">
              Employees see feedback and self-assessments; managers monitor
              progress and run appraisals; HR uses analytics for adoption and
              talent decisions.
            </p>
            <div className="epfms-pillar-grid__cells">
              <Link to="/feedback" className="epfms-pillar">
                <MessageSquareText size={22} />
                <span>360° feedback</span>
              </Link>
              <Link to="/self-assessment" className="epfms-pillar">
                <ClipboardSignature size={22} />
                <span>Self-evaluation</span>
              </Link>
              <Link to="/development" className="epfms-pillar">
                <Sprout size={22} />
                <span>Development</span>
              </Link>
              <Link to="/recognition" className="epfms-pillar">
                <Sparkles size={22} />
                <span>Recognition</span>
              </Link>
              <Link to="/reviews" className="epfms-pillar">
                <ClipboardList size={22} />
                <span>Appraisals</span>
              </Link>
              <Link to="/competencies" className="epfms-pillar">
                <BookOpen size={22} />
                <span>Competencies</span>
              </Link>
              <Link to="/org" className="epfms-pillar">
                <Network size={22} />
                <span>Org &amp; charts</span>
              </Link>
            </div>
          </div>

          <div
            className={`dash-org-activity-row${
              orgSnapshot.headcount > 0 ? " dash-org-activity-row--with-org" : ""
            }`}
          >
            {orgSnapshot.headcount > 0 && (
              <div className="card" style={{ marginBottom: 0 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <h2
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      margin: 0,
                    }}
                  >
                    <Users size={22} />
                    Organization snapshot
                  </h2>
                  <Link to="/org" className="btn btn-ghost btn-sm">
                    Open org directory &amp; charts
                  </Link>
                </div>
                <p className="muted" style={{ marginTop: 0 }}>
                  Departments and squads in view:{" "}
                  <strong>{orgSnapshot.headcount}</strong> people
                  {orgSnapshot.directReports.length > 0 ? (
                    <>
                      {" "}
                      · Your direct reports:{" "}
                      <strong>{orgSnapshot.directReports.length}</strong>
                    </>
                  ) : null}
                  .
                </p>
                <div className="org-snapshot-grid">
                  <div>
                    <h3 className="org-snapshot__subtitle">By department</h3>
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Department</th>
                            <th>Headcount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orgSnapshot.deptRows.map(([name, count]) => (
                            <tr key={name}>
                              <td>
                                <span
                                  className="dept-dot"
                                  style={{ background: deptColor(name) }}
                                />
                                {name}
                              </td>
                              <td>{count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h3 className="org-snapshot__subtitle">By team / squad</h3>
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Team</th>
                            <th>Headcount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orgSnapshot.teamRows.map(([name, count]) => (
                            <tr key={name}>
                              <td>
                                <span
                                  className="dept-dot"
                                  style={{ background: deptColor(name) }}
                                />
                                {name}
                              </td>
                              <td>{count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {orgSnapshot.directReports.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <h3 className="org-snapshot__subtitle">Your team</h3>
                    <ul
                      className="muted"
                      style={{
                        margin: 0,
                        paddingLeft: "1.1rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      {orgSnapshot.directReports.map((p) => (
                        <li key={p.userId}>
                          <strong>{p.fullName}</strong>
                          {p.jobTitle ? ` — ${p.jobTitle}` : ""}
                          {p.team ? ` · ${p.team}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className="card dash-activity" style={{ marginBottom: 0 }}>
              <h2
                style={{
                  margin: "0 0 0.75rem",
                  fontSize: "1.05rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Flag size={20} />
                Recent activity
              </h2>
              {activityItems.length === 0 ? (
                <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                  Notifications and feedback updates will appear here as your
                  cycle progresses.
                </p>
              ) : (
                <ul className="dash-activity__list">
                  {activityItems.map((item) => (
                    <li key={item.key} className="dash-activity__item">
                      <div className="dash-activity__icon">
                        {item.icon === "msg" ? (
                          <MessageSquareText size={16} />
                        ) : (
                          <Bell size={16} />
                        )}
                      </div>
                      <div className="dash-activity__meta">
                        <Link
                          to={item.link}
                          style={{
                            fontWeight: 600,
                            color: "var(--color-text)",
                          }}
                        >
                          {item.title}
                        </Link>
                        {item.sub ? (
                          <div
                            className="muted"
                            style={{
                              fontSize: "0.82rem",
                              marginTop: "0.15rem",
                              lineHeight: 1.4,
                            }}
                          >
                            {item.sub}
                          </div>
                        ) : null}
                        <div className="dash-activity__time">{item.time}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p style={{ margin: "0.85rem 0 0", fontSize: "0.82rem" }}>
                <Link to="/notifications">View all activity →</Link>
              </p>
            </div>
          </div>

          {activeCycle && (
            <div className="dashboard-hero card">
              <div className="dashboard-hero__top">
                <div>
                  <p className="dashboard-hero__eyebrow">
                    <CalendarRange
                      size={16}
                      aria-hidden
                      style={{
                        verticalAlign: "text-bottom",
                        marginRight: 6,
                      }}
                    />
                    Active review cycle
                  </p>
                  <h2 className="dashboard-hero__title">{activeCycle.name}</h2>
                  <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                    {formatDate(activeCycle.start_date)} —{" "}
                    {formatDate(activeCycle.end_date)}
                    <span
                      className={`badge ${
                        activeCycle.status === "ACTIVE"
                          ? "badge--active"
                          : "badge--muted"
                      }`}
                      style={{ marginLeft: "0.5rem" }}
                    >
                      {activeCycle.status}
                    </span>
                  </p>
                </div>
                <div className="dashboard-hero__actions">
                  <Link to="/reviews" className="btn btn-ghost btn-sm">
                    Open reviews
                  </Link>
                  <Link to="/feedback" className="btn btn-sm">
                    Open feedback
                  </Link>
                </div>
              </div>
              <p className="muted" style={{ margin: "0.85rem 0 0", fontSize: "0.9rem" }}>
                Formal ratings, narrative summaries, and calibration packets
                for this cycle are coordinated from <strong>Reviews</strong>{" "}
                and <strong>Feedback</strong>. Development plans support the
                same story through the year.
              </p>
            </div>
          )}

          {!activeCycle && (
            <div
              className="card"
              style={{ marginBottom: "1.25rem", borderStyle: "dashed" }}
            >
              <h2
                className="dashboard-hero__title"
                style={{ fontSize: "1.05rem" }}
              >
                No review cycle on file yet
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                When HR publishes a cycle, dates and status will appear here.
                You can still capture informal feedback anytime.
              </p>
            </div>
          )}

          {managerDash && (
            <div className="card dashboard-role-card">
              <h2>
                <Users
                  size={20}
                  style={{
                    display: "inline",
                    verticalAlign: "text-bottom",
                    marginRight: 8,
                  }}
                />
                People leadership
              </h2>
              <p className="muted">{managerDash.message}</p>
              <ul className="dashboard-kpi-list">
                <li>
                  <strong>{managerDash.pendingReviews ?? "—"}</strong> pending
                  team reviews (placeholder)
                </li>
              </ul>
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <Link to="/reviews" className="btn btn-sm">
                  Team appraisals
                </Link>
                <Link to="/feedback" className="btn btn-ghost btn-sm">
                  Team 360
                </Link>
                {canAccessPath(role, "/org") && (
                  <Link to="/org" className="btn btn-ghost btn-sm">
                    Organization
                  </Link>
                )}
              </div>
            </div>
          )}

          {hrDash && (
            <div className="card dashboard-role-card">
              <h2>
                <Building2
                  size={20}
                  style={{
                    display: "inline",
                    verticalAlign: "text-bottom",
                    marginRight: 8,
                  }}
                />
                HR programs
              </h2>
              <p className="muted">{hrDash.message}</p>
              <ul className="dashboard-kpi-list">
                <li>
                  <strong>{hrDash.activeCycles ?? "—"}</strong> active cycles
                  (placeholder)
                </li>
                <li>
                  <strong>{hrDash.calibrationSessions ?? "—"}</strong>{" "}
                  calibration sessions (placeholder)
                </li>
              </ul>
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                {canAccessPath(role, "/hr") && (
                  <Link to="/hr" className="btn btn-sm">
                    HR hub
                  </Link>
                )}
                {canAccessPath(role, "/calibration") && (
                  <Link to="/calibration" className="btn btn-ghost btn-sm">
                    Calibration
                  </Link>
                )}
              </div>
            </div>
          )}

          {leadershipDash && (
            <div className="card dashboard-role-card">
              <h2>
                <LineChart
                  size={20}
                  style={{
                    display: "inline",
                    verticalAlign: "text-bottom",
                    marginRight: 8,
                  }}
                />
                Leadership view
              </h2>
              <p className="muted">{leadershipDash.message}</p>
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                {canAccessPath(role, "/leadership") && (
                  <Link to="/leadership" className="btn btn-sm">
                    Leadership insights
                  </Link>
                )}
                {canSeeAnalytics(role) && (
                  <Link to="/analytics" className="btn btn-ghost btn-sm">
                    Analytics workspace
                  </Link>
                )}
              </div>
            </div>
          )}

          {role === "EMPLOYEE" && (
            <div
              className="card"
              style={{ borderLeft: "4px solid var(--color-accent)" }}
            >
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <ShieldAlert size={20} />
                Access tips
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                Organisation charts, calibration sessions, HR configuration,
                and org-wide analytics are reserved for managers and HR. If you
                need access, ask your HR business partner to update your role in
                the directory.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
