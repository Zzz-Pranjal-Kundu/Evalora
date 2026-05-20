import { Router } from "express";
import { body } from "express-validator";
import { ProfileController } from "./ProfileController.js";
import { jwtAuth } from "../middleware/jwtAuth.js";
import { internalAuth } from "../middleware/internalAuth.js";

const router = Router();

router.get("/internal/profiles/by-manager/:managerId", internalAuth, ProfileController.listReportsInternal);

router.get("/internal/profiles/:userId", internalAuth, ProfileController.getInternal);

router.post(
  "/internal/profiles",
  internalAuth,
  [
    body("userId").isString().notEmpty(),
    body("fullName").optional().isString(),
    body("department").optional().isString(),
    body("jobTitle").optional().isString(),
    body("managerId").optional({ nullable: true }).isString(),
    body("team").optional({ nullable: true }).isString(),
  ],
  ProfileController.createInternal
);

router.get("/profiles/me", jwtAuth, ProfileController.getMe);

router.get("/profiles/directory", jwtAuth, ProfileController.directory);

router.patch(
  "/profiles/me",
  jwtAuth,
  [
    body("fullName").optional().isString(),
    body("department").optional().isString(),
    body("jobTitle").optional().isString(),
    body("team").optional({ nullable: true }).isString(),
    body("preferences").optional().isObject(),
  ],
  ProfileController.patchMe
);

router.get("/profiles", jwtAuth, ProfileController.list);

router.patch(
  "/profiles/:userId/manager",
  jwtAuth,
  [body("managerId").optional({ nullable: true }).isString()],
  ProfileController.patchManager
);

export default router;
