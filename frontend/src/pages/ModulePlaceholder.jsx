import { Construction } from "lucide-react";

export default function ModulePlaceholder({ title, description }) {
  return (
    <div className="page">
      <header className="page-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <div className="card empty-state" style={{ textAlign: "left", maxWidth: 720 }}>
        <Construction size={36} style={{ marginBottom: "0.75rem" }} />
        <p className="muted" style={{ margin: 0 }}>
          This module is scaffolded for the enterprise roadmap. Backend entities, APIs, and forms will connect here as
          the employee-service, review templates, and workflow engines are extended.
        </p>
      </div>
    </div>
  );
}
