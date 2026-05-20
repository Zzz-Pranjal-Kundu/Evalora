# EPFMS — what this project is, and how the pieces fit together

This document is meant for anyone opening the repo for the first time: teammates, reviewers, or your future self. It’s a plain-language tour of the **Employee Performance & Feedback Management System (EPFMS)** — what it does, why the main screens exist, and what runs under the hood.

---

## The idea in one paragraph

Most of us have lived through performance cycles that only “matter” in November. This app is a **small, honest slice** of how modern HR tech tries to fix that: goals you can track, feedback you can request and give, formal reviews tied to a cycle, quick check-in notes, recognition, and a simple notification inbox — all behind a login and a role-aware UI. It’s built as a **capstone-style microservice** project: real HTTP boundaries, not a single monolith pretending to be enterprise scale.

---

## Who it’s for (personas)

- **Employees** — Own their goals, ask for feedback, fill self-assessment, read reviews, log check-ins, see notifications.
- **Managers** — Same employee tools, plus submit appraisals for their team when the app allows it, and see extra dashboard tiles where implemented.
- **HR / leadership / super admin** — Broader navigation (HR hub, calibration placeholder, leadership placeholder, org views, analytics where enabled) so the product *signals* how a full rollout would be gated, even if some pages are still scaffolding.

---

## Main functionality (by area)

### Authentication & profile

- Register and log in; JWT access tokens (with refresh in the flow the repo supports).
- Profile basics live in the **user** service: name, department, job title, manager link, team, preferences.

### Goals

- **Why it exists:** Check-ins capture *conversations*; goals capture *commitments*. SMART-style fields, progress, target dates — so reviews aren’t purely subjective.
- **What you can do:** List, create, and update goals via the API; the UI walks you through the “SMART” lens before you save.

### Feedback (360° & continuous)

- **Why it exists:** Structured written feedback between people in the directory — requests, topics, threaded responses.
- **Notable behavior:** You can choose **who is in the loop** (participants only vs managers notified and able to see the thread in the hub), so it mirrors a common real-world tension between transparency and privacy.
- Opening the feedback hub can mark related notification types read so the bell isn’t stuck on stale “feedback” alerts.

### Performance reviews

- Review **cycles** (e.g. annual window) and **reviews** (employee, reviewer, rating, summary, status).
- Managers (and admins) can submit reviews when the UI allows; employees see what’s on file.
- **Visibility on reviews** controls whether the employee’s **people manager** (from the profile) also gets notified when a review is submitted or updated — useful when skip-level or HR shouldn’t be pinged for every draft.

### Check-ins

- **Why it exists:** Lightweight notes after 1:1s or async touchpoints — agenda, notes, “next focus.”
- **Sharing:** You can **share a check-in with specific colleagues**; it’s stored on the server, they see it on their Check-ins page, and they get an in-app notification. Older notes might still appear from **browser-only** storage if you had any before sharing shipped — the UI calls that out so nothing vanishes mysteriously.

### Recognition

- Post shout-outs tied to company values; optional named recipient.
- **Feed visibility:** Public org feed vs. a tighter “sender & recipient only” mode (plus privileged roles), so not everything has to be a billboard.

### Notifications

- In-app inbox fed by internal calls from other services (feedback, recognition, reviews, shared check-ins, etc.).
- Opening the notifications page marks items read and refreshes the shell badge so counts stay honest.

### Analytics & AI (stubs)

- **Analytics** — Events and simple dashboards for adoption-style thinking (the exact charts evolve with the codebase).
- **AI insights** — Stub endpoints behind service auth so the gateway and RBAC story is real; swap in a model later without redrawing the map.

### Other UI modules

Some routes are **intentional placeholders** (calibration, parts of HR hub, leadership, admin) so navigation and RBAC match a future product without claiming those features are finished. Competencies, development, org, and self-assessment pages add narrative and links so the app feels like one coherent workspace.

---

## The home dashboard — what’s the point of each bit?

The dashboard is the **first screen after login**. Roughly:

| Area | What it’s trying to answer |
|------|----------------------------|
| **Welcome / role line** | “Who am I here as?” — copy shifts slightly for manager vs HR vs employee so the same app doesn’t feel tone-deaf. |
| **Cycle chip** | Is there an active performance cycle in the system? (Pulled from the performance service.) |
| **“At a glance” tiles** | Quick counts and deep links: goals, check-ins, feedback requests, reviews — so you don’t hunt the sidebar for “where was that again?” |
| **Pillars / narrative blocks** | Explain how goals, feedback, reviews, and recognition relate — it’s onboarding baked into the layout. |
| **Activity / notifications snippet** | Recent noise in one place; usually points you to Feedback or Notifications. |
| **Manager / HR / leadership panels** | When your role qualifies, you see **mock JSON** from dashboard endpoints — enough to demo “different dashboards per persona” without building a full data warehouse. |
| **Org snapshot** | If the API exposes a roster, you get a lightweight department/team breakdown and (for managers) direct reports — a taste of headcount storytelling. |

**Candid detail:** Older **browser-only** check-ins may still appear at the bottom of the Check-ins page until you copy them over. The home tile count uses **`GET /users/profiles/me/check-ins`** so it stays in sync with saved and shared entries.

---

## Typical use cases (short stories)

1. **Quarterly goal check** — Employee updates goal progress before a 1:1; manager opens reviews later with something concrete to reference.
2. **360 request** — Employee sends a feedback request to a peer, chooses whether managers are in the loop, peer responds in-thread.
3. **Manager appraisal** — Manager submits a formal review for the active cycle, optionally notifying the employee’s people manager.
4. **Shout-out** — Someone posts recognition; colleague gets a notification; feed visibility respects “public” vs “private on feed.”
5. **Check-in share** — After a difficult week, employee writes check-in notes and shares with their manager only — manager sees it on Check-ins and gets notified.

---

## Tech stack (actual dependencies, not marketing)

**Frontend**

- **React 18** with **Vite** for dev and build.
- **react-router-dom** for routing and protected/role routes.
- **axios** for HTTP (single client, gateway base URL, interceptors for JWT refresh).
- **lucide-react** for icons; **recharts** where charts exist.

**Backend**

- **Node.js** + **Express** per service.
- **SQLite** via **`node:sqlite`** (`DatabaseSync`) for local persistence in each service (auth, user, notification, performance, feedback, goals, analytics — each with its own file or path).
- **JWT** for auth claims; **bcrypt** (auth service) for passwords; internal **`X-Internal-Key`** (or equivalent) for service-to-service calls where configured.
- **API gateway** — single entry for the SPA: forwards to auth, user, notification, performance, feedback, goals, analytics, AI; applies auth and RBAC on selected routes.

**Ops / optional**

- **concurrently** at the monorepo root to run many services at once.
- **PostgreSQL** DDL under `backend/database/migrations/` as a **north-star schema** — the Node services in this repo are still SQLite-first for easy class demos; migrating is explicitly a next step in `EPFMS_ROADMAP_AND_ASSUMPTIONS.md`.
- **Docker compose** for Postgres is optional, not required to run the happy path.

**API shape**

- Gateway exposes **`/api`** and **`/api/v1`** (same routes; v1 is the preferred prefix for clients that want versioning).

---

## Repository shape (where to look)

- `frontend/` — SPA only talks to the gateway (`VITE_API_BASE_URL`, default `http://localhost:8080/api`).
- `backend/services/*` — One folder per microservice; inside each you’ll usually find `models/`, `services/`, `controllers/`, sometimes `views/` for JSON shaping.
- `backend/database/` — Demo org seed JSON, Postgres migration(s).
- `docs/` — This file, roadmap, architecture notes, diagrams if present.

Default **ports** (local): gateway **8080**, auth **3001**, user **3002**, notification **3003**, performance **8001**, feedback **8002**, analytics **8004**, AI **8005**, Vite **5173**. The root **README** has install and troubleshooting if a port or `node_modules` issue bites you.

---

## RBAC in plain English

The app uses **roles** on the JWT (today effectively one primary role per user). The **frontend** (`rbac.js`) hides or shows nav items so people don’t click into dead ends; the **gateway** enforces the same idea for sensitive API paths. Roles you’ll see in code include `EMPLOYEE`, `MANAGER`, `ADMIN`, `HR_ADMIN`, `LEADERSHIP`, `SUPER_ADMIN` — not every combination is deeply wired everywhere, but the pattern is consistent for growth.

---

## What this project is *not* (scope honesty)

- Not a full HRIS, payroll, or LMS.
- Not multi-tenant SaaS hardening out of the box (rate limits exist on the gateway, but you’d still harden for production).
- Not “all analytics are real-time warehouse truth” — some dashboard payloads are **mock** by design until a real employee/org pipeline lands.

---

## If you only read one other doc

`EPFMS_ROADMAP_AND_ASSUMPTIONS.md` — backlog, demo registration tips, RBAC notes, and what the maintainers assumed when they cut corners on purpose.

---

*Last aligned with the codebase layout and features as a teaching / capstone project; adjust dates and behavior when you ship new modules.*
