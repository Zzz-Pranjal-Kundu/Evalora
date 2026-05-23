import { JwtService } from "../services/JwtService.js";

export function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const payload = JwtService.verify(authHeader);
      req.user = {
        id: payload.sub,
        roles: payload.roles || [],
        role: payload.roles?.[0] || "",
        email: payload.email,
      };
    }
  } catch (e) {
    // Proceed without setting req.user on error
  }
  next();
}

export function requireAuth(req, res, next) {
  try {
    const payload = JwtService.verify(req.headers.authorization);
    req.user = {
      id: payload.sub,
      roles: payload.roles || [],
      role: payload.roles?.[0] || "",
      email: payload.email,
    };
    next();
  } catch (e) {
    next(e);
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    const ok = roles.some((r) => req.user.roles.includes(r));
    if (!ok) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
