import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export class JwtService {
  static verify(authHeader) {
    if (!authHeader?.startsWith("Bearer ")) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }
    const token = authHeader.slice(7).trim();
    try {
      return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    } catch {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }
  }
}
