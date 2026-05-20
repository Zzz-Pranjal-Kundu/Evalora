import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export class JwtService {
  static extractUser(authHeader) {
    if (!authHeader?.startsWith("Bearer ")) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
      const id = payload.sub == null ? "" : String(payload.sub).trim();
      return { id, roles: payload.roles || [] };
    } catch {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }
  }
}
