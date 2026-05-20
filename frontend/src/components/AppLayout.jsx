import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  ClipboardList,
  MessageSquareText,
  Bell,
  BarChart3,
  LogOut,
  Network,
  BookOpen,
  Scale,
  Sprout,
  Sparkles,
  Building2,
  LineChart,
  Shield,
  ClipboardSignature,
  Search,
  LifeBuoy,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { canAccessPath } from "../config/rbac.js";
import { api } from "../api/index.js";

const navClass = ({ isActive }) =>
  `sidebar__link${isActive ? " sidebar__link--active" : ""}`;

function initialsFromEmailLocal(local) {
  const s = (local || "").trim();
  if (!s) return "?";
  const segments = s.split(/[._-]+/).filter(Boolean);
  if (segments.length >= 2) {
    return (segments[0][0] + segments[segments.length - 1][0]).toUpperCase();
  }
  return s.slice(0, 2).toUpperCase();
}

function initialsFromName(name, email) {
  const n = (name || "").trim();
  if (n.length >= 2) {
    const parts = n.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }
  const local = (email || "").split("@")[0] || "?";
  return initialsFromEmailLocal(local);
}

export function AppLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const r = user?.role;
  const show = (path) => canAccessPath(r, path);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileName, setProfileName] = useState("");

  const refreshUnread = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications");
      if (!Array.isArray(data)) {
        setUnreadCount(0);
        return;
      }
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [location.pathname, refreshUnread]);

  useEffect(() => {
    const id = setInterval(refreshUnread, 20000);
    return () => clearInterval(id);
  }, [refreshUnread]);

  useEffect(() => {
    const onFocus = () => refreshUnread();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshUnread]);

  useEffect(() => {
    const onRefreshNotifications = () => refreshUnread();
    window.addEventListener("epfms-refresh-notifications", onRefreshNotifications);
    return () => window.removeEventListener("epfms-refresh-notifications", onRefreshNotifications);
  }, [refreshUnread]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/users/profiles/me");
        if (!cancelled && data?.fullName) setProfileName(data.fullName);
      } catch {
        if (!cancelled) setProfileName("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const routeTitle = useMemo(() => {
    const map = {
      "/": "Performance home",
      "/profile": "Profile",
      "/self-assessment": "Self-assessment",
      "/reviews": "Performance reviews",
      "/feedback": "Feedback hub",
      "/development": "Development plans",
      "/recognition": "Recognition feed",
      "/notifications": "Notifications inbox",
      "/org": "Organization & charts",
      "/competencies": "Competency framework",
      "/calibration": "Calibration",
      "/hr": "HR hub",
      "/leadership": "Leadership insights",
      "/analytics": "Analytics workspace",
      "/admin": "System administration",
    };
    return map[location.pathname] || "EPFMS workspace";
  }, [location.pathname]);

  const displayName = profileName || user?.email?.split("@")[0] || "User";
  const initials = initialsFromName(profileName, user?.email);
  const cycleActive = true;

  return (
    <div className="layout">
      <aside className="sidebar">
        <p className="sidebar__brand">EPFMS</p>
        <div className="sidebar__user">
          <div className="sidebar__avatar" aria-hidden>
            {initials}
          </div>
          <div className="sidebar__user-meta">
            <span className="sidebar__user-name">{displayName}</span>
            <span className="sidebar__user-email">{user?.email}</span>
            <span className="sidebar__user-role">{user?.role}</span>
          </div>
        </div>
        <nav>
          <p className="sidebar__nav-label">My performance</p>
          <NavLink to="/" end className={navClass}>
            <LayoutDashboard size={18} strokeWidth={2} />
            Home
          </NavLink>
          <NavLink to="/profile" className={navClass}>
            <User size={18} strokeWidth={2} />
            Profile
          </NavLink>
          <NavLink to="/feedback" className={navClass}>
            <MessageSquareText size={18} strokeWidth={2} />
            Feedback
          </NavLink>
          <NavLink to="/reviews" className={navClass}>
            <ClipboardList size={18} strokeWidth={2} />
            Reviews
          </NavLink>
          <p className="sidebar__nav-label">Growth &amp; recognition</p>
          <NavLink to="/development" className={navClass}>
            <Sprout size={18} strokeWidth={2} />
            Development
          </NavLink>
          <NavLink to="/recognition" className={navClass}>
            <Sparkles size={18} strokeWidth={2} />
            Recognition
          </NavLink>
          <NavLink to="/competencies" className={navClass}>
            <BookOpen size={18} strokeWidth={2} />
            Competencies
          </NavLink>
          <NavLink to="/org" className={navClass}>
            <Network size={18} strokeWidth={2} />
            Org &amp; charts
          </NavLink>
          <NavLink to="/self-assessment" className={navClass}>
            <ClipboardSignature size={18} strokeWidth={2} />
            Self-assessment
          </NavLink>

          <p className="sidebar__nav-label">Programs &amp; insights</p>
          {show("/analytics") && (
            <NavLink to="/analytics" className={navClass}>
              <BarChart3 size={18} strokeWidth={2} />
              Analytics
            </NavLink>
          )}
          <NavLink to={show("/analytics") ? "/analytics" : "/reviews"} className={navClass}>
            <FileText size={18} strokeWidth={2} />
            Reports
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `${navClass({ isActive })}${!isActive && unreadCount > 0 ? " sidebar__link--alerts" : ""}`
            }
          >
            <Bell size={18} strokeWidth={2} />
            Notifications
            {unreadCount > 0 ? (
              <span className="sidebar__notif-badge" aria-hidden>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </NavLink>

          {show("/calibration") && (
            <>
              <p className="sidebar__nav-label">Calibration</p>
              <NavLink to="/calibration" className={navClass}>
                <Scale size={18} strokeWidth={2} />
                Calibration
              </NavLink>
            </>
          )}

          {(show("/hr") || show("/leadership") || show("/admin")) && (
            <p className="sidebar__nav-label">Administration</p>
          )}
          {show("/hr") && (
            <NavLink to="/hr" className={navClass}>
              <Building2 size={18} strokeWidth={2} />
              HR hub
            </NavLink>
          )}
          {show("/leadership") && (
            <NavLink to="/leadership" className={navClass}>
              <LineChart size={18} strokeWidth={2} />
              Leadership
            </NavLink>
          )}
          {show("/admin") && (
            <NavLink to="/admin" className={navClass}>
              <Shield size={18} strokeWidth={2} />
              Admin
            </NavLink>
          )}
        </nav>
        <div className="sidebar__logout">
          <button
            type="button"
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>
      <main className="content-shell">
        <header className="topbar">
          <div className="topbar__left">
            <div className="topbar__crumbs">
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>{routeTitle}</strong>
            </div>
            <div className="topbar__status-row">
              <span className="topbar__chip">
                <span className={`topbar__chip-dot${cycleActive ? " topbar__chip-dot--live" : ""}`} />
                Cycle view: {cycleActive ? "Active" : "Awaiting"}
              </span>
              <span className="topbar__chip topbar__chip--role">Role: {user?.role}</span>
              <span className="topbar__chip topbar__chip--workspace">Workspace: EPFMS Core</span>
            </div>
          </div>
          <div className="topbar__center">
            <label className="topbar__search" htmlFor="global-nav-search">
              <Search size={16} />
              <input id="global-nav-search" placeholder="Search modules, people…" />
            </label>
          </div>
          <div className="topbar__right">
            <button type="button" className="btn btn-ghost btn-sm topbar__help">
              <LifeBuoy size={16} />
              Help
            </button>
            <Link
              to="/notifications"
              className={`topbar__bell${unreadCount > 0 ? " topbar__bell--active" : ""}`}
              title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
              aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Open notifications"}
            >
              <Bell size={18} />
              {unreadCount > 0 ? <span className="topbar__badge">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
            </Link>
          </div>
        </header>
        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
