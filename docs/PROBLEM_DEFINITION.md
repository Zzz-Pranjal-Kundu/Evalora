# Phase 1 — Problem Definition

## Domain: Employee Performance and Feedback Management

### Actors

- **Administrator**: configures cycles, sees org-wide analytics, manages users indirectly (via profiles).
- **Manager**: conducts reviews for direct reports, requests feedback, tracks team goals, reads analytics for their scope.
- **Employee**: maintains profile, receives feedback, sets personal goals, views own reviews and notifications.

### Core Workflows

- **Feedback cycles**: time-boxed performance periods with formal reviews.
- **Reviews**: manager (or assigned reviewer) submits ratings and narrative summaries; employee is notified.
- **Ratings & summaries**: structured review records stored in the Performance Review service.
- **Goals**: employees (or managers on behalf of reports) define goals with milestones and progress.

### Pain Points (Traditional Monolith)

- Tight coupling causes risky all-or-nothing deployments.
- Scaling analytics or notifications forces scaling the entire application.
- Schema changes for one bounded context create regression risk for unrelated modules.

### Why Microservices

- **Bounded contexts** map cleanly to services (auth, user profile, reviews, feedback, goals, notifications, analytics).
- **Independent deployment** allows evolving analytics pipelines without touching authentication.
- **Data ownership** per service keeps transactional boundaries clear (SQLite files locally; dedicated DBs in production).
- **Fault tolerance**: optional degradation (e.g., analytics timeouts do not block login).
- **Security**: JWT at the edge (gateway) with per-service authorization rules.
