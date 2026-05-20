-- EPFMS core relational schema (PostgreSQL 15+).
-- Apply: psql "$DATABASE_URL" -f database/migrations/V001__postgresql_core.sql
-- Node services may still use SQLite locally; this DDL is the production target.

BEGIN;

CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id        UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id  UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES departments(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_units (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  employee_number  TEXT UNIQUE,
  full_name        TEXT NOT NULL,
  job_title        TEXT,
  grade            TEXT,
  department_id    UUID REFERENCES departments(id),
  business_unit_id UUID REFERENCES business_units(id),
  location_id      UUID REFERENCES locations(id),
  employment_status TEXT NOT NULL DEFAULT 'ACTIVE',
  hire_date        DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reporting_relationships (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  manager_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'DIRECT',
  effective_from  DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to    DATE,
  UNIQUE (employee_id, relationship_type, effective_from)
);

CREATE TABLE IF NOT EXISTS goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  period         TEXT NOT NULL,
  weight         NUMERIC(5,2),
  target_date    DATE,
  status         TEXT NOT NULL DEFAULT 'NOT_STARTED',
  progress_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
  parent_goal_id UUID REFERENCES goals(id),
  scope          TEXT NOT NULL DEFAULT 'INDIVIDUAL',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goal_updates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  note       TEXT,
  progress_pct NUMERIC(5,2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goal_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id),
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goal_approvals (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES users(id),
  status     TEXT NOT NULL,
  comment    TEXT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id),
  to_user_id   UUID REFERENCES users(id),
  body         TEXT NOT NULL,
  visibility   TEXT NOT NULL DEFAULT 'PRIVATE',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id   UUID NOT NULL REFERENCES users(id),
  topic        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'OPEN',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback_entries(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checkins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id  UUID NOT NULL REFERENCES users(id),
  employee_id UUID NOT NULL REFERENCES users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status      TEXT NOT NULL DEFAULT 'SCHEDULED',
  mood        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkin_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  author_id  UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkin_actions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  due_date   DATE,
  status     TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_cycles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  cycle_type  TEXT NOT NULL DEFAULT 'ANNUAL',
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'DRAFT',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  json_schema JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_sections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES review_templates(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS review_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id    UUID NOT NULL REFERENCES review_cycles(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  role        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'PENDING',
  UNIQUE (cycle_id, employee_id, reviewer_id, role)
);

CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id    UUID NOT NULL REFERENCES review_cycles(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  status      TEXT NOT NULL DEFAULT 'DRAFT',
  rating      NUMERIC(4,2),
  summary     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_responses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  section_id UUID REFERENCES review_sections(id),
  payload    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviewer_nominations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id    UUID NOT NULL REFERENCES review_cycles(id),
  subject_id  UUID NOT NULL REFERENCES employees(id),
  nominee_id  UUID NOT NULL REFERENCES employees(id),
  status      TEXT NOT NULL DEFAULT 'PENDING',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competencies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competency_mappings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id  UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  job_family     TEXT,
  proficiency_level INT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_competency_assessments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  competency_id  UUID NOT NULL REFERENCES competencies(id),
  score          NUMERIC(4,2),
  assessed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rating_scales (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  definition JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rating_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL,
  subject_id   UUID NOT NULL,
  scale_id     UUID REFERENCES rating_scales(id),
  value        NUMERIC(6,3),
  recorded_by  UUID REFERENCES users(id),
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calibration_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id   UUID NOT NULL REFERENCES review_cycles(id),
  name       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calibration_adjustments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES calibration_sessions(id) ON DELETE CASCADE,
  employee_id  UUID NOT NULL REFERENCES employees(id),
  from_rating  NUMERIC(4,2),
  to_rating    NUMERIC(4,2),
  rationale    TEXT,
  adjusted_by  UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS development_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS development_actions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id    UUID NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  due_date   DATE,
  status     TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recognitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id),
  to_user_id   UUID REFERENCES users(id),
  message      TEXT NOT NULL,
  badge        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type  TEXT NOT NULL,
  owner_id    UUID NOT NULL,
  storage_url TEXT NOT NULL,
  mime_type   TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id  UUID REFERENCES users(id),
  action    TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_owner ON goals(owner_employee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_cycle ON reviews(cycle_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

COMMIT;
