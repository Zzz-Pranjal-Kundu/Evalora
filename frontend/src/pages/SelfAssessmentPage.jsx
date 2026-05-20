import { useEffect, useState } from "react";
import { ClipboardSignature, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { storageKey } from "../constants/epfms.js";
import { formatDateTime } from "../utils/format.js";

const empty = {
  accomplishments: "",
  impactExamples: "",
  challenges: "",
  stakeholderFeedback: "",
  alignmentToStrategy: "",
  developmentFocus: "",
  managerDiscussion: "",
};

export default function SelfAssessmentPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(empty);
  const [savedAt, setSavedAt] = useState(null);
  const [notice, setNotice] = useState("");

  const key = storageKey("self_eval", user?.id);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setForm({ ...empty, ...parsed.fields });
      setSavedAt(parsed.savedAt || null);
    } catch {
      /* ignore */
    }
  }, [key]);

  const save = (e) => {
    e.preventDefault();
    const payload = { fields: form, savedAt: new Date().toISOString(), cycleNote: "Draft for current period" };
    localStorage.setItem(key, JSON.stringify(payload));
    setSavedAt(payload.savedAt);
    setNotice("Your self-assessment draft was saved on this device.");
    setTimeout(() => setNotice(""), 4000);
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>
          <ClipboardSignature size={28} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 10 }} />
          Self-assessment
        </h1>
        <p>
          Reflect on your own performance before calibration or manager appraisals. Honest, specific answers fuel fair
          evaluations and better development conversations.
        </p>
      </header>

      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="card epfms-callout">
        <strong>How this fits the cycle</strong>
        <p className="muted" style={{ margin: "0.35rem 0 0" }}>
          HR and managers use self-evaluations alongside <strong>360 feedback</strong> and <strong>review themes</strong> to
          reduce bias and anchor ratings in evidence—not a single snapshot in time.
        </p>
      </div>

      <form className="card" onSubmit={save}>
        <h2>Your narrative</h2>
        <div className="form-group">
          <label htmlFor="acc">What did you deliver that you are most proud of?</label>
          <textarea
            id="acc"
            rows={4}
            value={form.accomplishments}
            onChange={(e) => setForm({ ...form, accomplishments: e.target.value })}
            placeholder="Outcomes, scope, and how you measured success."
          />
        </div>
        <div className="form-group">
          <label htmlFor="impact">Where did your work create the clearest impact for customers or the business?</label>
          <textarea
            id="impact"
            rows={3}
            value={form.impactExamples}
            onChange={(e) => setForm({ ...form, impactExamples: e.target.value })}
            placeholder="Link impact to stakeholders, metrics, or qualitative signals."
          />
        </div>
        <div className="form-group">
          <label htmlFor="ch">What was hardest—and what did you learn?</label>
          <textarea
            id="ch"
            rows={3}
            value={form.challenges}
            onChange={(e) => setForm({ ...form, challenges: e.target.value })}
            placeholder="Constraints, mistakes, and how you adapted."
          />
        </div>
        <div className="form-group">
          <label htmlFor="stake">What themes are you hearing from peers or stakeholders?</label>
          <textarea
            id="stake"
            rows={3}
            value={form.stakeholderFeedback}
            onChange={(e) => setForm({ ...form, stakeholderFeedback: e.target.value })}
            placeholder="Summarize patterns from feedback (no names required)."
          />
        </div>
        <div className="form-group">
          <label htmlFor="align">How does your work connect to team or company strategy?</label>
          <textarea
            id="align"
            rows={3}
            value={form.alignmentToStrategy}
            onChange={(e) => setForm({ ...form, alignmentToStrategy: e.target.value })}
            placeholder="Name priorities, OKRs, or value streams you advanced."
          />
        </div>
        <div className="form-group">
          <label htmlFor="dev">Where do you want to grow next—and what support would help?</label>
          <textarea
            id="dev"
            rows={3}
            value={form.developmentFocus}
            onChange={(e) => setForm({ ...form, developmentFocus: e.target.value })}
            placeholder="Skills, exposure, coaching, or training aligned to your IDP."
          />
        </div>
        <div className="form-group">
          <label htmlFor="mgr">Anything you want your manager to know before your review conversation?</label>
          <textarea
            id="mgr"
            rows={2}
            value={form.managerDiscussion}
            onChange={(e) => setForm({ ...form, managerDiscussion: e.target.value })}
            placeholder="Context, career direction, or workload themes."
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem" }}>
          <button type="submit">
            <Save size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 6 }} />
            Save draft
          </button>
          {savedAt && (
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              Last saved {formatDateTime(savedAt)}
            </span>
          )}
        </div>
        <p className="muted" style={{ margin: "1rem 0 0", fontSize: "0.8rem" }}>
          Drafts stay in your browser for this demo. A production system would submit to HR workflow and attach to the
          formal appraisal packet.
        </p>
      </form>
    </div>
  );
}
