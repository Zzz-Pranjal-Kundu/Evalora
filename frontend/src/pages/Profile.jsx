import { useEffect, useState, useMemo } from "react";
import { api } from "../api/index.js";
import { formatDate } from "../utils/format.js";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [directory, setDirectory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ fullName: "", department: "", jobTitle: "", team: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, dirRes] = await Promise.all([
          api.get("/users/profiles/me"),
          api.get("/users/directory").catch(() => ({ data: [] })),
        ]);
        if (!cancelled) {
          const data = meRes.data;
          setProfile(data);
          setDirectory(Array.isArray(dirRes.data) ? dirRes.data : []);
          setForm({
            fullName: data.fullName || "",
            department: data.department || "",
            jobTitle: data.jobTitle || "",
            team: data.team || "",
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const managerLabel = useMemo(() => {
    if (!profile?.managerId) return "Not assigned yet";
    const m = directory.find((d) => d.userId === profile.managerId);
    if (m) return `${m.fullName}${m.jobTitle ? ` · ${m.jobTitle}` : ""}`;
    return "Assigned (details visible to HR / admin)";
  }, [profile, directory]);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      const { data } = await api.patch("/users/profiles/me", form);
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      setError(err.message);
    }
  };

  const initial = (form.fullName || "?").trim().charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="page">
        <div className="page-loading">
          <span className="spinner" aria-hidden />
          Loading profile…
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Profile</h1>
        <p>Keep your directory information current so managers and peers can find you.</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {saved && <div className="alert alert-success">Your profile was saved.</div>}

      <div className="card" style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1d4ed8, #0ea5e9)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            fontWeight: 700,
            flexShrink: 0,
          }}
          aria-hidden
        >
          {initial}
        </div>
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <form onSubmit={save}>
            <div className="form-grid form-grid--2">
              <div className="form-group">
                <label htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  autoComplete="name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <input
                  id="department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="jobTitle">Job title</label>
                <input
                  id="jobTitle"
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="team">Team / squad</label>
                <input id="team" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} placeholder="e.g. CS-North-America" />
              </div>
            </div>
            <button type="submit">Save changes</button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2>Organization</h2>
        <dl style={{ margin: 0, display: "grid", gap: "0.75rem 2rem", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          <div>
            <dt className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
              Team
            </dt>
            <dd style={{ margin: 0, fontWeight: 500 }}>{profile?.team || "—"}</dd>
          </div>
          <div>
            <dt className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
              Manager
            </dt>
            <dd style={{ margin: 0, fontWeight: 500 }}>{managerLabel}</dd>
          </div>
          <div>
            <dt className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
              Profile since
            </dt>
            <dd style={{ margin: 0, fontWeight: 500 }}>{profile?.createdAt ? formatDate(profile.createdAt) : "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
