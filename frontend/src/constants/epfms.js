/** Domain copy and static models for the Employee Performance & Feedback experience. */

export const EPFMS_TAGLINE =
  "Streamline continuous feedback, 360° input, and development planning—so conversations stay ongoing and evidence-based, not only year-end.";

export const SMART_DIMENSIONS = [
  { key: "S", label: "Specific", hint: "Clear outcome or behavior, not vague intent." },
  { key: "M", label: "Measurable", hint: "Evidence you will collect (metrics, milestones, deliverables)." },
  { key: "A", label: "Achievable", hint: "Realistic given scope, dependencies, and time." },
  { key: "R", label: "Relevant", hint: "Ties to team priorities, customers, or company strategy." },
  { key: "T", label: "Time-bound", hint: "Target date or review checkpoint for closure." },
];

/** Default competency model used in copy and appraisals (static until HR configures a library). */
export const DEFAULT_COMPETENCIES = [
  {
    code: "DELIVERY",
    name: "Results & delivery",
    description: "Produces reliable outcomes, manages trade-offs, and follows through on commitments.",
    scale: ["Needs focus", "Developing", "Solid", "Strong", "Role model"],
  },
  {
    code: "COLLAB",
    name: "Collaboration & influence",
    description: "Works across boundaries, listens well, and helps others succeed.",
    scale: ["Needs focus", "Developing", "Solid", "Strong", "Role model"],
  },
  {
    code: "LEARN",
    name: "Learning & adaptability",
    description: "Seeks feedback, experiments, and adjusts when context changes.",
    scale: ["Needs focus", "Developing", "Solid", "Strong", "Role model"],
  },
  {
    code: "STRATEGY",
    name: "Strategic thinking",
    description: "Connects daily work to customer value and longer-term priorities.",
    scale: ["Needs focus", "Developing", "Solid", "Strong", "Role model"],
  },
];

export function storageKey(prefix, userId) {
  return `epfms_${prefix}_${userId || "anon"}`;
}
