import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export class JwtService {
  static extractPayload(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const err = new Error("Missing or invalid Authorization header");
      err.statusCode = 401;
      throw err;
    }
    const token = authHeader.slice(7).trim();
    try {
      return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    } catch {
      const err = new Error("Invalid or expired token");
      err.statusCode = 401;
      throw err;
    }
  }

  static getUserId(payload) {
    return payload.sub;
  }

  static hasRole(payload, roles) {
    const userRoles = payload.roles || [];
    return roles.some((r) => userRoles.includes(r));
  }
}
