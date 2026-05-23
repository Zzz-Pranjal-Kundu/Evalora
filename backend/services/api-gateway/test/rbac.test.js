import test from "node:test";
import assert from "node:assert/strict";
import { requireRole, requireRoleForPath, ROLES, ANALYTICS_ROLES } from "../src/middleware/rbac.js";

test("RBAC requireRole middleware", async (t) => {
  await t.test("should return 401 when req.user is missing", () => {
    const middleware = requireRole(ANALYTICS_ROLES);
    let statusCalled = null;
    let jsonCalled = null;
    
    const req = {};
    const res = {
      status(s) {
        statusCalled = s;
        return {
          json(j) {
            jsonCalled = j;
          }
        };
      }
    };
    const next = () => {
      assert.fail("should not call next()");
    };

    middleware(req, res, next);
    assert.equal(statusCalled, 401);
    assert.equal(jsonCalled.error, "Unauthorized");
  });

  await t.test("should return 403 when user role is not allowed", () => {
    const middleware = requireRole(ANALYTICS_ROLES);
    let statusCalled = null;
    let jsonCalled = null;
    
    const req = {
      user: { role: ROLES.EMPLOYEE }
    };
    const res = {
      status(s) {
        statusCalled = s;
        return {
          json(j) {
            jsonCalled = j;
          }
        };
      }
    };
    const next = () => {
      assert.fail("should not call next()");
    };

    middleware(req, res, next);
    assert.equal(statusCalled, 403);
    assert.equal(jsonCalled.error, "Forbidden");
    assert.equal(jsonCalled.message, "You do not have permission to access this resource.");
  });

  await t.test("should call next() when user role is allowed", () => {
    const middleware = requireRole(ANALYTICS_ROLES);
    let nextCalled = false;
    
    const req = {
      user: { role: ROLES.MANAGER }
    };
    const res = {};
    const next = () => {
      nextCalled = true;
    };

    middleware(req, res, next);
    assert.ok(nextCalled);
  });
});

test("RBAC requireRoleForPath middleware", async (t) => {
  await t.test("should allow unmatched path to proceed", () => {
    let nextCalled = false;
    const req = {
      originalUrl: "/api/unmatched",
      headers: {}
    };
    const res = {};
    const next = () => {
      nextCalled = true;
    };

    requireRoleForPath(req, res, next);
    assert.ok(nextCalled);
  });

  await t.test("should return 403 on matched analytics path for employee role", () => {
    let statusCalled = null;
    let jsonCalled = null;
    
    const req = {
      originalUrl: "/api/analytics/dashboard",
      user: { role: ROLES.EMPLOYEE },
      headers: {}
    };
    const res = {
      status(s) {
        statusCalled = s;
        return {
          json(j) {
            jsonCalled = j;
          }
        };
      }
    };
    const next = () => {
      assert.fail("should not call next()");
    };

    requireRoleForPath(req, res, next);
    assert.equal(statusCalled, 403);
    assert.equal(jsonCalled.error, "Forbidden");
  });

  await t.test("should allow matched analytics path for manager role", () => {
    let nextCalled = false;
    const req = {
      originalUrl: "/api/analytics/dashboard",
      user: { role: ROLES.MANAGER },
      headers: {}
    };
    const res = {};
    const next = () => {
      nextCalled = true;
    };

    requireRoleForPath(req, res, next);
    assert.ok(nextCalled);
  });
});
