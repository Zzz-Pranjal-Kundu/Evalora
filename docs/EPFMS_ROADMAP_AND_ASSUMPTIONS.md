# EPFMS — roadmap, assumptions, and demo

## What was extended in this iteration

1. **API versioning**: Gateway serves the same router at `/api` (legacy) and **`/api/v1`** (preferred). Proxy logic strips `/api/v1` when forwarding to upstream domain services.
2. **RBAC**: Roles **`HR_ADMIN`**, **`LEADERSHIP`**, **`SUPER_ADMIN`** added alongside legacy **`ADMIN`**, **`MANAGER`**, **`EMPLOYEE`**. Gateway static permission map + `requirePermission` middleware; user-service privileged operations extended; Node analytics and performance services accept the same role rules as before.
3. **JWT refresh**: Auth service issues opaque refresh tokens (hashed at rest), **`POST /auth/refresh`**, gateway forwards it. Frontend stores `epfms_refresh` and exposes `refreshSession()`.
4. **AI insights service** (Node, port **8005**): Ten stub endpoints under `/ai/*` with **`X-Service-Key`** service-to-service auth. Gateway **`POST /api/v1/ai/...`** proxies with RBAC `ai:invoke` and forwards the user JWT for future audit.
5. **Dashboard placeholders**: `GET /api/v1/dashboards/manager|hr|leadership` return structured mock JSON until employee-service and warehouses exist.
6. **PostgreSQL DDL**: `backend/database/migrations/V001__postgresql_core.sql` — normalized core for the full product (users, employees, goals, feedback, reviews, calibration, audit, etc.). **Node auth still uses SQLite** for frictionless local dev; migrating Node to `pg` is a tracked next step.
7. **Frontend**: Role-based nav (HR hub, leadership, admin), scaffold routes for check-ins, org, competencies, calibration, development, recognition; `frontend/src/config/rbac.js` mirrors gateway rules for UX.
8. **Backend MVC (per microservice)**: Each Node service uses **`models/`** (SQLite access), **`services/`** (rules and orchestration), **`controllers/`** (HTTP routers / thin handlers), and **`views/`** (JSON DTO shaping where useful). Auth, user, and notification already followed this; performance, feedback, goals, analytics, and AI stubs were aligned to the same layout.

## Recommended target folder structure (incremental)

```
backend/
  services/
    employee-service/          # TODO: Node — org hierarchy, employment, policy fields
    workflow-service/        # TODO: approvals, SLA, scheduled jobs
    ai-insights-service/     # DONE (stubs: services/aiStubService + views/aiStubView)
  database/
    migrations/              # DONE V001 Postgres
frontend/
  src/
    features/              # TODO: colocate by domain (goals/, reviews/, …)
    components/ui/         # TODO: shared DataTable, Modal, FilterPanel
```

## Key assumptions

- **Single role per user** in JWT today (`roles: [role]`). Postgres schema supports **`user_roles`** for many-to-many when auth is migrated.
- **ADMIN** is treated as legacy HR/system admin; new installs should prefer **`HR_ADMIN`** / **`SUPER_ADMIN`**.
- **AI** endpoints return deterministic JSON until `LLMProvider` interface + secrets are configured.
- **Leadership** analytics must remain aggregated; raw peer feedback stays in feedback-service with visibility rules (to be enforced in APIs).

## Demo credentials (register locally)

There is no bundled password hash file for Postgres users. Use **Register** in the UI (or `POST /api/v1/auth/register`) with:

| Role            | Suggested email          | Notes                          |
|-----------------|--------------------------|--------------------------------|
| EMPLOYEE        | `employee@demo.local`    | Self-service goals & feedback  |
| MANAGER         | `manager@demo.local`     | Team reviews, AI invoke        |
| HR_ADMIN        | `hr@demo.local`          | HR hub, cycles, calibration UI |
| LEADERSHIP      | `exec@demo.local`        | Leadership dashboard           |
| SUPER_ADMIN     | `super@demo.local`       | Admin screen, full config path |

Use password **at least 8 characters** (e.g. `Demo1234!`).

## Recently completed (repo)

- **MVC layering** on domain Node services (models / services / controllers / views) and **demo seeds** refactored to use **`models/`** for performance-review and feedback (no raw SQL in those seed files).

## TODOs (enterprise hardening — backlog)

- Migrate **auth / user / notification** from SQLite to **PostgreSQL** using the provided DDL (or Prisma/Knex migrations).
- **Fine-grained permissions** from DB instead of `config/rbac.js` static map.
- **Employee-service**: canonical org + profile; replace profile-only user-service gradually.
- **Workflow engine**: deadlines, reminders, email/SMS adapters, outbox pattern.
- **OpenAPI**: aggregate gateway + services or publish from each repo in CI.
- **Standard error envelope** `{ error, message, details }` across all services.
- **Pagination** query params on list endpoints.
- **9-box**, succession, LMS webhooks — placeholders only until HR confirms scope.
