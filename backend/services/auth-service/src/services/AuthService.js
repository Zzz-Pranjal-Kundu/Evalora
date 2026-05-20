import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UserModel } from "../models/UserModel.js";
import { RefreshTokenModel } from "../models/RefreshTokenModel.js";
import { userToPublic } from "../views/userView.js";
import { logger } from "../utils/logger.js";
import { ALLOWED_ROLES } from "../constants/roles.js";

const SALT_ROUNDS = 12;

function issueSession(user) {
  const accessToken = AuthService.issueToken(user);
  const { plain: refreshToken } = RefreshTokenModel.issue(user.id);
  return { user: userToPublic(user), accessToken, refreshToken };
}

export class AuthService {
  static async register({ email, password, role }) {
    const normalized = email.trim().toLowerCase();
    const existing = UserModel.findByEmail(normalized);
    if (existing) {
      const err = new Error("Email already registered");
      err.statusCode = 409;
      throw err;
    }
    const finalRole = ALLOWED_ROLES.includes(role) ? role : "EMPLOYEE";
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = UserModel.create({
      email: normalized,
      passwordHash,
      role: finalRole,
    });
    logger.info("User registered", { userId: user.id, role: user.role });
    return issueSession(user);
  }

  static async login({ email, password }) {
    const normalized = email.trim().toLowerCase();
    const user = UserModel.findByEmail(normalized);
    if (!user) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      throw err;
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      throw err;
    }
    return issueSession(user);
  }

  static async refresh(plainRefresh) {
    const userId = RefreshTokenModel.findValidUserId(plainRefresh);
    if (!userId) {
      const err = new Error("Invalid refresh token");
      err.statusCode = 401;
      throw err;
    }
    const user = UserModel.findById(userId);
    if (!user) {
      const err = new Error("Invalid refresh token");
      err.statusCode = 401;
      throw err;
    }
    RefreshTokenModel.revokeByPlain(plainRefresh);
    return issueSession(user);
  }

  static issueToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        roles: [user.role],
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn, algorithm: "HS256" }
    );
  }

  static verifyToken(token) {
    try {
      const t = String(token || "").trim();
      return jwt.verify(t, env.jwtSecret, { algorithms: ["HS256"] });
    } catch (e) {
      const err = new Error("Invalid or expired token");
      err.statusCode = 401;
      throw err;
    }
  }
}
