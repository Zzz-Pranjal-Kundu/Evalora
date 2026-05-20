# Sequence Flows (Text)

## 1) Signup → Profile

1. Client → Gateway: `POST /api/auth/register` (email, password, fullName, role?)
2. Gateway → Auth: `POST /auth/register`
3. Auth: hash password, insert `users`, return user id + tokens (or id only)
4. Gateway → User: `POST /internal/profiles` with `X-Internal-Key` (userId, fullName, …)
5. User: insert `profiles`
6. Gateway → Client: JWT + user summary

## 2) Login → Dashboard

1. Client → Gateway: `POST /api/auth/login`
2. Gateway → Auth: `POST /auth/login`
3. Auth: verify password, issue JWT
4. Client stores token; calls `GET /api/users/me/profile` with `Authorization`
5. Gateway validates JWT, proxies to User with user id header

## 3) Manager submits review

1. Client → Gateway: `POST /api/reviews` (JWT, role MANAGER or ADMIN)
2. Gateway → Performance service: forward JWT in `Authorization`
3. Performance: verify JWT (shared secret), check reviewer_id matches token or admin
4. Performance: insert `reviews`
5. Performance → Notification (HTTP): `POST /internal/notify` new review event
6. Notification: insert row for employee

## 4) Employee completes feedback

1. Client → Gateway: `POST /api/feedback/requests/:id/entries`
2. Gateway → Feedback service
3. Feedback: validate author allowed, append `feedback_entries`
4. Feedback → Analytics: `POST /internal/events` (optional) for trend pipeline

## 5) Analytics dashboard

1. Client → Gateway: `GET /api/analytics/dashboard` (ADMIN/MANAGER)
2. Gateway → Analytics
3. Analytics: aggregate `metric_snapshots` + recent `events`, return JSON for charts
