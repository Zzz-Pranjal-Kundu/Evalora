import { validationResult } from "express-validator";
import { AuthService } from "../services/AuthService.js";
import { logger } from "../utils/logger.js";
import * as AuthView from "../views/authView.js";

export class AuthController {
  static async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password, role, fullName } = req.body;
      const result = await AuthService.register({
        email,
        password,
        role: role || "EMPLOYEE",
      });
      return res.status(201).json(AuthView.registerResponse(result, fullName));
    } catch (e) {
      logger.warn("Register failed", { message: e.message });
      next(e);
    }
  }

  static async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const result = await AuthService.login(req.body);
      return res.json(AuthView.authSessionResponse(result));
    } catch (e) {
      next(e);
    }
  }

  static async refresh(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const result = await AuthService.refresh(req.body.refreshToken);
      return res.json(AuthView.authSessionResponse(result));
    } catch (e) {
      next(e);
    }
  }

  static async me(req, res, next) {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
      if (!token) {
        return res.status(401).json({ message: "Missing token" });
      }
      const payload = AuthService.verifyToken(token);
      return res.json(AuthView.meResponse(payload));
    } catch (e) {
      next(e);
    }
  }
}
