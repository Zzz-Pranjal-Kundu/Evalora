import { JwtService } from "../services/JwtService.js";

export function jwtAuth(req, res, next) {
  try {
    req.user = JwtService.extractUser(req.headers.authorization);
    next();
  } catch (e) {
    next(e);
  }
}
