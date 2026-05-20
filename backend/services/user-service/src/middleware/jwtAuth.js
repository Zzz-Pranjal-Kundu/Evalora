import { JwtService } from "../services/JwtService.js";

export function jwtAuth(req, res, next) {
  try {
    const payload = JwtService.extractPayload(req.headers.authorization);
    req.user = {
      id: JwtService.getUserId(payload),
      roles: payload.roles || [],
    };
    next();
  } catch (e) {
    next(e);
  }
}
