import { validationResult } from "express-validator";
import { ProfileService } from "../services/ProfileService.js";

export class ProfileController {
  static createInternal(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const profile = ProfileService.createInternal(req.body);
      return res.status(201).json(profile);
    } catch (e) {
      next(e);
    }
  }

  static getMe(req, res, next) {
    try {
      const profile = ProfileService.getMe(req.user.id);
      return res.json(profile);
    } catch (e) {
      next(e);
    }
  }

  static patchMe(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const profile = ProfileService.updateMe(req.user.id, req.body);
      return res.json(profile);
    } catch (e) {
      next(e);
    }
  }

  static list(req, res, next) {
    try {
      const list = ProfileService.listProfiles(req.user.roles);
      return res.json(list);
    } catch (e) {
      next(e);
    }
  }

  static directory(req, res, next) {
    try {
      return res.json(ProfileService.listDirectory(req.user.id));
    } catch (e) {
      next(e);
    }
  }

  static patchManager(req, res, next) {
    try {
      const profile = ProfileService.setManager(
        req.params.userId,
        req.body.managerId,
        req.user.roles
      );
      return res.json(profile);
    } catch (e) {
      next(e);
    }
  }

  static getInternal(req, res, next) {
    try {
      const profile = ProfileService.getInternalByUserId(req.params.userId);
      return res.json(profile);
    } catch (e) {
      next(e);
    }
  }

  static listReportsInternal(req, res, next) {
    try {
      const userIds = ProfileService.listReportUserIds(req.params.managerId);
      return res.json({ userIds });
    } catch (e) {
      next(e);
    }
  }
}
