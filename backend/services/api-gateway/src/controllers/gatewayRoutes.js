import { Router } from "express";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/rbac.js";
import { HttpProxyService } from "../services/HttpProxyService.js";
import { AuthGatewayController } from "./AuthGatewayController.js";

const router = Router();

const authHeader = (req) => ({ authorization: req.headers.authorization || "" });

/** Normalize gateway mount so /api/v1/* proxies like /api/*. */
function stripApiVersion(originalUrl) {
  if (originalUrl.startsWith("/api/v1")) {
    return `/api${originalUrl.slice("/api/v1".length)}`;
  }
  return originalUrl;
}

function splitPathQuery(originalUrl, prefix) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const [pathPart, queryString] = originalUrl.split("?");
  let rest = pathPart.replace(new RegExp(`^${escaped}`), "") || "/";
  if (!rest.startsWith("/")) rest = `/${rest}`;
  const queryObj = {};
  if (queryString) {
    new URLSearchParams(queryString).forEach((v, k) => {
      queryObj[k] = v;
    });
  }
  return { rest, queryObj };
}

async function proxySubtree(req, baseUrl, apiPrefix, rewrite) {
  const logicalUrl = stripApiVersion(req.originalUrl);
  const { rest, queryObj } = splitPathQuery(logicalUrl, apiPrefix);
  const path = typeof rewrite === "function" ? rewrite(rest, req.method) : rest;
  return HttpProxyService.forward({
    baseUrl,
    path,
    method: req.method,
    headers: { ...authHeader(req), "content-type": "application/json" },
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
    query: Object.keys(queryObj).length ? queryObj : undefined,
  });
}

router.post("/auth/register", AuthGatewayController.register);
router.post("/auth/login", AuthGatewayController.login);
router.post("/auth/refresh", AuthGatewayController.refresh);
router.get("/auth/me", AuthGatewayController.me);

router.get("/users/profiles/me", requireAuth, async (req, res, next) => {
  try {
    const out = await HttpProxyService.forward({
      baseUrl: env.userUrl,
      path: "/profiles/me",
      method: "GET",
      headers: authHeader(req),
    });
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

router.get("/users/directory", requireAuth, async (req, res, next) => {
  try {
    const out = await HttpProxyService.forward({
      baseUrl: env.userUrl,
      path: "/profiles/directory",
      method: "GET",
      headers: authHeader(req),
    });
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

router.get("/users/recognitions/feed", requireAuth, async (req, res, next) => {
  try {
    const out = await HttpProxyService.forward({
      baseUrl: env.userUrl,
      path: "/recognitions/feed",
      method: "GET",
      headers: authHeader(req),
    });
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

router.post("/users/recognitions", requireAuth, async (req, res, next) => {
  try {
    const out = await HttpProxyService.forward({
      baseUrl: env.userUrl,
      path: "/recognitions",
      method: "POST",
      headers: { ...authHeader(req), "content-type": "application/json" },
      body: req.body,
    });
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

router.patch("/users/profiles/me", requireAuth, async (req, res, next) => {
  try {
    const out = await HttpProxyService.forward({
      baseUrl: env.userUrl,
      path: "/profiles/me",
      method: "PATCH",
      headers: { ...authHeader(req), "content-type": "application/json" },
      body: req.body,
    });
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

router.get("/users/profiles", requireAuth, async (req, res, next) => {
  try {
    const out = await HttpProxyService.forward({
      baseUrl: env.userUrl,
      path: "/profiles",
      method: "GET",
      headers: authHeader(req),
      query: req.query,
    });
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

router.patch("/users/profiles/:userId/manager", requireAuth, async (req, res, next) => {
  try {
    const out = await HttpProxyService.forward({
      baseUrl: env.userUrl,
      path: `/profiles/${req.params.userId}/manager`,
      method: "PATCH",
      headers: { ...authHeader(req), "content-type": "application/json" },
      body: req.body,
    });
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

router.get("/notifications", requireAuth, async (req, res, next) => {
  try {
    const out = await HttpProxyService.forward({
      baseUrl: env.notificationUrl,
      path: "/notifications",
      method: "GET",
      headers: authHeader(req),
      query: req.query,
    });
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

router.post("/notifications/read-all", requireAuth, async (req, res, next) => {
  try {
    const out = await HttpProxyService.forward({
      baseUrl: env.notificationUrl,
      path: "/notifications/read-all",
      method: "POST",
      headers: authHeader(req),
      body: req.body,
    });
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

router.post("/notifications/read-feedback", requireAuth, async (req, res, next) => {
  try {
    const out = await HttpProxyService.forward({
      baseUrl: env.notificationUrl,
      path: "/notifications/read-feedback",
      method: "POST",
      headers: authHeader(req),
      body: req.body,
    });
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

router.post("/notifications/:id/read", requireAuth, async (req, res, next) => {
  try {
    const out = await HttpProxyService.forward({
      baseUrl: env.notificationUrl,
      path: `/notifications/${req.params.id}/read`,
      method: "POST",
      headers: authHeader(req),
      body: req.body,
    });
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

router.use("/performance", requireAuth, async (req, res, next) => {
  try {
    const out = await proxySubtree(req, env.performanceUrl, "/api/performance");
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

router.use("/feedback", requireAuth, async (req, res, next) => {
  try {
    const out = await proxySubtree(req, env.feedbackUrl, "/api/feedback");
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

const analyticsPathRewrite = (rest, method) => {
  if (rest === "/") return method === "GET" ? "/analytics/dashboard" : "/analytics";
  return `/analytics${rest}`;
};

router.use("/analytics", requireAuth, async (req, res, next) => {
  try {
    const out = await proxySubtree(req, env.analyticsUrl, "/api/analytics", analyticsPathRewrite);
    return res.status(out.status).json(out.body);
  } catch (e) {
    next(e);
  }
});

async function forwardAiRequest(req, upstreamPath) {
  return HttpProxyService.forward({
    baseUrl: env.aiInsightsUrl,
    path: upstreamPath,
    method: req.method,
    headers: {
      ...authHeader(req),
      "content-type": "application/json",
      "X-Service-Key": env.aiServiceKey,
    },
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
  });
}

const AI_POSTS = [
  ["/ai/summarize-feedback", "/ai/summarize-feedback"],
  ["/ai/generate-review-summary", "/ai/generate-review-summary"],
  ["/ai/check-review-comment-quality", "/ai/check-review-comment-quality"],
  ["/ai/analyze-bias", "/ai/analyze-bias"],
  ["/ai/competency-gap-summary", "/ai/competency-gap-summary"],
  ["/ai/recommend-development-actions", "/ai/recommend-development-actions"],
  ["/ai/sentiment", "/ai/sentiment"],
  ["/ai/extract-themes", "/ai/extract-themes"],
  ["/ai/executive-summary", "/ai/executive-summary"],
];

for (const [mount, upstream] of AI_POSTS) {
  router.post(mount, requireAuth, requirePermission("ai:invoke"), async (req, res, next) => {
    try {
      const out = await forwardAiRequest(req, upstream);
      return res.status(out.status).json(out.body);
    } catch (e) {
      next(e);
    }
  });
}

router.get(
  "/dashboards/manager",
  requireAuth,
  requirePermission("dashboard:manager"),
  (req, res) => {
    res.json({
      version: 1,
      pendingReviews: 0,
      teamGoalCompletionPct: null,
      checkInsDueThisWeek: 0,
      message: "Wire to aggregated employee-service / review APIs when available.",
    });
  }
);

router.get(
  "/dashboards/hr",
  requireAuth,
  requirePermission("dashboard:hr"),
  (req, res) => {
    res.json({
      version: 1,
      activeCycles: 0,
      calibrationSessions: 0,
      message: "Placeholder HR dashboard payload.",
    });
  }
);

router.get(
  "/dashboards/leadership",
  requireAuth,
  requirePermission("dashboard:leadership"),
  (req, res) => {
    res.json({
      version: 1,
      headcount: null,
      performanceDistribution: [],
      message: "Aggregated leadership metrics — connect to analytics warehouse.",
    });
  }
);

export default router;
