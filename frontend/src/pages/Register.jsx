import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "EMPLOYEE",
    department: "",
    jobTitle: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <h1>Create account</h1>
        <p className="lead">Join the directory with your role and org details.</p>
        <form onSubmit={onSubmit}>
          <div className="form-grid form-grid--2">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="password">Password (min 8)</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="role">Role</label>
        <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
          <option value="HR_ADMIN">HR Admin</option>
          <option value="LEADERSHIP">Leadership</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin (legacy)</option>
        </select>
            </div>
            <div className="form-group">
              <label htmlFor="dept">Department</label>
              <input id="dept" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="job">Job title</label>
              <input id="job" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
            </div>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.25rem" }}>
            <UserPlus size={18} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 8 }} />
            {loading ? "Creating…" : "Register"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "1.25rem", marginBottom: 0, textAlign: "center" }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
