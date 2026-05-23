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
  CheckSquare,
  Plus,
  Settings,
  Activity,
  Award,
  UserCheck,
  Compass,
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
  const directReports = currentUserId ? list.filter((p) => p.managerId === currentUserId) : [];
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
    return local ? local.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "there";
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
        sub: `From ${fromN}${fb.topic ? ` · ${fb.topic.slice(0, 72)}${fb.topic.length > 72 ? "…" : ""}` : ""}`,
        time: relTime(fb.created_at),
        link: "/feedback",
      });
    }
    return items.slice(0, 8);
  }, [recentNotifications, feedbackActivity, nameById]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cycleData, feedback, reviews, notifications, recognitions] = await Promise.all([
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
          roster = me ? [me, ...d.filter((row) => row.userId !== me.userId)] : d;
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

  function renderHrDashboard() {
    return (
      <>
        {/* Welcome Section */}
        <div className="dash-hero-grid">
          <div className="dash-welcome" style={{ background: "linear-gradient(135deg, #5c836c 0%, #3d6d50 100%)", color: "#fff", borderRadius: "var(--radius)", padding: "2rem", display: "flex", justifyContent: "space-between", gap: "1.5rem" }}>
            <div className="dash-welcome__body">
              <h1 className="dash-welcome__title" style={{ color: "#fff", fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: "0.5rem" }}>Welcome back, {displayName}.</h1>
              <p className="dash-welcome__lead" style={{ opacity: 0.95, fontSize: "1.05rem", lineHeight: 1.5, margin: "0 0 1.2rem" }}>
                The talent ecosystem is thriving today. You have new reviews to calibrate and fresh sentiment reports waiting for your analysis.
              </p>
              <Link to="/hr" className="btn btn-secondary" style={{ background: "#2D3E33", color: "#fff", border: "none", borderRadius: "999px", padding: "0.6rem 1.4rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                View Daily Summary →
              </Link>
            </div>
            <div className="dash-welcome__art" style={{ background: "rgba(255,255,255,0.08)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", width: "160px", flexShrink: 0, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={48} style={{ color: "#fff", opacity: 0.95 }} />
              <div style={{ fontSize: "0.75rem", color: "#fff", fontWeight: "bold", marginTop: "0.5rem", letterSpacing: "0.05em" }}>HR HUB LIVE</div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="dash-glance">
            <h2 className="dash-glance__title">Program Metrics</h2>
            <div className="dash-glance__grid">
              <Link to="/hr" className="dash-glance__tile">
                <div className="dash-glance__icon dash-glance__icon--reviews" style={{ background: "var(--color-primary-light)" }}>
                  <CalendarRange size={18} />
                </div>
                <div className="dash-glance__value">{fmt(hrDash?.activeCycles ?? cycles.length)}</div>
                <div className="dash-glance__label">Active Cycles</div>
                <div className="dash-glance__sub">Corporate evaluation cycles</div>
              </Link>
              <Link to="/calibration" className="dash-glance__tile">
                <div className="dash-glance__icon dash-glance__icon--feedback" style={{ background: "var(--color-success-light)" }}>
                  <ClipboardList size={18} />
                </div>
                <div className="dash-glance__value">{fmt(hrDash?.calibrationSessions ?? 1)}</div>
                <div className="dash-glance__label">Calibrations</div>
                <div className="dash-glance__sub">Active calibration sessions</div>
              </Link>
              <Link to="/org" className="dash-glance__tile">
                <div className="dash-glance__icon dash-glance__icon--recognition" style={{ background: "var(--color-accent-light)" }}>
                  <Users size={18} />
                </div>
                <div className="dash-glance__value">{orgSnapshot.headcount}</div>
                <div className="dash-glance__label">Total Staff</div>
                <div className="dash-glance__sub">Active profiles tracked</div>
              </Link>
              <Link to="/analytics" className="dash-glance__tile">
                <div className="dash-glance__icon dash-glance__icon--notifications" style={{ background: "var(--color-warning-light)" }}>
                  <LineChart size={18} />
                </div>
                <div className="dash-glance__value">Live</div>
                <div className="dash-glance__label">Analytics</div>
                <div className="dash-glance__sub">Org metrics & graphs</div>
              </Link>
            </div>
          </div>
        </div>

        {/* HR Operations Controls Checklist */}
        <div className="card" style={{ marginBottom: "1.5rem", borderLeft: "4px solid var(--color-primary, #1677ff)" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem" }}>
            <Settings size={20} />
            HR Program Operations
          </h2>
          <p className="muted" style={{ margin: "0 0 1rem" }}>
            Direct administrative shortcuts to orchestrate evaluation packets, manage competency catalogs, and configure department settings.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {canAccessPath(role, "/hr") && (
              <Link to="/hr" className="btn btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <Building2 size={16} /> Open HR Program Hub
              </Link>
            )}
            {canAccessPath(role, "/calibration") && (
              <Link to="/calibration" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <ClipboardList size={16} /> Calibration Sessions
              </Link>
            )}
            {canSeeAnalytics(role) && (
              <Link to="/analytics" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <LineChart size={16} /> View Global Analytics
              </Link>
            )}
          </div>
        </div>

        {/* Organization Headcount Distributions */}
        <div className="dash-org-activity-row dash-org-activity-row--with-org">
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                <Users size={22} />
                Organization Roster Snapshot
              </h2>
              <Link to="/org" className="btn btn-ghost btn-sm">
                Open Directory &amp; Charts
              </Link>
            </div>
            <p className="muted" style={{ marginTop: 4 }}>
              Active departments and reporting squads across the entire company: <strong>{orgSnapshot.headcount}</strong> employees.
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
                            <span className="dept-dot" style={{ background: deptColor(name) }} />
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
                            <span className="dept-dot" style={{ background: deptColor(name) }} />
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
          </div>

          {/* Activity Logs */}
          <div className="card dash-activity" style={{ marginBottom: 0 }}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Flag size={20} />
              Recent Activity logs
            </h2>
            {activityItems.length === 0 ? (
              <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                Notifications and feedback updates will appear here as your cycle progresses.
              </p>
            ) : (
              <ul className="dash-activity__list">
                {activityItems.map((item) => (
                  <li key={item.key} className="dash-activity__item">
                    <div className="dash-activity__icon">
                      {item.icon === "msg" ? <MessageSquareText size={16} /> : <Bell size={16} />}
                    </div>
                    <div className="dash-activity__meta">
                      <Link to={item.link} style={{ fontWeight: 600, color: "var(--color-text)" }}>
                        {item.title}
                      </Link>
                      {item.sub ? (
                        <div className="muted" style={{ fontSize: "0.82rem", marginTop: "0.15rem", lineHeight: 1.4 }}>
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
      </>
    );
  }

  function renderManagerDashboard() {
    return (
      <>
        {/* Welcome Section */}
        <div className="dash-hero-grid">
          <div className="dash-welcome" style={{ background: "linear-gradient(135deg, #5c836c 0%, #3d6d50 100%)", color: "#fff", borderRadius: "var(--radius)", padding: "2rem", display: "flex", justifyContent: "space-between", gap: "1.5rem" }}>
            <div className="dash-welcome__body">
              <h1 className="dash-welcome__title" style={{ color: "#fff", fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: "0.5rem" }}>Welcome back, {displayName}.</h1>
              <p className="dash-welcome__lead" style={{ opacity: 0.95, fontSize: "1.05rem", lineHeight: 1.5, margin: "0 0 1.2rem" }}>
                The talent ecosystem is thriving today. You have new reviews to calibrate and fresh sentiment reports waiting for your analysis.
              </p>
              <Link to="/reviews" className="btn btn-secondary" style={{ background: "#2D3E33", color: "#fff", border: "none", borderRadius: "999px", padding: "0.6rem 1.4rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                View Daily Summary →
              </Link>
            </div>
            <div className="dash-welcome__art" style={{ background: "rgba(255,255,255,0.08)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", width: "160px", flexShrink: 0, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Users size={48} style={{ color: "#fff", opacity: 0.95 }} />
              <div style={{ fontSize: "0.75rem", color: "#fff", fontWeight: "bold", marginTop: "0.5rem", letterSpacing: "0.05em" }}>TEAM LEAD LIVE</div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="dash-glance">
            <h2 className="dash-glance__title">Team Snapshot</h2>
            <div className="dash-glance__grid">
              <Link to="/reviews" className="dash-glance__tile">
                <div className="dash-glance__icon dash-glance__icon--reviews" style={{ background: "var(--color-primary-light)" }}>
                  <ClipboardList size={18} />
                </div>
                <div className="dash-glance__value">{fmt(managerDash?.pendingReviews ?? stats.reviews)}</div>
                <div className="dash-glance__label">Pending Team Reviews</div>
                <div className="dash-glance__sub">Awaiting your appraisal</div>
              </Link>
              <Link to="/feedback" className="dash-glance__tile">
                <div className="dash-glance__icon dash-glance__icon--feedback" style={{ background: "var(--color-success-light)" }}>
                  <MessageSquareText size={18} />
                </div>
                <div className="dash-glance__value">{fmt(stats.feedback)}</div>
                <div className="dash-glance__label">Team 360 Feedback</div>
                <div className="dash-glance__sub">Colleague request volume</div>
              </Link>
              <Link to="/org" className="dash-glance__tile">
                <div className="dash-glance__icon dash-glance__icon--recognition" style={{ background: "var(--color-accent-light)" }}>
                  <Users size={18} />
                </div>
                <div className="dash-glance__value">{orgSnapshot.directReports.length}</div>
                <div className="dash-glance__label">Direct Reports</div>
                <div className="dash-glance__sub">People reporting directly to you</div>
              </Link>
              <Link to="/recognition" className="dash-glance__tile">
                <div className="dash-glance__icon dash-glance__icon--notifications" style={{ background: "var(--color-warning-light)" }}>
                  <Sparkles size={18} />
                </div>
                <div className="dash-glance__value">{fmt(stats.recognitions)}</div>
                <div className="dash-glance__label">Recognitions</div>
                <div className="dash-glance__sub">Posts in org feed</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Manager Directory & Checklist */}
        <div className="card" style={{ marginBottom: "1.5rem", borderLeft: "4px solid #17b978" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem" }}>
            <UserCheck size={20} />
            My Team Appraisals & Checklist
          </h2>
          <p className="muted" style={{ margin: "0 0 1rem" }}>
            Approve team self-evaluations, request peer reviews, and submit final appraisals for each of your direct reports below:
          </p>
          {orgSnapshot.directReports.length === 0 ? (
            <p className="muted" style={{ fontSize: "0.9rem", fontStyle: "italic", margin: 0 }}>
              You currently have no direct reports registered in the company directory. Contact HR if this is incorrect.
            </p>
          ) : (
            <div className="table-wrap" style={{ marginTop: "1rem" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Direct Report</th>
                    <th>Job Title</th>
                    <th>Department</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgSnapshot.directReports.map((p) => (
                    <tr key={p.userId}>
                      <td><strong>{p.fullName}</strong></td>
                      <td>{p.jobTitle || "—"}</td>
                      <td>{p.department || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <Link to="/reviews" className="btn btn-sm" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
                            Evaluate
                          </Link>
                          <Link to="/feedback" className="btn btn-ghost btn-sm" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
                            Check 360
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Team Snapshot & Activity Row */}
        <div className="dash-org-activity-row dash-org-activity-row--with-org">
          <div className="card" style={{ marginBottom: 0 }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem" }}>
              <Compass size={22} />
              Team Organization Overview
            </h2>
            <p className="muted">
              Visual distribution of departments and squad headcounts under your wider purview.
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
                            <span className="dept-dot" style={{ background: deptColor(name) }} />
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
                            <span className="dept-dot" style={{ background: deptColor(name) }} />
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
          </div>

          {/* Activity Log */}
          <div className="card dash-activity" style={{ marginBottom: 0 }}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Flag size={20} />
              Recent Activity logs
            </h2>
            {activityItems.length === 0 ? (
              <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                Notifications and feedback updates will appear here as your cycle progresses.
              </p>
            ) : (
              <ul className="dash-activity__list">
                {activityItems.map((item) => (
                  <li key={item.key} className="dash-activity__item">
                    <div className="dash-activity__icon">
                      {item.icon === "msg" ? <MessageSquareText size={16} /> : <Bell size={16} />}
                    </div>
                    <div className="dash-activity__meta">
                      <Link to={item.link} style={{ fontWeight: 600, color: "var(--color-text)" }}>
                        {item.title}
                      </Link>
                      {item.sub ? (
                        <div className="muted" style={{ fontSize: "0.82rem", marginTop: "0.15rem", lineHeight: 1.4 }}>
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
      </>
    );
  }

  function renderEmployeeDashboard() {
    return (
      <>
        {/* Welcome Section */}
        <div className="dash-hero-grid">
          <div className="dash-welcome" style={{ background: "linear-gradient(135deg, #5c836c 0%, #3d6d50 100%)", color: "#fff", borderRadius: "var(--radius)", padding: "2rem", display: "flex", justifyContent: "space-between", gap: "1.5rem" }}>
            <div className="dash-welcome__body">
              <h1 className="dash-welcome__title" style={{ color: "#fff", fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: "0.5rem" }}>Welcome back, {displayName}.</h1>
              <p className="dash-welcome__lead" style={{ opacity: 0.95, fontSize: "1.05rem", lineHeight: 1.5, margin: "0 0 1.2rem" }}>
                The talent ecosystem is thriving today. You have new reviews to calibrate and fresh sentiment reports waiting for your analysis.
              </p>
              <Link to="/feedback" className="btn btn-secondary" style={{ background: "#2D3E33", color: "#fff", border: "none", borderRadius: "999px", padding: "0.6rem 1.4rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                View Daily Summary →
              </Link>
            </div>
            <div className="dash-welcome__art" style={{ background: "rgba(255,255,255,0.08)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", width: "160px", flexShrink: 0, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Award size={48} style={{ color: "#fff", opacity: 0.95 }} />
              <div style={{ fontSize: "0.75rem", color: "#fff", fontWeight: "bold", marginTop: "0.5rem", letterSpacing: "0.05em" }}>PORTAL ACTIVE</div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="dash-glance">
            <h2 className="dash-glance__title">At a glance</h2>
            <div className="dash-glance__grid">
              <Link to="/feedback" className="dash-glance__tile">
                <div className="dash-glance__icon dash-glance__icon--feedback" style={{ background: "var(--color-primary-light)" }}>
                  <MessageSquareText size={18} />
                </div>
                <div className="dash-glance__value">{fmt(stats.feedback)}</div>
                <div className="dash-glance__label">Colleague Feedback</div>
                <div className="dash-glance__sub">Peer requests on file</div>
              </Link>
              <Link to="/reviews" className="dash-glance__tile">
                <div className="dash-glance__icon dash-glance__icon--reviews" style={{ background: "var(--color-success-light)" }}>
                  <ClipboardList size={18} />
                </div>
                <div className="dash-glance__value">{fmt(stats.reviews)}</div>
                <div className="dash-glance__label">Formal Appraisals</div>
                <div className="dash-glance__sub">Self & team reviews</div>
              </Link>
              <Link to="/notifications" className="dash-glance__tile">
                <div className="dash-glance__icon dash-glance__icon--notifications" style={{ background: "var(--color-warning-light)" }}>
                  <Bell size={18} />
                </div>
                <div className="dash-glance__value">{fmt(stats.notifications)}</div>
                <div className="dash-glance__label">Notifications</div>
                <div className="dash-glance__sub">Unread alerts</div>
              </Link>
              <Link to="/recognition" className="dash-glance__tile">
                <div className="dash-glance__icon dash-glance__icon--recognition" style={{ background: "var(--color-accent-light)" }}>
                  <Sparkles size={18} />
                </div>
                <div className="dash-glance__value">{fmt(stats.recognitions)}</div>
                <div className="dash-glance__label">Recognitions Received</div>
                <div className="dash-glance__sub">Shared with you</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Employee growth widget */}
        <div className="card" style={{ marginBottom: "1.5rem", borderLeft: "4px solid var(--color-accent)" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem" }}>
            <CheckSquare size={20} />
            My Evaluation &amp; Growth Checklist
          </h2>
          <p className="muted" style={{ margin: "0 0 1rem" }}>
            Complete your self-assessment, request structured 360° reviews from your colleagues, and check development milestones.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <Link to="/self-assessment" className="btn btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
              <ClipboardSignature size={16} /> Complete Self-Evaluation
            </Link>
            <Link to="/feedback" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
              <MessageSquareText size={16} /> Request Peer Feedback
            </Link>
            <Link to="/recognition" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
              <Sparkles size={16} /> Give a Colleague Kudos
            </Link>
          </div>
        </div>

        {/* Activity & Support Block */}
        <div className="dash-org-activity-row">
          {/* Platform pillars */}
          <div className="epfms-pillar-grid card" style={{ marginBottom: 0 }}>
            <h2 className="epfms-pillar-grid__title">Platform Modules</h2>
            <p className="muted epfms-pillar-grid__lead">
              Navigate your active career development assets and organizational profile modules below.
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
            </div>
          </div>

          {/* Activity Logs */}
          <div className="card dash-activity" style={{ marginBottom: 0 }}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Flag size={20} />
              Recent Activity logs
            </h2>
            {activityItems.length === 0 ? (
              <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                Notifications and feedback updates will appear here as your cycle progresses.
              </p>
            ) : (
              <ul className="dash-activity__list">
                {activityItems.map((item) => (
                  <li key={item.key} className="dash-activity__item">
                    <div className="dash-activity__icon">
                      {item.icon === "msg" ? <MessageSquareText size={16} /> : <Bell size={16} />}
                    </div>
                    <div className="dash-activity__meta">
                      <Link to={item.link} style={{ fontWeight: 600, color: "var(--color-text)" }}>
                        {item.title}
                      </Link>
                      {item.sub ? (
                        <div className="muted" style={{ fontSize: "0.82rem", marginTop: "0.15rem", lineHeight: 1.4 }}>
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

        {/* Friendly Guidance Box */}
        <div className="card" style={{ borderLeft: "4px solid var(--color-warning, #faad14)", marginTop: "1.5rem" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem" }}>
            <ShieldAlert size={20} />
            System Scope Notice
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Administrative HR policies, program dashboards, company headcounts, and organizational performance calibrations are restricted to authorized People Leaders and HR Administrators. Contact support or your business partner if your system role is incorrect.
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="page page--home">
      {accessNotice && (
        <div className="alert alert-error" style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <span>
            That page is not available for your role. Use the menu to navigate to pages your organisation has assigned to you.
          </span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAccessNotice(false)}>
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
          {(role === "HR_ADMIN" || role === "ADMIN" || role === "SUPER_ADMIN") && renderHrDashboard()}
          {(role === "MANAGER" || role === "LEADERSHIP") && renderManagerDashboard()}
          {role !== "HR_ADMIN" && role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "MANAGER" && role !== "LEADERSHIP" && renderEmployeeDashboard()}
        </>
      )}
    </div>
  );
}
