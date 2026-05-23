# Evalora: Employee Performance & Feedback Management System (EPFMS)

Evalora is a modern, enterprise-grade Microservices Performance & Feedback platform designed for modern corporate organizations. Built with a high-performance **React + Vite** frontend SPA and **7 Node.js (Express) backend microservices**, the entire architecture communicates through a unified **API Gateway** acting as the primary security boundary.

---

## 🌟 Architectural Overview

1. **MongoDB Atlas Integration**: The backend has been migrated from local SQLite files to a secure cloud database hosted on **MongoDB Atlas** using **Mongoose** connection drivers.
2. **Unified MonoRepo Workspace System**: Uses npm workspaces (`package.json`) to manage global packages and microservices, including a centralized shared package (`@epfms/database`) for Mongoose schema definitions.
3. **Robust RBAC Security Boundaries**:
   * **Consolidated Frontend guards**: Consolidated RBAC guards inside `frontend/src/config/rbac.js` for role checking, with JSDoc-deprecated legacy `ADMIN` warnings.
   * **Route Redirection Security**: Stripped `deniedPath` from route navigation state in React Router to prevent cross-site history leaks.
   * **Gateway Access Control**: Authoritative path authorization Express middleware inside the API Gateway enforcing strict permission checks before proxying requests downstream.
4. **All-in-One Production Containerization**: Uses a modular `Dockerfile` executing Nginx (serving the static React build on port 80) and Supervisor (running all Express microservices concurrently) as a single, lightweight container. **Perfect for deploying 100% free on Render or Koyeb!**

---

## 📁 Repository Structure

```text
├── backend/
│   ├── packages/
│   │   └── database/              # Centralized Mongoose seeding suite (seed.js + JSON raw data)
│   └── services/
│       ├── api-gateway/           # Node Express: API entrypoint, global JWT & RBAC verification middleware
│       ├── auth-service/          # Node Express: signup/login, token hashes, role management
│       ├── user-service/          # Node Express: employee profiles, public kudos & recognition feeds
│       ├── notification-service/  # Node Express: real-time alert logs & automated notifications
│       ├── performance-review-service/ # Node Express: review cycle generation, manager evaluations
│       ├── feedback-service/      # Node Express: peer-to-peer 360 feedback requests & submissions
│       ├── analytics-service/     # Node Express: event telemetry logging & chart aggregates
│       └── ai-insights-service/   # Node Express: NLP stubs for performance summaries
├── docs/                          # Architecture maps, database diagrams, sequence charts
├── frontend/                      # React + Vite Premium Single Page Application (only talks to API Gateway)
├── Dockerfile                     # Unified multi-service + Nginx production builder
└── README.md                      # Comprehensive developer handbook
```

---

## 🖥️ System Port Allocations

| Service / Component | Protocol / Port | Purpose |
| :--- | :--- | :--- |
| **Public Entrance (Nginx)** | `HTTP / 80` | Serves compiled React assets + proxies `/api/*` requests |
| **API Gateway** | `HTTP / 8080` | Orchestrates global traffic & runs JWT/RBAC middleware |
| **Auth Service** | `HTTP / 3001` | Processes JWT generation, refresh cycles, & registrations |
| **User Service** | `HTTP / 3002` | Manages profiles, department org charts, & recognition boards |
| **Notification Service** | `HTTP / 3003` | Houses real-time system alert feeds |
| **Performance Review** | `HTTP / 8001` | Evaluates employee ratings, draft reviews, & formal submissions |
| **Feedback Service** | `HTTP / 8002` | Manages peer 360-degree questionnaire threads |
| **Analytics Service** | `HTTP / 8004` | Tracks system telemetry, logins, & performance distributions |
| **AI Insights Service** | `HTTP / 8005` | Generates advanced summary analysis for manager dashboards |
| **React Development** | `HTTP / 5173` | Local Vite HMR development server |

---

## 👥 Seeded Demo Organization Accounts

Your cloud MongoDB Atlas database is pre-seeded with a comprehensive corporate catalog containing reporting lines, evaluation cycles, reviews, and event telemetry.

All accounts use the unified password: **`Demo12345!`**

| Email Profile | Assigned Role | Platform Scopes & Dashboard Features |
| :--- | :--- | :--- |
| **`ops.admin@epfms.demo`** | `SUPER_ADMIN` | Root level access. Can manage configurations, view system telemetry, and inspect logs. |
| **`dana.lead@epfms.demo`** | `LEADERSHIP` | Executive dashboard. Access to company-wide performance stats, global calibration grids, and strategic goals. |
| **`hr.pat@epfms.demo`** | `HR_ADMIN` | People Operations dashboard. Can create performance cycles, review calibration curves, and manage organizational trees. |
| **`maya.singh@epfms.demo`** | `MANAGER` | Manager workspace. Views direct report profiles, writes performance appraisals, and manages peer review cycles. |
| **`jordan.cs@epfms.demo`** | `MANAGER` | Customer Success Team Manager workspace. Handles direct reports and approves peer feedback threads. |
| **`liam.park@epfms.demo`** | `EMPLOYEE` | Individual Contributor interface. Submits self-evaluations, sends public kudos (Kudos board), and answers peer feedback. |
| **`nora.wu@epfms.demo`** | `EMPLOYEE` | Engineering team member. Features feedback submission and self-appraisal cycles. |
| **`ava.lee@epfms.demo`** | `EMPLOYEE` | Frontend Engineer. Active participant in team recognition boards and appraisal schedules. |

---

## 🚀 Step-by-Step Local Workspace Setup

### 1. Prerequisites
* **Node.js**: Version `22.5.0` or newer.
* **NPM**: Version `10.0.0` or newer.
* **MongoDB**: A running cloud MongoDB Atlas cluster (a secure connection is pre-configured for instant live operation!).

### 2. Dependency Installation
Execute this from the **repository root** to download dependencies for the workspaces and compile frontend assets:
```powershell
# Install root workspaces dependencies
npm install

# Install individual packages and microservices dependencies
npm run install:node-services

# Install React frontend dependencies
npm run install:frontend
```

### 3. Populating the Cloud Database (Seeding)
To reset and seed your database natively with our Mongoose-based rich dataset, run the seeder:
```powershell
cd backend/packages/database
node seed.js
cd ../../..
```

### 4. Running the Entire Application Locally
Start the React frontend development server and all 8 backend microservices concurrently from one terminal:
```powershell
npm run start:all
```
* **Frontend**: `http://localhost:5173`
* **API Gateway**: `http://localhost:8080/api/v1`
* **Swagger API Documentation**: `http://localhost:8080/api-docs`

---

## ☁️ Continuous Production Cloud Deployment (Free Tier)

Since Evalora features a production-ready **Nginx + Supervisor all-in-one Docker configuration**, you can deploy the entire stack completely for free on **Render** without requiring multiple paid hosting servers:

1. **GitHub Commit**: Commit your changes and push them to your repository:
   ```powershell
   git add .
   git commit -m "feat: complete Mongoose cloud migration and RBAC security fixes"
   git push origin main
   ```
2. **Setup on Render**:
   * Create a free account at [render.com](https://render.com/).
   * Click **New** -> **Web Service** -> Link your GitHub repository.
   * **Language**: Select **Docker** (Render will automatically compile both your frontend assets and backend microservices under the root `Dockerfile`).
   * **Instance Type**: Choose **Free** ($0/month, 512MB RAM).
   * **Environment Variables**: Add a new environment variable:
     * **Key**: `MONGODB_URI`
     * **Value**: *Your MongoDB Atlas cluster URI*
3. **Deploy!**: Click **Create Web Service**. Your live production URL will be ready in under 5 minutes!

---

## 🧪 Running Test Suites

Execute integration and security assertion tests inside each package:
```powershell
# Verify API Gateway security rules & path routing
cd backend/services/api-gateway
npm test

# Verify Authentication claims
cd ../auth-service
npm test
```
