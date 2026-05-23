import { useEffect, useState } from "react";
import { 
  Building2, 
  CalendarRange, 
  Plus, 
  UserCheck, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { api } from "../api/index.js";
import { formatDate } from "../utils/format.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function HRHubPage() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Cycle Form State
  const [newCycle, setNewCycle] = useState({
    name: "",
    startDate: "",
    endDate: "",
    status: "DRAFT"
  });
  const [submittingCycle, setSubmittingCycle] = useState(false);

  // Manager Assignment Form State
  const [assignment, setAssignment] = useState({
    userId: "",
    managerId: ""
  });
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cyclesRes, profilesRes] = await Promise.all([
        api.get("/performance/cycles"),
        api.get("/users/profiles")
      ]);
      setCycles(Array.isArray(cyclesRes.data) ? cyclesRes.data : []);
      setProfiles(Array.isArray(profilesRes.data) ? profilesRes.data : []);
    } catch (err) {
      console.error("Error loading HR Hub data:", err);
      setError("Failed to sync operational records with backend microservices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Create Cycle
  const handleCreateCycle = async (e) => {
    e.preventDefault();
    if (!newCycle.name || !newCycle.startDate || !newCycle.endDate) {
      setError("Please complete all review cycle details.");
      return;
    }

    try {
      setSubmittingCycle(true);
      setError(null);
      setSuccessMsg(null);
      await api.post("/performance/cycles", {
        name: newCycle.name,
        start_date: newCycle.startDate,
        end_date: newCycle.endDate,
        status: newCycle.status
      });
      setSuccessMsg(`Appraisal cycle "${newCycle.name}" launched successfully!`);
      setNewCycle({ name: "", startDate: "", endDate: "", status: "DRAFT" });
      await loadData();
    } catch (err) {
      console.error("Failed to create review cycle:", err);
      setError(err.response?.data?.detail || "Could not launch new evaluation cycle.");
    } finally {
      setSubmittingCycle(false);
    }
  };

  // Handle Assign Manager
  const handleAssignManager = async (e) => {
    e.preventDefault();
    if (!assignment.userId) {
      setError("Please select an employee profile.");
      return;
    }

    try {
      setSubmittingAssign(true);
      setError(null);
      setSuccessMsg(null);
      await api.patch(`/users/profiles/${assignment.userId}/manager`, {
        managerId: assignment.managerId || null
      });
      
      const emp = profiles.find(p => p.userId === assignment.userId);
      const mgr = profiles.find(p => p.userId === assignment.managerId);
      setSuccessMsg(
        `Reporting line set successfully: ${emp?.fullName} now reports to ${mgr ? mgr.fullName : "None (Direct Report)"}.`
      );
      setAssignment({ userId: "", managerId: "" });
      await loadData();
    } catch (err) {
      console.error("Failed to assign manager:", err);
      setError(err.response?.data?.detail || "Could not update manager reporting line.");
    } finally {
      setSubmittingAssign(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="loading-spinner">Synchronizing HR Records...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.50rem" }}>
          <Building2 size={32} className="color-primary" />
          HR Operations Hub
        </h1>
        <p className="muted">
          Orchestrate company-wide appraisal waves, configure employee reporting lines, and audit active performance cycles.
        </p>
      </header>

      {/* Success/Error Alerts */}
      {error && (
        <div className="card alert alert--error" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderLeft: "4px solid var(--color-error, #f5222d)", background: "rgba(245, 34, 45, 0.08)" }}>
          <AlertCircle size={20} style={{ color: "var(--color-error)" }} />
          <div>{error}</div>
        </div>
      )}
      {successMsg && (
        <div className="card alert alert--success" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderLeft: "4px solid var(--color-success, #52c41a)", background: "rgba(82, 196, 26, 0.08)" }}>
          <CheckCircle2 size={20} style={{ color: "var(--color-success)" }} />
          <div>{successMsg}</div>
        </div>
      )}

      <div className="org-snapshot-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Left Column: Active Cycles */}
        <div>
          <div className="card" style={{ height: "100%" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 1.5rem 0" }}>
              <CalendarRange size={22} />
              Appraisal Review Cycles
            </h2>

            {cycles.length === 0 ? (
              <p className="muted">No cycles registered yet.</p>
            ) : (
              <div className="table-wrap" style={{ maxHeight: "350px", overflowY: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cycle Name</th>
                      <th>Schedule</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycles.map((c) => (
                      <tr key={c.id || c.name}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td style={{ fontSize: "0.85rem" }}>
                          {formatDate(c.start_date || c.startDate)} to {formatDate(c.end_date || c.endDate)}
                        </td>
                        <td>
                          <span 
                            className={`badge badge--${(c.status || "DRAFT").toLowerCase()}`}
                            style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              textTransform: "uppercase",
                              background: c.status === "ACTIVE" ? "rgba(82, 196, 26, 0.15)" : "rgba(140, 140, 140, 0.15)",
                              color: c.status === "ACTIVE" ? "#52c41a" : "#8c8c8c"
                            }}
                          >
                            {c.status || "DRAFT"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <hr style={{ margin: "2rem 0", border: 0, borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            {/* Create New Cycle */}
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 1rem 0" }}>
              <Plus size={18} />
              Launch New Review Cycle
            </h3>
            <form onSubmit={handleCreateCycle} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: "0.85rem" }}>Cycle Wave Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. 2026 Mid-Year Appraisal Wave" 
                  value={newCycle.name}
                  onChange={(e) => setNewCycle({ ...newCycle, name: e.target.value })}
                  required 
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "0.85rem" }}>Start Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={newCycle.startDate}
                    onChange={(e) => setNewCycle({ ...newCycle, startDate: e.target.value })}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "0.85rem" }}>End Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={newCycle.endDate}
                    onChange={(e) => setNewCycle({ ...newCycle, endDate: e.target.value })}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: "0.85rem" }}>Initial Status</label>
                <select 
                  className="form-control" 
                  value={newCycle.status}
                  onChange={(e) => setNewCycle({ ...newCycle, status: e.target.value })}
                >
                  <option value="DRAFT">DRAFT (Hidden from employees)</option>
                  <option value="ACTIVE">ACTIVE (Open for reviews)</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%", marginTop: "0.5rem" }}
                disabled={submittingCycle}
              >
                {submittingCycle ? "Launching Evaluation Wave..." : "Launch Appraisal Cycle"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Reporting Lines */}
        <div>
          <div className="card" style={{ height: "100%" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 1.5rem 0" }}>
              <UserCheck size={22} />
              Reporting Line Operations
            </h2>
            <p className="muted" style={{ marginBottom: "1.5rem" }}>
              Quickly re-provision corporate reporting structures. Changing an employee's manager alters review routing and hierarchy charts dynamically.
            </p>

            <form onSubmit={handleAssignManager} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div className="form-group">
                <label className="form-label">Select Employee</label>
                <select 
                  className="form-control"
                  value={assignment.userId}
                  onChange={(e) => setAssignment({ ...assignment, userId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Employee Profile --</option>
                  {profiles.map((p) => (
                    <option key={p.userId} value={p.userId}>
                      {p.fullName} ({p.jobTitle || "No Title"} · {p.department || "No Department"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Manager</label>
                <select 
                  className="form-control"
                  value={assignment.managerId}
                  onChange={(e) => setAssignment({ ...assignment, managerId: e.target.value })}
                >
                  <option value="">-- Direct Report (No Manager) --</option>
                  {profiles
                    .filter((p) => p.userId !== assignment.userId) // Can't report to themselves
                    .map((p) => (
                      <option key={p.userId} value={p.userId}>
                        {p.fullName} ({p.jobTitle || "Manager Profile"})
                      </option>
                    ))}
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-secondary" 
                style={{ width: "100%", marginTop: "1rem" }}
                disabled={submittingAssign}
              >
                {submittingAssign ? "Updating Hierarchy..." : "Update Reporting Structure"}
              </button>
            </form>

            <div style={{ marginTop: "2.5rem", padding: "1rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)" }}>
              <h4 style={{ display: "flex", alignItems: "center", gap: "0.25rem", margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "var(--color-primary)" }}>
                <Sparkles size={16} />
                Automatic Evaluation Sync
              </h4>
              <p style={{ margin: 0, fontSize: "0.8rem" }} className="muted">
                Reporting line configurations take effect immediately. All upcoming performance appraisals, notification fanouts, and review forms will automatically re-route to the newly assigned manager.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
