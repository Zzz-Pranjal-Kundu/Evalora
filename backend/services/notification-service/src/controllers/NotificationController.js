import { validationResult } from "express-validator";
import { NotificationService } from "../services/NotificationService.js";

export class NotificationController {
  static createInternal(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const n = NotificationService.createInternal(req.body);
      return res.status(201).json(n);
    } catch (e) {
      next(e);
    }
  }

  static list(req, res, next) {
    try {
      return res.json(NotificationService.listMine(req.user.id));
    } catch (e) {
      next(e);
    }
  }

  static markRead(req, res, next) {
    try {
      return res.json(NotificationService.markRead(req.user.id, req.params.id));
    } catch (e) {
      next(e);
    }
  }

  static markAll(req, res, next) {
    try {
      return res.json(NotificationService.markAllRead(req.user.id));
    } catch (e) {
      next(e);
    }
  }

  static markFeedbackRead(req, res, next) {
    try {
      return res.json(NotificationService.markFeedbackRelatedRead(req.user.id));
    } catch (e) {
      next(e);
    }
  }
}
