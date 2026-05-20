import { env } from "../config/env.js";
import { HttpProxyService } from "../services/HttpProxyService.js";
import { logger } from "../utils/logger.js";

export class AuthGatewayController {
  static async register(req, res, next) {
    try {
      const authResp = await HttpProxyService.forward({
        baseUrl: env.authUrl,
        path: "/auth/register",
        method: "POST",
        body: {
          email: req.body.email,
          password: req.body.password,
          role: req.body.role,
          fullName: req.body.fullName,
        },
      });
      if (authResp.status >= 400) {
        return res.status(authResp.status).json(authResp.body);
      }
      const { user, accessToken, refreshToken } = authResp.body;
      const profileResp = await HttpProxyService.forward({
        baseUrl: env.userUrl,
        path: "/internal/profiles",
        method: "POST",
        headers: { "X-Internal-Key": env.internalKey },
        body: {
          userId: user.id,
          fullName: req.body.fullName || "New User",
          department: req.body.department,
          jobTitle: req.body.jobTitle,
          managerId: req.body.managerId,
          team: req.body.team,
        },
      });
      if (profileResp.status >= 400 && profileResp.status !== 409) {
        logger.error("Profile creation failed after auth", {
          status: profileResp.status,
          body: profileResp.body,
        });
        return res.status(502).json({
          message: "Account created but profile provisioning failed",
          partial: { user, accessToken, refreshToken },
        });
      }
      return res.status(201).json({ user, accessToken, refreshToken, profile: profileResp.body });
    } catch (e) {
      next(e);
    }
  }

  static async refresh(req, res, next) {
    try {
      const out = await HttpProxyService.forward({
        baseUrl: env.authUrl,
        path: "/auth/refresh",
        method: "POST",
        body: req.body,
      });
      return res.status(out.status).json(out.body);
    } catch (e) {
      next(e);
    }
  }

  static async login(req, res, next) {
    try {
      const out = await HttpProxyService.forward({
        baseUrl: env.authUrl,
        path: "/auth/login",
        method: "POST",
        body: req.body,
      });
      return res.status(out.status).json(out.body);
    } catch (e) {
      next(e);
    }
  }

  static async me(req, res, next) {
    try {
      const out = await HttpProxyService.forward({
        baseUrl: env.authUrl,
        path: "/auth/me",
        method: "GET",
        headers: { authorization: req.headers.authorization || "" },
      });
      return res.status(out.status).json(out.body);
    } catch (e) {
      next(e);
    }
  }
}
