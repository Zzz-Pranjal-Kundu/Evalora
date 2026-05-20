import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { DEFAULT_COMPETENCIES } from "../constants/epfms.js";

export default function CompetenciesPage() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>
          <BookOpen size={28} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 10 }} />
          Competency library
        </h1>
        <p>
          Standardized dimensions anchor <Link to="/reviews">performance appraisals &amp; ratings</Link> so evaluations are
          fair, comparable, and tied to behavior—not personality.
        </p>
      </header>

      <div className="card epfms-callout">
        <strong>Proficiency scale</strong>
        <p className="muted" style={{ margin: "0.35rem 0 0" }}>
          Each competency is rated on a five-point scale from <em>Needs focus</em> through <em>Role model</em>. Managers
          cite evidence against these definitions during reviews and calibration.
        </p>
      </div>

      <div className="table-wrap card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Competency</th>
              <th>What “good” looks like</th>
              <th>Scale</th>
            </tr>
          </thead>
          <tbody>
            {DEFAULT_COMPETENCIES.map((c) => (
              <tr key={c.code}>
                <td>
                  <strong>{c.name}</strong>
                  <div className="muted" style={{ fontSize: "0.75rem", marginTop: "0.2rem" }}>
                    {c.code}
                  </div>
                </td>
                <td className="muted" style={{ fontSize: "0.9rem", maxWidth: 360 }}>
                  {c.description}
                </td>
                <td style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{c.scale.join(" → ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Using competencies in workflows</h2>
        <ul className="epfms-bullet-list muted" style={{ margin: 0 }}>
          <li>
            <strong>Priorities:</strong> align outcomes to the competencies you are strengthening this cycle.
          </li>
          <li>
            <strong>360 feedback:</strong> ask raters for examples mapped to these dimensions.
          </li>
          <li>
            <strong>Calibration:</strong> HR compares distributions by competency to reduce rating inflation.
          </li>
        </ul>
      </div>
    </div>
  );
}
