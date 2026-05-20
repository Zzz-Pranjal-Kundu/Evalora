# Employee Performance & Feedback Management System (EPFMS)

Microservices capstone: **Node.js (Express)** for auth, users, notifications, the **API gateway**, performance reviews, feedback, analytics, and AI insight stubs. The **React (Vite)** SPA talks **only** to the API gateway.

> **Dockerized stack:** one image (`Dockerfile` at repo root) runs every Node microservice plus nginx (built frontend). Compose (`docker-compose.yml`) starts a single container with SQLite data in volume `epfms_sqlite_data`. Optional Postgres-only compose remains under `backend/docker-compose.postgres.yml`.

## Repository layout

```
├── backend/
│   ├── database/migrations/       # PostgreSQL DDL (production target; V001 core schema)
│   ├── data/                      # Default SQLite files (shared path from service env defaults)
│   └── services/
│       ├── api-gateway/           # Express: routing, JWT, rate limit, orchestrated register
│       ├── auth-service/          # Express: signup/login, JWT, bcrypt, roles
│       ├── user-service/          # Express: profiles, internal provisioning
│       ├── notification-service/  # Express: in-app notifications + internal notify
│       ├── performance-review-service/ # Express: cycles + reviews (+ optional notify fan-out)
│       ├── feedback-service/      # Express: feedback requests + entries (+ analytics events)
│       ├── analytics-service/     # Express: events ingestion + manager/admin dashboard
│       └── ai-insights-service/   # Express: AI / NLP stubs (gateway proxies with X-Service-Key)
├── docs/                          # Architecture, ER diagrams, sequences, problem statement
├── docs/EPFMS_ROADMAP_AND_ASSUMPTIONS.md  # RBAC, AI service, Postgres, demo users, TODOs
├── frontend/                      # React + Vite SPA (gateway-only API access)
└── README.md
```

## Architecture (summary)

See `docs/ARCHITECTURE.md` for the full text diagram, `docs/ER_DIAGRAMS.md` for schemas, `docs/SEQUENCE_FLOWS.md` for flows, and `docs/PROBLEM_DEFINITION.md` for Phase 1.

## Ports

| Component | Port |
|-----------|------|
| API Gateway | 8080 |
| Auth Service | 3001 |
| User Service | 3002 |
| Notification Service | 3003 |
| Performance Review | 8001 |
| Feedback | 8002 |
| Analytics | 8004 |
| AI insights | 8005 |
| PostgreSQL (optional compose) | 5432 |
| React (Vite) | 5173 |
| React (Docker + Nginx, all-in-one image) | 80 |

## Docker quick start (full project)

From the repository root:

```powershell
docker compose up --build
```

Then open **`http://localhost`** — the SPA is served on port **80**, and the browser calls **`/api`** on the same origin (proxied to the API gateway inside the container). Swagger UI is available at **`http://localhost/api-docs/`**.

Direct gateway URL (optional): `http://localhost:8080/api`.

Run in background:

```powershell
docker compose up -d --build
```

Stop:

```powershell
docker compose down
```

Stop + remove SQLite volume data:

```powershell
docker compose down -v
```

### API base paths

- Preferred: **`http://localhost:8080/api/v1`** (set `VITE_API_BASE_URL` accordingly).
- Legacy: `http://localhost:8080/api` remains mounted for backward compatibility.

### AI service (local)

```powershell
cd backend\services\ai-insights-service
npm install
npm run start
```

Align **`AI_SERVICE_KEY`** in `backend/services/ai-insights-service/.env` (optional), **`backend/services/api-gateway/.env`**, and any future callers. Defaults match the gateway fallback (`epfms-local-ai-key-change-me`).

### PostgreSQL (optional)

```powershell
docker compose -f backend/docker-compose.postgres.yml up -d
psql postgresql://epfms:epfms@localhost:5432/epfms -f backend/database/migrations/V001__postgresql_core.sql
```

### Troubleshooting `npm run start:node`

**`EADDRINUSE` … port 3001 (or 3002 / 3003 / 8080)**  
An old Node process is still bound to that port (often from an earlier terminal). Close that terminal or kill the process:

```powershell
netstat -ano | findstr :3001
```

Note the **PID** in the last column, then:

```powershell
taskkill /PID <PID> /F
```

Repeat for `:3002`, `:3003`, `:8080` if needed.

**`Cannot find package 'express'` (gateway) or missing `node_modules`**  
Install deps for all Node services again from the repo root:

```powershell
npm run install:node-services
```

Or only one service, e.g. `npm install --prefix backend/services/user-service`.

**Gateway tries to use port 3001 (`EADDRINUSE` with auth)**  
`backend\services\api-gateway\.env` must **not** reuse the auth file. The gateway listens on **`GATEWAY_PORT`** (default **8080**). Copy from `backend\services\api-gateway\.env.example`, not from `auth-service`.

## Shared secrets (local dev)

Copy each service `.env.example` to `.env` and align these across **all** services:

- `JWT_SECRET` — must match everywhere JWTs are verified.
- `INTERNAL_SERVICE_KEY` — used by the gateway (user provisioning), notification `/internal/notify`, and analytics `/internal/events`.

## Step-by-step local setup

### 1) Prerequisites

- Node.js **22.5 or newer** (required for built-in `node:sqlite` in the Node services; avoids native `better-sqlite3` builds and Visual Studio).
- `npm`

**Windows / corporate TLS:** If `npm install` still fails downloading packages, your IT team may need to trust the corporate root CA in Node, or use `npm config set strict-ssl false` only as a temporary diagnostic (not recommended long term).

**PowerShell + npm:** If you see a prompt about `npm.ps1`, press **R** (Run once) or run `npm.cmd install` instead of `npm install`.

**OneDrive locks:** If you see `EPERM` during `npm install`, close other programs using `node_modules` or move the repo to a non-synced folder (OneDrive sometimes locks files).

### 2) One-command startup (recommended)

From the **repository root**:

```powershell
npm install
npm run install:node-services
npm run install:frontend
```

Then start everything with:

```powershell
npm run start:backend   # all Node microservices (gateway + domain ports 8001–8002 and 8004–8005)
npm run start:frontend  # frontend in one terminal
```

You can also run both from one terminal:

```powershell
npm run start:all
```

### Demo org (auto-seeded)

`backend/database/demo_org_seed.json` defines a **small Acme Corp demo** (about ten people): two teams (Engineering, Customer Success), clear **manager lines**, and **`defaultPassword`** (`Demo12345!`) for every account unless you add a per-user `password`. The `about` field in the JSON explains which roles can **create formal performance reviews** (managers, HR, leadership, super admin) versus **employees**, who primarily **view** their own review record and use feedback where the UI allows.

On each **auth-service** startup, demo accounts from the JSON are **synced**: missing emails are inserted; rows whose **id** matches the JSON get password and role refreshed from the file (so `demo_org_seed.json` stays the source of truth). If an email is already used by a **different** user id (e.g. self‑registered), that JSON row is skipped and logged.

Quick logins (all use `defaultPassword` unless you add a `password` field on a user in the JSON):

| Email | Role | Notes |
|--------|------|--------|
| `ops.admin@epfms.demo` | SUPER_ADMIN | Full admin surface |
| `dana.lead@epfms.demo` | LEADERSHIP | Exec; can manage formal reviews |
| `hr.pat@epfms.demo` | HR_ADMIN | People ops; can manage formal reviews |
| `maya.singh@epfms.demo` | MANAGER | Eng director; seeds sample review as manager |
| `jordan.cs@epfms.demo` | MANAGER | CS director |
| `liam.park@epfms.demo` | EMPLOYEE | Seeds as review subject (IC) |
| `nora.wu@epfms.demo`, `ava.lee@epfms.demo` | EMPLOYEE | Engineering ICs |
| `sam.rivera@epfms.demo`, `taylor.brook@epfms.demo` | EMPLOYEE | CS ICs |

Password for all rows above: **`Demo12345!`** (set in `defaultPassword` in the JSON).

User-service seeds **profiles** (including `team`); notification-service seeds **in-app notifications** for selected emails in `demoData`; performance, feedback, and analytics services attach **reviews, threads, and events** using `demoData` email references in the same JSON.

To re-seed from scratch, stop services and delete the SQLite files under `backend/data/` (or paths in each service `.env`), then start again. Edit `backend/database/demo_org_seed.json` to change hierarchy or add people.

Watch mode:

```powershell
npm run dev:backend
npm run start:frontend
```

Also copy each service’s `.env.example` → `.env` and keep shared secrets aligned (`JWT_SECRET`, `INTERNAL_SERVICE_KEY`, `AI_SERVICE_KEY`).

---

### 3) Node services — separate terminals (optional)

<details>
<summary>Per-service commands</summary>

```powershell
cd backend\services\auth-service
copy .env.example .env
npm install
npm run start
```

```powershell
cd backend\services\user-service
copy .env.example .env
npm install
npm run start
```

```powershell
cd backend\services\notification-service
copy .env.example .env
npm install
npm run start
```

```powershell
cd backend\services\api-gateway
copy .env.example .env
npm install
npm run start
```

</details>

### 4) Domain services (Node, ports 8001–8002 and 8004–8005)

From the repo root, `npm run install:node-services` installs gateway + all domain services. For a single service:

```powershell
cd backend\services\performance-review-service
npm install
npm run dev
```

Repeat for `feedback-service`, `analytics-service`, and `ai-insights-service` (see ports table). Or run everything with **`npm run dev:backend`** (all Node microservices including 8001–8002 and 8004–8005).

### 5) Frontend (manual, optional)

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. Register a user (optionally as **HR_ADMIN** or **SUPER_ADMIN**), sign in, and exercise flows through the gateway (`http://localhost:8080/api/v1`).

## API documentation

- Node services: `http://localhost:3001/api-docs` (auth), `3002/api-docs`, `3003/api-docs`, `8080/api-docs` (gateway). Domain APIs (8001–8002, 8004–8005) are JSON-only; use the gateway (`/api/performance`, `/api/feedback`, etc.) for Swagger-backed docs where exposed.

## Tests

```powershell
cd backend\services\auth-service; npm test
cd backend\services\api-gateway; npm test
cd backend\services\performance-review-service; npm test
```

## Docker notes

- **One `Dockerfile`** at the repository root: builds all services, runs them with **supervisord**, and serves the Vite app with **nginx** (see `docker/nginx.all-in-one.conf` and `docker/supervisord.conf`).
- **Compose** starts a single service `epfms` that maps ports **80** (UI + `/api` proxy), **8080** (gateway), and each backend port for debugging.
- Optional PostgreSQL only: `backend/docker-compose.postgres.yml` (for migration/testing flows).
