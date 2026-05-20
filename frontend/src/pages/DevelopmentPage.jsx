import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sprout, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { storageKey } from "../constants/epfms.js";

const emptyPlan = () => ({
  skillGaps: "",
  strengthsToLeverage: "",
  actions: [],
});

export default function DevelopmentPage() {
  const { user } = useAuth();
  const key = storageKey("idp", user?.id);
  const [plan, setPlan] = useState(emptyPlan());
  const [actionTitle, setActionTitle] = useState("");
  const [actionOwner, setActionOwner] = useState("Me");
  const [actionDue, setActionDue] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setPlan({ ...emptyPlan(), ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, [key]);

  const savePlan = (next) => {
    setPlan(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  const addAction = (e) => {
    e.preventDefault();
    if (!actionTitle.trim()) return;
    savePlan({
      ...plan,
      actions: [
        ...plan.actions,
        {
          id: crypto.randomUUID(),
          title: actionTitle.trim(),
          owner: actionOwner.trim() || "Me",
          due: actionDue || null,
          status: "Planned",
        },
      ],
    });
    setActionTitle("");
    setActionDue("");
  };

  const removeAction = (id) => {
    savePlan({ ...plan, actions: plan.actions.filter((a) => a.id !== id) });
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>
          <Sprout size={28} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 10 }} />
          Development &amp; action planning
        </h1>
        <p>
          Identify skill gaps, choose targeted actions, and connect them to <Link to="/feedback">feedback themes</Link> and{" "}
          <Link to="/reviews">review conversations</Link>. This is your individual development plan (IDP) workspace.
        </p>
      </header>

      <div className="card">
        <h2>Skill diagnosis</h2>
        <div className="form-group">
          <label htmlFor="gaps">Where are the biggest gaps vs. your role expectations?</label>
          <textarea
            id="gaps"
            rows={4}
            value={plan.skillGaps}
            onChange={(e) => savePlan({ ...plan, skillGaps: e.target.value })}
            placeholder="Technical depth, leadership moments, stakeholder management, etc."
          />
        </div>
        <div className="form-group">
          <label htmlFor="str">Strengths you will deliberately apply more often</label>
          <textarea
            id="str"
            rows={3}
            value={plan.strengthsToLeverage}
            onChange={(e) => savePlan({ ...plan, strengthsToLeverage: e.target.value })}
            placeholder="Reinvest strengths into team outcomes and mentoring."
          />
        </div>
      </div>

      <div className="card">
        <h2>Action plan</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Each action should be observable—course, stretch project, shadowing, or recurring practice.
        </p>
        <form onSubmit={addAction} className="form-grid form-grid--2" style={{ marginBottom: "1rem" }}>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="at">Action</label>
            <input
              id="at"
              value={actionTitle}
              onChange={(e) => setActionTitle(e.target.value)}
              placeholder="e.g. Lead two customer discovery sessions with coach observation"
            />
          </div>
          <div className="form-group">
            <label htmlFor="ao">Owner / sponsor</label>
            <input id="ao" value={actionOwner} onChange={(e) => setActionOwner(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="ad">Target date</label>
            <input id="ad" type="date" value={actionDue} onChange={(e) => setActionDue(e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <button type="submit">
              <Plus size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 6 }} />
              Add action
            </button>
          </div>
        </form>
        {plan.actions.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No actions yet. Add 2–3 high-leverage moves tied to feedback themes.
          </p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {plan.actions.map((a) => (
              <li
                key={a.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid var(--color-border)",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <strong>{a.title}</strong>
                  <div className="muted" style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
                    Owner: {a.owner}
                    {a.due ? ` · Target ${a.due}` : ""}
                  </div>
                </div>
                <button type="button" className="btn-sm btn-ghost" onClick={() => removeAction(a.id)} aria-label="Remove">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
