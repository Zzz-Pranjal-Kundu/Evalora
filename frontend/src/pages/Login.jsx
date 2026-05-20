import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { EPFMS_TAGLINE } from "../constants/epfms.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("session") === "expired") {
      setError("Your session expired. Please sign in again.");
    }
  }, [location.search]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Sign in</h1>
        <p className="lead">{EPFMS_TAGLINE}</p>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="username" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.25rem" }}>
            <LogIn size={18} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 8 }} />
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "1.25rem", marginBottom: 0, textAlign: "center" }}>
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
