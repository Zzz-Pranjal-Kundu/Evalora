import { Router } from "express";
import { body } from "express-validator";
import { AuthController } from "./AuthController.js";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("role")
      .optional()
      .isIn(["ADMIN", "MANAGER", "EMPLOYEE", "HR_ADMIN", "LEADERSHIP", "SUPER_ADMIN"]),
    body("fullName").optional().isString(),
  ],
  AuthController.register
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 */
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isString().notEmpty(),
  ],
  AuthController.login
);

router.post(
  "/refresh",
  [body("refreshToken").isString().notEmpty()],
  AuthController.refresh
);

router.get("/me", AuthController.me);

export default router;
