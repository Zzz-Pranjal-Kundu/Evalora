# ER Diagrams (Text)

## Auth Service (`auth.db`)

```
users
-----
id            TEXT PK UUID
email         TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
role          TEXT NOT NULL  -- ADMIN | MANAGER | EMPLOYEE
created_at    TEXT NOT NULL
updated_at    TEXT NOT NULL
```

## User Service (`user.db`)

```
profiles
--------
user_id       TEXT PK  -- matches auth users.id
full_name     TEXT NOT NULL
department    TEXT
job_title     TEXT
manager_id    TEXT NULL  -- another user_id
preferences_json TEXT   -- JSON blob
created_at    TEXT NOT NULL
updated_at    TEXT NOT NULL
```

## Notification Service (`notification.db`)

```
notifications
---------------
id            TEXT PK UUID
user_id       TEXT NOT NULL INDEX
title         TEXT NOT NULL
body          TEXT NOT NULL
read          INTEGER NOT NULL DEFAULT 0
created_at    TEXT NOT NULL
```

## Performance Review Service (`performance.db`)

```
review_cycles
---------------
id            TEXT PK UUID
name          TEXT NOT NULL
start_date    TEXT NOT NULL
end_date      TEXT NOT NULL
status        TEXT NOT NULL  -- DRAFT | ACTIVE | CLOSED
created_at    TEXT NOT NULL

reviews
-------
id            TEXT PK UUID
cycle_id      TEXT FK -> review_cycles.id
employee_id   TEXT NOT NULL
reviewer_id   TEXT NOT NULL
status        TEXT NOT NULL  -- PENDING | SUBMITTED | APPROVED
rating        REAL NULL
summary       TEXT NULL
created_at    TEXT NOT NULL
updated_at    TEXT NOT NULL
```

## Feedback Service (`feedback.db`)

```
feedback_requests
-------------------
id            TEXT PK UUID
from_user_id  TEXT NOT NULL
to_user_id    TEXT NOT NULL
topic         TEXT NOT NULL
status        TEXT NOT NULL  -- OPEN | COMPLETED
created_at    TEXT NOT NULL

feedback_entries
------------------
id            TEXT PK UUID
request_id   TEXT FK -> feedback_requests.id
author_id    TEXT NOT NULL
content        TEXT NOT NULL
created_at     TEXT NOT NULL
```

## Goal Management Service (`goals.db`)

```
goals
-----
id            TEXT PK UUID
owner_id      TEXT NOT NULL INDEX
title         TEXT NOT NULL
description   TEXT
target_date   TEXT NULL
status        TEXT NOT NULL  -- ACTIVE | COMPLETED | CANCELLED
progress_pct  REAL NOT NULL DEFAULT 0
created_at    TEXT NOT NULL
updated_at    TEXT NOT NULL

milestones
----------
id            TEXT PK UUID
goal_id       TEXT FK -> goals.id
title         TEXT NOT NULL
due_date      TEXT NULL
completed     INTEGER NOT NULL DEFAULT 0
```

## Analytics Service (`analytics.db`)

```
metric_snapshots
------------------
id            TEXT PK UUID
metric_key    TEXT NOT NULL
dimensions_json TEXT  -- JSON
value         REAL NOT NULL
recorded_at   TEXT NOT NULL

events
------
id            TEXT PK UUID
event_type    TEXT NOT NULL
payload_json  TEXT NOT NULL
received_at   TEXT NOT NULL
```

**Cross-service relationships**: enforced in application logic (no cross-DB foreign keys).
