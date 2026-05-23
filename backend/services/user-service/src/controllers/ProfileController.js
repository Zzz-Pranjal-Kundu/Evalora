import { validationResult } from "express-validator";
import { ProfileService } from "../services/ProfileService.js";

export class ProfileController {
  static async createInternal(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const profile = await ProfileService.createInternal(req.body);
      return res.status(201).json(profile);
    } catch (e) {
      next(e);
    }
  }

  static async getMe(req, res, next) {
    try {
      const profile = await ProfileService.getMe(req.user.id);
      return res.json(profile);
    } catch (e) {
      next(e);
    }
  }

  static async patchMe(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const profile = await ProfileService.updateMe(req.user.id, req.body);
      return res.json(profile);
    } catch (e) {
      next(e);
    }
  }

  static async list(req, res, next) {
    try {
      const list = await ProfileService.listProfiles(req.user.roles);
      return res.json(list);
    } catch (e) {
      next(e);
    }
  }

  static async directory(req, res, next) {
    try {
      const dir = await ProfileService.listDirectory(req.user.id);
      return res.json(dir);
    } catch (e) {
      next(e);
    }
  }

  static async patchManager(req, res, next) {
    try {
      const profile = await ProfileService.setManager(
        req.params.userId,
        req.body.managerId,
        req.user.roles
      );
      return res.json(profile);
    } catch (e) {
      next(e);
    }
  }

  static async getInternal(req, res, next) {
    try {
      const profile = await ProfileService.getInternalByUserId(req.params.userId);
      return res.json(profile);
    } catch (e) {
      next(e);
    }
  }

  static async listReportsInternal(req, res, next) {
    try {
      const userIds = await ProfileService.listReportUserIds(req.params.managerId);
      return res.json({ userIds });
    } catch (e) {
      next(e);
    }
  }
}
