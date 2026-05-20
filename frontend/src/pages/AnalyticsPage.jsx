import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { BarChart3, Users, LineChart, Target } from "lucide-react";
import { api } from "../api/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { canSeeAnalytics } from "../config/rbac.js";

async function safeLen(getter) {
  try {
    const { data } = await getter();
    return Array.isArray(data) ? data.length : null;
  } catch {
    return null;
  }
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [workspace, setWorkspace] = useState({ reviews: null, feedback: null, directory: null });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canSeeAnalytics(user?.role)) {
      setError("Analytics is available to managers, HR, leadership, and administrators.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [dash, revN, fbN, dirN] = await Promise.all([
          api.get("/analytics/dashboard"),
          safeLen(() => api.get("/performance/reviews")),
          safeLen(() => api.get("/feedback/requests")),
          safeLen(() => api.get("/users/directory")),
        ]);
        if (!cancelled) {
          setData(dash.data);
          setWorkspace({ reviews: revN, feedback: fbN, directory: dirN });
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (error) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Performance analytics</h1>
        </header>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <div className="page-loading">
          <span className="spinner" aria-hidden />
          Loading analytics…
        </div>
      </div>
    );
  }

  const chartData = (data.chart?.labels || []).map((label, i) => ({
    name: label,
    count: data.chart.values[i],
  }));

  const fmt = (n) => (n === null ? "—" : String(n));

  return (
    <div className="page">
      <header className="page-header">
        <h1>
          <BarChart3 size={28} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 10 }} />
          Performance dashboards &amp; HR analytics
        </h1>
        <p>
          Track adoption of feedback and review workflows; combine event telemetry with directory signals to steer fair
          evaluations and high-potential programs.
        </p>
      </header>

      <div className="card epfms-callout">
        <strong>HR use cases</strong>
        <ul className="epfms-bullet-list muted" style={{ margin: "0.5rem 0 0" }}>
          <li>Monitor how consistently teams use 360 requests across cycles.</li>
          <li>Spot managers who may need coaching on continuous feedback vs. year-end-only patterns.</li>
          <li>Prepare calibration with competency-based evidence instead of anecdote alone.</li>
          <li>Feed high-potential identification from sustained performance + growth signals (wire to your HRIS / BI layer).</li>
        </ul>
      </div>

      <h2 className="dashboard-section-title">Workspace signals (live from APIs)</h2>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__value">{fmt(workspace.reviews)}</div>
          <div className="stat-card__label">Formal reviews visible to this session</div>
          <p className="stat-card__hint">Proxy for appraisal workflow adoption; scope by team in production.</p>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{fmt(workspace.feedback)}</div>
          <div className="stat-card__label">Feedback / 360 threads</div>
          <p className="stat-card__hint">Higher volume usually correlates with healthier continuous feedback culture.</p>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{fmt(workspace.directory)}</div>
          <div className="stat-card__label">Directory profiles</div>
          <p className="stat-card__hint">Headcount proxy for participation and routing of 360 raters.</p>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{data.summary?.totalEvents ?? 0}</div>
          <div className="stat-card__label">Analytics events (all time)</div>
          <p className="stat-card__hint">Platform activity ingested by the analytics microservice.</p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <LineChart size={22} />
          Event mix (recent sample)
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Distribution of the latest recorded event types—useful for understanding which workflows fire most often.
        </p>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Users size={22} />
          Talent &amp; high-potential (roadmap)
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Connect this view to your data warehouse: blend appraisal ratings, 360 themes, and learning completions to
          highlight successors and equity gaps—without storing sensitive commentary in the charting layer.
        </p>
      </div>

      <div className="card">
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Target size={22} />
          Recent events
        </h2>
        {(data.recentEvents || []).length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No recent events.
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {(data.recentEvents || []).map((e) => (
              <li key={e.id} className="muted" style={{ marginBottom: "0.35rem" }}>
                {e.eventType} · {e.receivedAt}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
