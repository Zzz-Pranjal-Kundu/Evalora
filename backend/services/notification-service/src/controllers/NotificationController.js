import { validationResult } from "express-validator";
import { NotificationService } from "../services/NotificationService.js";

export class NotificationController {
  static async createInternal(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const n = await NotificationService.createInternal(req.body);
      return res.status(201).json(n);
    } catch (e) {
      next(e);
    }
  }

  static async list(req, res, next) {
    try {
      const list = await NotificationService.listMine(req.user.id);
      return res.json(list);
    } catch (e) {
      next(e);
    }
  }

  static async markRead(req, res, next) {
    try {
      const result = await NotificationService.markRead(req.user.id, req.params.id);
      return res.json(result);
    } catch (e) {
      next(e);
    }
  }

  static async markAll(req, res, next) {
    try {
      const result = await NotificationService.markAllRead(req.user.id);
      return res.json(result);
    } catch (e) {
      next(e);
    }
  }

  static async markFeedbackRead(req, res, next) {
    try {
      const result = await NotificationService.markFeedbackRelatedRead(req.user.id);
      return res.json(result);
    } catch (e) {
      next(e);
    }
  }
}
