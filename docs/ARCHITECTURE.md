# Employee Performance & Feedback Management System — Architecture

## High-Level Architecture (Text Diagram)

```
                                    +------------------+
                                    |   React SPA      |
                                    | (Vite + Router)  |
                                    +--------+---------+
                                             |
                                             | HTTPS (dev: HTTP)
                                             v
+------------------+              +------------------------+
|  Optional Nginx  |  (not in v1)  |    API Gateway         |
|  reverse proxy   |              |  Node.js + Express     |
+------------------+              |  Port 8080             |
                                  |  JWT verify, routes,   |
                                  |  rate limit, aggregate |
                                  +-----------+------------+
                                              |
        +--------+--------+--------+----------+---------+---------+
        |        |        |        |                  |         |
        v        v        v        v                  v         v
 +-----------+ +-----------+ +-----------+   +-------------+ +-------+
 |   Auth    | |   User    | | Notification| | Performance| |Feedback|
 |  :3001    | |  :3002    | |   :3003     | | Review     | | :8002  |
 | Node.js   | | Node.js   | | Node.js     | | Node.js    | | Node.js |
 +-----------+ +-----------+ +-----------+   |   :8001    | +-------+
      |             |              |         +-------------+     |
      v             v              v               |              v
 [auth.db]    [user.db]    [notification.db] [perf.db]     [fb.db]
                                                        +-------------+
                                                        |  Analytics  |
                                                        |  :8004      |
                                                        |  Node.js    |
                                                        +------+------+
                                                               |
                                                         [analytics.db]
```

## Bounded Contexts

| Service | Owns |
|---------|------|
| **Auth** | Credentials, password hashes, JWT issuance, role claims |
| **User** | Profile, preferences, org metadata (no passwords) |
| **Performance Review** | Review cycles, review records, manager assignments |
| **Feedback** | 360 / peer feedback requests and responses |
| **Notification** | In-app notifications, delivery log |
| **Analytics** | Aggregates, trends, dashboard payloads (fed by events + reads) |
| **API Gateway** | Public routing, auth validation, cross-cutting concerns |

## Why Microservices (vs Monolith)

- **Independent deployment**: e.g. analytics can scale or change without redeploying auth.
- **Data ownership**: each service has its own SQLite DB file (replaceable with dedicated PostgreSQL per service in production).
- **Fault isolation**: gateway can degrade gracefully if a downstream service times out.
- **Node.js services**: Auth, users, notifications, gateway, performance, feedback, analytics, and AI stubs all run on Express with SQLite (per service) in the default local layout.

## Communication

- **Synchronous**: REST only between gateway ↔ services and service ↔ service where needed (internal API key).
- **Async (optional extension)**: Notification can be triggered via HTTP `POST` from other services (no RabbitMQ required for local run).

## Security

- JWT (HS256) shared secret across gateway and services that validate tokens.
- Internal endpoints protected with `X-Internal-Key` header.
- Role-based authorization enforced in each service’s controller/service layer.

## Observability

- Structured logging (Winston) per service.
- Health: `GET /health` on every service.
- OpenAPI: `/api-docs` on Node services where configured (gateway aggregates public routes).
