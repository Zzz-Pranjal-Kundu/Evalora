import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pre-hashed bcrypt value for "Demo12345!" with 12 rounds
const DEFAULT_PASSWORD_HASH = "$2a$12$vI5vC.BvM3tZ8m9B8uW.hOQOymjD2Pec5u/tT1mO5cTpyqC1c3WwS";

// 1. Declare Mongoose Schemas & Models
const RoleSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  label: { type: String, required: true }
}, { versionKey: false });
const Role = mongoose.model("Role", RoleSchema, "roles");

const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, required: true },
  created_at: { type: String, required: true },
  updated_at: { type: String, required: true }
}, { versionKey: false });
const User = mongoose.model("User", UserSchema, "users");

const ProfileSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  user_id: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  department: { type: String, default: null },
  job_title: { type: String, default: null },
  manager_id: { type: String, default: null },
  team: { type: String, default: null },
  preferences_json: { type: String, default: null },
  created_at: { type: String, required: true },
  updated_at: { type: String, required: true }
}, { versionKey: false });
const Profile = mongoose.model("Profile", ProfileSchema, "profiles");

const ReviewCycleSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  start_date: { type: String, required: true },
  end_date: { type: String, required: true },
  status: { type: String, default: "DRAFT" },
  created_at: { type: String, required: true }
}, { versionKey: false });
const ReviewCycle = mongoose.model("ReviewCycle", ReviewCycleSchema, "review_cycles");

const ReviewSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  cycle_id: { type: String, required: true },
  employee_id: { type: String, required: true },
  reviewer_id: { type: String, required: true },
  status: { type: String, required: true },
  rating: { type: Number, default: 0 },
  summary: { type: String, default: "" },
  visibility: { type: String, default: "participants_only" },
  created_at: { type: String, required: true },
  updated_at: { type: String, required: true }
}, { versionKey: false });
const Review = mongoose.model("Review", ReviewSchema, "reviews");

const FeedbackRequestSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  from_user_id: { type: String, required: true },
  to_user_id: { type: String, required: true },
  topic: { type: String, required: true },
  status: { type: String, default: "OPEN" },
  visibility: { type: String, default: "with_managers" },
  created_at: { type: String, required: true }
}, { versionKey: false });
const FeedbackRequest = mongoose.model("FeedbackRequest", FeedbackRequestSchema, "feedback_requests");

const FeedbackEntrySchema = new mongoose.Schema({
  _id: { type: String, required: true },
  request_id: { type: String, required: true },
  author_id: { type: String, required: true },
  content: { type: String, required: true },
  created_at: { type: String, required: true }
}, { versionKey: false });
const FeedbackEntry = mongoose.model("FeedbackEntry", FeedbackEntrySchema, "feedback_entries");

const RecognitionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  from_user_id: { type: String, required: true },
  to_user_id: { type: String, required: true },
  value_tag: { type: String, required: true },
  message: { type: String, required: true },
  visibility: { type: String, default: "org_feed" },
  created_at: { type: String, required: true }
}, { versionKey: false });
const Recognition = mongoose.model("Recognition", RecognitionSchema, "recognitions");

const NotificationSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  user_id: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  read: { type: Number, default: 0 },
  created_at: { type: String, required: true }
}, { versionKey: false });
const Notification = mongoose.model("Notification", NotificationSchema, "notifications");

const EventSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  event_type: { type: String, required: true },
  payload_json: { type: String, required: true },
  received_at: { type: String, required: true }
}, { versionKey: false });
const Event = mongoose.model("Event", EventSchema, "events");

const MetricSnapshotSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  metric_key: { type: String, required: true },
  dimensions_json: { type: String, required: true },
  value: { type: Number, required: true },
  recorded_at: { type: String, required: true }
}, { versionKey: false });
const MetricSnapshot = mongoose.model("MetricSnapshot", MetricSnapshotSchema, "metric_snapshots");

function getEnvDatabaseUrl() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.resolve(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      if (key.trim() === 'MONGODB_URI' || key.trim() === 'DATABASE_URL') {
        let value = valueParts.join('=').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        return value;
      }
    }
  }
  return "mongodb+srv://evaloraDB:GA75VaixhPv7Fhfm@cluster0.xuguph2.mongodb.net/epfms?retryWrites=true&w=majority&appName=Cluster0";
}

async function main() {
  console.log("🌱 Starting Mongoose Database Seeding with rich organizational dataset...");

  const uri = getEnvDatabaseUrl();
  console.log(`🔌 Connecting natively to MongoDB Atlas: ${uri.replace(/:([^@]+)@/, ":******@")}`);
  await mongoose.connect(uri);

  const seedPath = path.resolve(__dirname, '..', '..', 'database', 'demo_org_seed.json');
  if (!fs.existsSync(seedPath)) {
    console.error(`❌ demo_org_seed.json not found at ${seedPath}`);
    process.exit(1);
  }
  const org = JSON.parse(fs.readFileSync(seedPath, "utf8"));

  // 2. Clear Existing Collections
  console.log("🧹 Wiping existing collections...");
  await Role.deleteMany({});
  await User.deleteMany({});
  await Profile.deleteMany({});
  await ReviewCycle.deleteMany({});
  await Review.deleteMany({});
  await FeedbackRequest.deleteMany({});
  await FeedbackEntry.deleteMany({});
  await Recognition.deleteMany({});
  await Notification.deleteMany({});
  await Event.deleteMany({});
  await MetricSnapshot.deleteMany({});

  // 3. Seed Roles
  console.log("👥 Seeding Roles...");
  const roles = org.roles || ['SUPER_ADMIN', 'LEADERSHIP', 'HR_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'];
  for (const code of roles) {
    const label = code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    await Role.create({ code, label });
  }

  // 4. Seed Users and Profiles
  console.log("👩‍💼 Seeding Users and Employee Profiles...");
  for (const u of org.users) {
    const now = new Date().toISOString();
    const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Demo User';
    
    await User.create({
      _id: u.id,
      email: u.email.trim().toLowerCase(),
      password_hash: DEFAULT_PASSWORD_HASH,
      role: u.role,
      created_at: now,
      updated_at: now
    });

    await Profile.create({
      _id: u.id,
      user_id: u.id,
      full_name: fullName,
      department: u.department || null,
      job_title: u.title || null,
      manager_id: u.managerId || null,
      team: u.team || null,
      preferences_json: JSON.stringify({ theme: "dark", emailNotifications: true }),
      created_at: now,
      updated_at: now
    });
  }

  // 5. Seed Review Cycles
  console.log("📅 Seeding Review Cycles...");
  const cycle2025Id = "c2025-cycle-uuid-000000000001";
  const cycle2026Id = "c2026-cycle-uuid-000000000002";
  const nowStr = new Date().toISOString();

  await ReviewCycle.create({
    _id: cycle2025Id,
    name: "Annual Performance Cycle 2025",
    start_date: "2025-01-01",
    end_date: "2025-12-31",
    status: "COMPLETED",
    created_at: "2025-01-02T09:00:00.000Z"
  });

  await ReviewCycle.create({
    _id: cycle2026Id,
    name: "Mid-Year Review 2026",
    start_date: "2026-06-01",
    end_date: "2026-07-31",
    status: "ACTIVE",
    created_at: nowStr
  });

  // 6. Seed Performance Reviews
  console.log("✍️ Seeding Reviews...");
  // Liam Park (Senior Software Engineer)
  const liamId = "11111111-1111-4111-8111-111111111106";
  // Maya Singh (Director of Engineering)
  const mayaId = "11111111-1111-4111-8111-111111111104";
  // Nora Wu (Software Engineer)
  const noraId = "11111111-1111-4111-8111-111111111107";
  // Dana Lead (COO / Leadership)
  const danaId = "11111111-1111-4111-8111-111111111102";

  // 2025 Completed Reviews
  await Review.create({
    _id: randomUUID(),
    cycle_id: cycle2025Id,
    employee_id: liamId,
    reviewer_id: mayaId,
    status: "SUBMITTED",
    rating: 4.7,
    summary: "Liam exceeded all expectations in driving our platform modularity and database migrations. His collaborative approach and clear documentation have upskilled the entire engineering pod.",
    visibility: "with_managers",
    created_at: "2025-12-15T15:00:00.000Z",
    updated_at: "2025-12-20T10:30:00.000Z"
  });

  await Review.create({
    _id: randomUUID(),
    cycle_id: cycle2025Id,
    employee_id: noraId,
    reviewer_id: mayaId,
    status: "SUBMITTED",
    rating: 4.2,
    summary: "Nora has shown outstanding growth in front-end aesthetics. Her execution on user interfaces was excellent.",
    visibility: "with_managers",
    created_at: "2025-12-16T11:00:00.000Z",
    updated_at: "2025-12-19T14:45:00.000Z"
  });

  // 2026 In-Progress Reviews
  await Review.create({
    _id: randomUUID(),
    cycle_id: cycle2026Id,
    employee_id: liamId,
    reviewer_id: mayaId,
    status: "UNDER_REVIEW",
    rating: 4.5,
    summary: "Consistent strong execution on the core infrastructure. Continue driving mentoring of junior devs and leading by example.",
    visibility: "with_managers",
    created_at: nowStr,
    updated_at: nowStr
  });

  await Review.create({
    _id: randomUUID(),
    cycle_id: cycle2026Id,
    employee_id: noraId,
    reviewer_id: mayaId,
    status: "DRAFT",
    rating: 0,
    summary: "Drafting progress on Nora's achievements in the React component restructure.",
    visibility: "participants_only",
    created_at: nowStr,
    updated_at: nowStr
  });

  // 7. Seed Peer Feedback requests & Entries
  console.log("💬 Seeding Feedback requests and entries...");
  const feedbackReq1 = "freq-uuid-00000000000000000001";
  await FeedbackRequest.create({
    _id: feedbackReq1,
    from_user_id: liamId,
    to_user_id: noraId,
    topic: "360 Peer Feedback: Q1 UI Restructuring Coordination",
    status: "COMPLETED",
    visibility: "with_managers",
    created_at: "2026-03-10T10:00:00.000Z"
  });

  await FeedbackEntry.create({
    _id: randomUUID(),
    request_id: feedbackReq1,
    author_id: noraId,
    content: "Liam was highly helpful when aligning our frontend API payloads with the updated auth-service. He helped refactor two pages quickly.",
    created_at: "2026-03-12T14:00:00.000Z"
  });

  const feedbackReq2 = "freq-uuid-00000000000000000002";
  await FeedbackRequest.create({
    _id: feedbackReq2,
    from_user_id: noraId,
    to_user_id: mayaId,
    topic: "Continuous Feedback — Seeking mentoring suggestions for system design",
    status: "OPEN",
    visibility: "with_managers",
    created_at: nowStr
  });

  // 8. Seed kudos and recognitions
  console.log("🏆 Seeding Kudos & Recognitions...");
  await Recognition.create({
    _id: randomUUID(),
    from_user_id: mayaId,
    to_user_id: liamId,
    value_tag: "OUTSTANDING_DELIVERY",
    message: "A massive shoutout to Liam for spearheading our microservices migration to MongoDB Atlas cleanly and ahead of schedule!",
    visibility: "org_feed",
    created_at: nowStr
  });

  await Recognition.create({
    _id: randomUUID(),
    from_user_id: liamId,
    to_user_id: noraId,
    value_tag: "TEAMWORK",
    message: "Thanks Nora for aligning so smoothly on the RBAC client-side guard fixes! Fantastic collaboration.",
    visibility: "org_feed",
    created_at: nowStr
  });

  // 9. Seed Telemetry & Analytics Events
  console.log("📊 Seeding Telemetry Events & Metric Snapshots...");
  const eventTypes = ["auth.login", "performance.review_submitted", "feedback.requested", "recognition.created"];
  const departments = ["Engineering", "Sales", "Product", "Support", "Marketing", "Finance", "IT"];
  
  // Seed 40 random telemetry events across past month
  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const eventDate = new Date(Date.now() - daysAgo * 24 * 3600000).toISOString();
    const type = eventTypes[i % eventTypes.length];
    
    await Event.create({
      _id: randomUUID(),
      event_type: type,
      payload_json: JSON.stringify({
        user_id: liamId,
        department: departments[i % departments.length],
        ip: "192.168.1.55"
      }),
      received_at: eventDate
    });

    await MetricSnapshot.create({
      _id: randomUUID(),
      metric_key: `event_count:${type}`,
      dimensions_json: JSON.stringify({ department: departments[i % departments.length] }),
      value: 1,
      recorded_at: eventDate
    });
  }

  // Seed baseline rating snapshots per department
  const baseRatings = { Engineering: 4.5, Sales: 4.1, Product: 4.6, Support: 3.8, Marketing: 4.2 };
  for (const [dept, rating] of Object.entries(baseRatings)) {
    await MetricSnapshot.create({
      _id: randomUUID(),
      metric_key: "department_avg_rating",
      dimensions_json: JSON.stringify({ department: dept }),
      value: rating,
      recorded_at: nowStr
    });
  }

  console.log("✨ Mongoose-based database seeding completed successfully! All data is fully alive.");
}

main()
  .catch(err => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
