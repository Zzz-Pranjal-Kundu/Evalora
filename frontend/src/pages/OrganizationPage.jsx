import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronDown, ChevronRight, Network, Users, UserCircle2, GitBranch } from "lucide-react";
import { api } from "../api/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { canListAllProfiles } from "../config/rbac.js";

function mergeRoster(me, directoryRows) {
  const d = Array.isArray(directoryRows) ? directoryRows : [];
  if (!me?.userId) return d;
  const rest = d.filter((r) => r.userId !== me.userId);
  return [me, ...rest];
}

function buildChildrenMap(people) {
  const byManager = new Map();
  for (const p of people) {
    const key = p.managerId || "__root__";
    if (!byManager.has(key)) byManager.set(key, []);
    byManager.get(key).push(p);
  }
  for (const [, arr] of byManager) {
    arr.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
  }
  return byManager;
}

function reportingLine(peopleById, userId) {
  const line = [];
  let cur = peopleById.get(userId);
  const seen = new Set();
  while (cur && !seen.has(cur.userId)) {
    seen.add(cur.userId);
    line.push(cur);
    if (!cur.managerId) break;
    cur = peopleById.get(cur.managerId);
  }
  return line;
}

function collectSubtreeIds(childrenMap, rootId) {
  const ids = new Set();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop();
    if (ids.has(id)) continue;
    ids.add(id);
    const kids = childrenMap.get(id) || [];
    for (const c of kids) stack.push(c.userId);
  }
  return ids;
}

function OrgTreeNode({ person, depth, childrenMap, expanded, toggle, currentUserId, focusId }) {
  const kids = childrenMap.get(person.userId) || [];
  const open = expanded.has(person.userId);
  const isMe = person.userId === currentUserId;
  const isFocus = person.userId === focusId;

  return (
    <li className="org-tree__node">
      <div
        className={`org-tree__row${isMe ? " org-tree__row--self" : ""}${isFocus ? " org-tree__row--focus" : ""}`}
        style={{ paddingLeft: `${0.5 + depth * 1.1}rem` }}
      >
        {kids.length > 0 ? (
          <button type="button" className="org-tree__toggle" onClick={() => toggle(person.userId)} aria-expanded={open}>
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="org-tree__toggle org-tree__toggle--spacer" />
        )}
        <div className="org-tree__meta">
          <strong>{person.fullName}</strong>
          {isMe ? (
            <span className="badge badge--active" style={{ marginLeft: "0.35rem" }}>
              You
            </span>
          ) : null}
          {isFocus && !isMe ? (
            <span className="badge badge--muted" style={{ marginLeft: "0.35rem" }}>
              Chart focus
            </span>
          ) : null}
          <div className="muted org-tree__titles">
            {[person.jobTitle, person.department, person.team].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
      </div>
      {kids.length > 0 && open && (
        <ul className="org-tree__children">
          {kids.map((c) => (
            <OrgTreeNode
              key={c.userId}
              person={c}
              depth={depth + 1}
              childrenMap={childrenMap}
              expanded={expanded}
              toggle={toggle}
              currentUserId={currentUserId}
              focusId={focusId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrganizationPage() {
  const { user } = useAuth();
  const role = user?.role;
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [chartFocusId, setChartFocusId] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      let roster = [];
      if (canListAllProfiles(role)) {
        const { data } = await api.get("/users/profiles");
        roster = Array.isArray(data) ? data : [];
      } else {
        const [meRes, dirRes] = await Promise.all([api.get("/users/profiles/me"), api.get("/users/directory")]);
        roster = mergeRoster(meRes.data, dirRes.data);
      }
      setPeople(roster);
    } catch (e) {
      setError(e?.message || "Could not load organization");
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [role, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user?.id && people.some((p) => p.userId === user.id)) {
      setChartFocusId((prev) => (prev && people.some((p) => p.userId === prev) ? prev : user.id));
    }
  }, [user?.id, people]);

  const byId = useMemo(() => new Map(people.map((p) => [p.userId, p])), [people]);

  const childrenMap = useMemo(() => buildChildrenMap(people), [people]);

  const roots = useMemo(() => {
    const r = childrenMap.get("__root__") || [];
    const orphans = people.filter((p) => p.managerId && !byId.has(p.managerId));
    const seen = new Set(r.map((x) => x.userId));
    const extra = orphans.filter((o) => !seen.has(o.userId));
    return [...r, ...extra];
  }, [people, childrenMap, byId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => {
      const blob = [p.fullName, p.department, p.jobTitle, p.team, p.userId].filter(Boolean).join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [people, search]);

  const teams = useMemo(() => {
    const m = new Map();
    for (const p of people) {
      const t = p.team || "— Unassigned team";
      if (!m.has(t)) m.set(t, []);
      m.get(t).push(p);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [people]);

  const me = user?.id ? byId.get(user.id) : null;
  const peers = useMemo(() => {
    if (!me?.managerId) return [];
    return people.filter((p) => p.userId !== me.userId && p.managerId === me.managerId);
  }, [people, me]);

  const directs = useMemo(() => {
    if (!user?.id) return [];
    return people.filter((p) => p.managerId === user.id);
  }, [people, user?.id]);

  const teammates = useMemo(() => {
    if (!me?.team) return [];
    return people.filter((p) => p.userId !== me.userId && p.team === me.team);
  }, [people, me]);

  const line = useMemo(() => (chartFocusId ? reportingLine(byId, chartFocusId) : []), [byId, chartFocusId]);

  useEffect(() => {
    if (!chartFocusId || !byId.size) return;
    const ln = reportingLine(byId, chartFocusId);
    setExpanded((prev) => {
      const next = new Set(prev);
      ln.forEach((p) => next.add(p.userId));
      return next;
    });
  }, [chartFocusId, byId]);

  const subtreeIds = useMemo(() => {
    if (!chartFocusId) return null;
    return collectSubtreeIds(childrenMap, chartFocusId);
  }, [chartFocusId, childrenMap]);

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAllUnderFocus = () => {
    if (!chartFocusId || !subtreeIds) return;
    setExpanded(new Set(subtreeIds));
  };

  const collapseTree = () => setExpanded(new Set());

  if (loading) {
    return (
      <div className="page">
        <div className="page-loading">
          <span className="spinner" aria-hidden />
          Loading organization…
        </div>
      </div>
    );
  }

  return (
    <div className="page page--wide">
      <header className="page-header page-header__row">
        <div>
          <h1>
            <Network size={26} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 8 }} />
            Organization
          </h1>
          <p>
            Directory, teams, reporting lines, and an interactive chart—see how departments connect and who works with whom.
            Data comes from your EPFMS profile roster (demo: <code>database/demo_org_seed.json</code>).
          </p>
        </div>
        <Link to="/" className="btn btn-ghost btn-sm">
          ← Performance home
        </Link>
      </header>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {me && (
        <div className="card org-my-context">
          <h2>
            <UserCircle2 size={20} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 8 }} />
            Your place in the org
          </h2>
          <div className="org-my-context__grid">
            <div>
              <h3 className="org-subheading">Reports to</h3>
              {me.managerId && byId.get(me.managerId) ? (
                <p style={{ margin: 0 }}>
                  <strong>{byId.get(me.managerId).fullName}</strong>
                  <span className="muted" style={{ display: "block", fontSize: "0.85rem" }}>
                    {byId.get(me.managerId).jobTitle || "—"} · {byId.get(me.managerId).department || "—"}
                  </span>
                </p>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  No manager on file (top of hierarchy or data gap).
                </p>
              )}
            </div>
            <div>
              <h3 className="org-subheading">Peers (same manager)</h3>
              {peers.length ? (
                <ul className="org-chip-list">
                  {peers.map((p) => (
                    <li key={p.userId}>
                      <button type="button" className="org-chip" onClick={() => setChartFocusId(p.userId)}>
                        {p.fullName}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  No peers listed.
                </p>
              )}
            </div>
            <div>
              <h3 className="org-subheading">Your team / squad</h3>
              <p style={{ margin: "0 0 0.5rem" }}>
                <span className="badge badge--active">{me.team || "—"}</span>
              </p>
              {teammates.length ? (
                <ul className="org-chip-list">
                  {teammates.map((p) => (
                    <li key={p.userId}>
                      <button type="button" className="org-chip" onClick={() => setChartFocusId(p.userId)}>
                        {p.fullName}
                      </button>
                      <span className="muted" style={{ fontSize: "0.78rem", marginLeft: "0.25rem" }}>
                        {p.jobTitle || ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  No other members on this squad in view.
                </p>
              )}
            </div>
            <div>
              <h3 className="org-subheading">People you manage</h3>
              {directs.length ? (
                <ul className="org-chip-list">
                  {directs.map((p) => (
                    <li key={p.userId}>
                      <button type="button" className="org-chip" onClick={() => setChartFocusId(p.userId)}>
                        {p.fullName}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  No direct reports in this roster.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>
          <GitBranch size={20} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 8 }} />
          Reporting line &amp; chart focus
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Pick anyone to see their chain to the top. The tree below highlights them and shows their downstream org.
        </p>
        <div className="form-grid form-grid--2" style={{ alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="org-focus">Focus person (org chart)</label>
            <select
              id="org-focus"
              value={people.some((p) => p.userId === chartFocusId) ? chartFocusId : (people[0]?.userId || "")}
              onChange={(e) => setChartFocusId(e.target.value)}
            >
              {people.map((p) => (
                <option key={p.userId} value={p.userId}>
                  {p.fullName}
                  {p.userId === user?.id ? " (you)" : ""} — {p.department || "?"} / {p.jobTitle || "?"}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={expandAllUnderFocus}>
              Expand subtree
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={collapseTree}>
              Collapse all
            </button>
          </div>
        </div>
        {line.length > 0 && (
          <div className="org-reporting-line">
            <h3 className="org-subheading">Line to root (CEO / top node)</h3>
            <ol className="org-reporting-line__steps">
              {line.map((p, i) => (
                <li key={p.userId}>
                  <span className="muted" style={{ fontSize: "0.75rem" }}>
                    Level {i + 1}
                  </span>
                  <div>
                    <strong>{p.fullName}</strong>{" "}
                    <span className="muted" style={{ fontSize: "0.82rem" }}>
                      {p.jobTitle || "—"} · {p.department || "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="card">
        <h2>
          <Users size={20} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 8 }} />
          Interactive org chart (manager → reports)
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Expand nodes to walk the hierarchy. Multiple roots appear when someone lacks a manager record in this workspace.
        </p>
        <div className="org-tree">
          <ul className="org-tree__roots">
            {roots.map((p) => (
              <OrgTreeNode
                key={p.userId}
                person={p}
                depth={0}
                childrenMap={childrenMap}
                expanded={expanded}
                toggle={toggle}
                currentUserId={user?.id}
                focusId={chartFocusId}
              />
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2>
          <Building2 size={20} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 8 }} />
          Teams &amp; who works together
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          People on the same squad are listed together—useful for matrix collaboration and feedback routing.
        </p>
        <div className="org-team-grid">
          {teams.map(([teamName, members]) => (
            <div key={teamName} className="org-team-card">
              <h3 className="org-team-card__title">{teamName}</h3>
              <p className="muted" style={{ margin: "0 0 0.5rem", fontSize: "0.8rem" }}>
                {members.length} people
              </p>
              <ul className="org-team-card__list">
                {members.map((p) => (
                  <li key={p.userId}>
                    <button type="button" className="org-team-card__name" onClick={() => setChartFocusId(p.userId)}>
                      {p.fullName}
                    </button>
                    <div className="muted" style={{ fontSize: "0.78rem" }}>
                      {p.jobTitle || "—"} · {p.department || "—"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Full directory</h2>
        <div className="form-group" style={{ maxWidth: "28rem" }}>
          <label htmlFor="org-search">Search name, department, title, team</label>
          <input id="org-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. Engineering, VP, CS-North" />
        </div>
        <div className="table-wrap" style={{ maxHeight: "28rem", overflowY: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Title</th>
                <th>Team</th>
                <th>Manager</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.userId}>
                  <td>
                    <button type="button" className="org-table-name" onClick={() => setChartFocusId(p.userId)}>
                      {p.fullName}
                    </button>
                    {p.userId === user?.id ? (
                      <span className="badge badge--muted" style={{ marginLeft: "0.35rem" }}>
                        You
                      </span>
                    ) : null}
                  </td>
                  <td className="muted" style={{ fontSize: "0.88rem" }}>
                    {p.department || "—"}
                  </td>
                  <td className="muted" style={{ fontSize: "0.88rem" }}>
                    {p.jobTitle || "—"}
                  </td>
                  <td className="muted" style={{ fontSize: "0.88rem" }}>
                    {p.team || "—"}
                  </td>
                  <td className="muted" style={{ fontSize: "0.88rem" }}>
                    {p.managerId && byId.get(p.managerId) ? byId.get(p.managerId).fullName : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ margin: "0.75rem 0 0", fontSize: "0.82rem" }}>
          Showing {filtered.length} of {people.length} people. Click a name to focus the chart and reporting line.
        </p>
      </div>
    </div>
  );
}
