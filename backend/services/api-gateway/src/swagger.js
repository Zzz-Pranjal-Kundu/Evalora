const bearerAuth = { bearerAuth: [] };
const bearerScheme = {
  bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
};

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "EPFMS API Gateway",
    version: "1.0.0",
    description:
      "Single entry point for the Employee Performance & Feedback Management System. All routes are proxied to the relevant microservice after JWT validation.",
  },
  servers: [{ url: "http://localhost:8080", description: "Local dev" }],
  components: {
    securitySchemes: bearerScheme,
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "liam.park@epfms.demo" },
          password: { type: "string", example: "Demo12345!" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
          fullName: { type: "string", example: "Jane Doe" },
          role: {
            type: "string",
            enum: ["EMPLOYEE", "MANAGER", "HR_ADMIN", "LEADERSHIP", "SUPER_ADMIN"],
            default: "EMPLOYEE",
          },
          department: { type: "string" },
          jobTitle: { type: "string" },
          team: { type: "string" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
            },
          },
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          userId: { type: "string" },
          fullName: { type: "string" },
          email: { type: "string" },
          jobTitle: { type: "string" },
          department: { type: "string" },
          team: { type: "string" },
          managerId: { type: "string", nullable: true },
        },
      },
      ReviewCycle: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          status: { type: "string" },
        },
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "string" },
          cycle_id: { type: "string" },
          employee_id: { type: "string" },
          reviewer_id: { type: "string" },
          rating: { type: "number", minimum: 1, maximum: 5 },
          summary: { type: "string" },
          status: { type: "string", enum: ["DRAFT", "SUBMITTED", "ACKNOWLEDGED"] },
          visibility: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      FeedbackRequest: {
        type: "object",
        properties: {
          id: { type: "string" },
          fromUserId: { type: "string" },
          toUserId: { type: "string" },
          topic: { type: "string" },
          visibility: { type: "string" },
          entries: { type: "array", items: { type: "object" } },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          type: { type: "string" },
          message: { type: "string" },
          read: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AnalyticsDashboard: {
        type: "object",
        properties: {
          events: { type: "array", items: { type: "object" } },
          summary: { type: "object" },
        },
      },
      Recognition: {
        type: "object",
        properties: {
          id: { type: "string" },
          fromUserId: { type: "string" },
          toUserId: { type: "string", nullable: true },
          valueTag: { type: "string" },
          message: { type: "string" },
          visibility: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  tags: [
    { name: "Auth", description: "Register, login, token refresh, current user" },
    { name: "Users", description: "Profiles, directory, recognitions" },
    { name: "Performance Reviews", description: "Review cycles and formal review records" },
    { name: "Feedback", description: "360° feedback requests and responses" },
    { name: "Notifications", description: "In-app notification inbox" },
    { name: "Analytics", description: "Event-driven analytics and dashboards" },
    { name: "AI Insights", description: "AI/NLP helper stubs (require ai:invoke permission)" },
    { name: "Dashboards", description: "Aggregated role-specific dashboards" },
  ],
  paths: {
    /* ── AUTH ── */
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user account",
        description:
          "Creates an auth record and provisions a user profile. On success returns a JWT access token and refresh token.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: {
          201: { description: "Account created", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          400: { description: "Validation error" },
          409: { description: "Email already registered" },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email and password",
        description: "Returns a JWT access token valid for 8 hours and a refresh token.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          200: { description: "Login successful", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "New access token issued" },
          401: { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        security: [bearerAuth],
        responses: {
          200: { description: "Current user object" },
          401: { description: "Unauthorized" },
        },
      },
    },

    /* ── USERS / PROFILES ── */
    "/api/v1/users/profiles/me": {
      get: {
        tags: ["Users"],
        summary: "Get my profile",
        security: [bearerAuth],
        responses: {
          200: { description: "User profile", content: { "application/json": { schema: { $ref: "#/components/schemas/UserProfile" } } } },
          401: { description: "Unauthorized" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update my profile",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fullName: { type: "string" },
                  jobTitle: { type: "string" },
                  department: { type: "string" },
                  team: { type: "string" },
                  bio: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Profile updated" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/users/directory": {
      get: {
        tags: ["Users"],
        summary: "Get org directory (all employee profiles)",
        security: [bearerAuth],
        responses: {
          200: { description: "Array of user profiles", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserProfile" } } } } },
        },
      },
    },
    "/api/v1/users/profiles": {
      get: {
        tags: ["Users"],
        summary: "Get all profiles (managers/HR/admin only)",
        security: [bearerAuth],
        parameters: [
          { in: "query", name: "department", schema: { type: "string" } },
          { in: "query", name: "team", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Array of profiles" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/v1/users/profiles/{userId}/manager": {
      patch: {
        tags: ["Users"],
        summary: "Assign a manager to a user",
        security: [bearerAuth],
        parameters: [{ in: "path", name: "userId", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { managerId: { type: "string" } } } } },
        },
        responses: {
          200: { description: "Manager assigned" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/v1/users/recognitions/feed": {
      get: {
        tags: ["Users"],
        summary: "Get org-wide recognition feed",
        security: [bearerAuth],
        responses: {
          200: { description: "Recognition feed", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Recognition" } } } } },
        },
      },
    },
    "/api/v1/users/recognitions": {
      post: {
        tags: ["Users"],
        summary: "Post a recognition shoutout",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["valueTag", "message"],
                properties: {
                  toUserId: { type: "string", nullable: true, description: "Recipient user ID (omit for org-wide post)" },
                  valueTag: { type: "string", example: "Innovation" },
                  message: { type: "string", example: "Great work on the dashboard!" },
                  visibility: { type: "string", enum: ["org_feed", "private"], default: "org_feed" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Recognition created" },
        },
      },
    },

    /* ── PERFORMANCE REVIEWS ── */
    "/api/v1/performance/cycles": {
      get: {
        tags: ["Performance Reviews"],
        summary: "List all review cycles",
        security: [bearerAuth],
        responses: {
          200: { description: "Array of cycles", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ReviewCycle" } } } } },
        },
      },
      post: {
        tags: ["Performance Reviews"],
        summary: "Create a review cycle (manager/HR/admin)",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Q2 2026 Review" },
                  startDate: { type: "string", format: "date" },
                  endDate: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Cycle created" },
        },
      },
    },
    "/api/v1/performance/reviews": {
      get: {
        tags: ["Performance Reviews"],
        summary: "List reviews (filtered by role — employees see own, managers see team)",
        security: [bearerAuth],
        responses: {
          200: { description: "Array of reviews", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Review" } } } } },
        },
      },
      post: {
        tags: ["Performance Reviews"],
        summary: "Create a performance review",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["cycleId", "employeeId", "rating", "summary"],
                properties: {
                  cycleId: { type: "string" },
                  employeeId: { type: "string" },
                  reviewerId: { type: "string" },
                  rating: { type: "number", minimum: 1, maximum: 5, example: 4.2 },
                  summary: { type: "string", example: "Consistently delivers quality work." },
                  status: { type: "string", enum: ["DRAFT", "SUBMITTED"], default: "SUBMITTED" },
                  visibility: { type: "string", default: "participants_only" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Review created" },
          403: { description: "Not authorized to create reviews" },
        },
      },
    },
    "/api/v1/performance/reviews/{id}": {
      patch: {
        tags: ["Performance Reviews"],
        summary: "Update a review (reviewer or HR/admin only)",
        security: [bearerAuth],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  rating: { type: "number" },
                  summary: { type: "string" },
                  status: { type: "string" },
                  visibility: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Review updated" },
          403: { description: "Forbidden" },
          404: { description: "Not found" },
        },
      },
    },

    /* ── FEEDBACK ── */
    "/api/v1/feedback/requests": {
      get: {
        tags: ["Feedback"],
        summary: "List feedback requests involving me",
        security: [bearerAuth],
        responses: {
          200: { description: "Array of feedback requests", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/FeedbackRequest" } } } } },
        },
      },
      post: {
        tags: ["Feedback"],
        summary: "Create a feedback request",
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["toUserId", "topic"],
                properties: {
                  toUserId: { type: "string", description: "User being asked for feedback" },
                  topic: { type: "string", example: "360° — Peer: Communication in sprint planning" },
                  visibility: { type: "string", default: "with_managers" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Feedback request created" },
        },
      },
    },
    "/api/v1/feedback/requests/{id}/entries": {
      post: {
        tags: ["Feedback"],
        summary: "Submit a feedback response",
        security: [bearerAuth],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, description: "Feedback request ID" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string", example: "Great communicator — always clear and concise." },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Feedback submitted" },
        },
      },
    },

    /* ── NOTIFICATIONS ── */
    "/api/v1/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Get my notification inbox",
        security: [bearerAuth],
        responses: {
          200: { description: "Array of notifications", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Notification" } } } } },
        },
      },
    },
    "/api/v1/notifications/{id}/read": {
      post: {
        tags: ["Notifications"],
        summary: "Mark a single notification as read",
        security: [bearerAuth],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Marked read" },
        },
      },
    },
    "/api/v1/notifications/read-all": {
      post: {
        tags: ["Notifications"],
        summary: "Mark all notifications as read",
        security: [bearerAuth],
        responses: {
          200: { description: "All notifications marked read" },
        },
      },
    },
    "/api/v1/notifications/read-feedback": {
      post: {
        tags: ["Notifications"],
        summary: "Mark all feedback-related notifications as read",
        security: [bearerAuth],
        responses: {
          200: { description: "Feedback notifications cleared" },
        },
      },
    },

    /* ── ANALYTICS ── */
    "/api/v1/analytics": {
      get: {
        tags: ["Analytics"],
        summary: "Analytics dashboard (managers, HR, leadership, admin)",
        security: [bearerAuth],
        responses: {
          200: { description: "Analytics dashboard data", content: { "application/json": { schema: { $ref: "#/components/schemas/AnalyticsDashboard" } } } },
          403: { description: "Forbidden — insufficient role" },
        },
      },
    },
    "/api/v1/analytics/events": {
      get: {
        tags: ["Analytics"],
        summary: "List raw analytics events",
        security: [bearerAuth],
        responses: {
          200: { description: "Array of events" },
          403: { description: "Forbidden" },
        },
      },
    },

    /* ── DASHBOARDS ── */
    "/api/v1/dashboards/manager": {
      get: {
        tags: ["Dashboards"],
        summary: "Manager dashboard aggregate",
        security: [bearerAuth],
        responses: {
          200: { description: "Manager KPIs" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/v1/dashboards/hr": {
      get: {
        tags: ["Dashboards"],
        summary: "HR dashboard aggregate",
        security: [bearerAuth],
        responses: {
          200: { description: "HR KPIs" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/v1/dashboards/leadership": {
      get: {
        tags: ["Dashboards"],
        summary: "Leadership executive dashboard",
        security: [bearerAuth],
        responses: {
          200: { description: "Leadership KPIs" },
          403: { description: "Forbidden" },
        },
      },
    },

    /* ── AI INSIGHTS ── */
    "/api/v1/ai/summarize-feedback": {
      post: {
        tags: ["AI Insights"],
        summary: "Summarize a feedback thread using AI",
        security: [bearerAuth],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { entries: { type: "array", items: { type: "string" } } } } } } },
        responses: { 200: { description: "AI summary" }, 403: { description: "Forbidden — requires ai:invoke permission" } },
      },
    },
    "/api/v1/ai/generate-review-summary": {
      post: {
        tags: ["AI Insights"],
        summary: "Generate a performance review summary using AI",
        security: [bearerAuth],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { reviewData: { type: "object" } } } } } },
        responses: { 200: { description: "AI-generated summary" } },
      },
    },
    "/api/v1/ai/analyze-bias": {
      post: {
        tags: ["AI Insights"],
        summary: "Detect potential bias in a review comment",
        security: [bearerAuth],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { text: { type: "string" } } } } } },
        responses: { 200: { description: "Bias analysis result" } },
      },
    },
    "/api/v1/ai/sentiment": {
      post: {
        tags: ["AI Insights"],
        summary: "Sentiment analysis on feedback or review text",
        security: [bearerAuth],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { text: { type: "string" } } } } } },
        responses: { 200: { description: "Sentiment result" } },
      },
    },
    "/api/v1/ai/competency-gap-summary": {
      post: {
        tags: ["AI Insights"],
        summary: "Summarize competency gaps for an employee",
        security: [bearerAuth],
        requestBody: { content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Competency gap summary" } },
      },
    },
    "/api/v1/ai/recommend-development-actions": {
      post: {
        tags: ["AI Insights"],
        summary: "Recommend development actions based on review data",
        security: [bearerAuth],
        requestBody: { content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Development recommendations" } },
      },
    },
    "/api/v1/ai/extract-themes": {
      post: {
        tags: ["AI Insights"],
        summary: "Extract themes from a set of feedback entries",
        security: [bearerAuth],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { entries: { type: "array", items: { type: "string" } } } } } } },
        responses: { 200: { description: "Extracted themes" } },
      },
    },
    "/api/v1/ai/executive-summary": {
      post: {
        tags: ["AI Insights"],
        summary: "Generate an executive-level performance summary",
        security: [bearerAuth],
        requestBody: { content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Executive summary" } },
      },
    },
  },
};
