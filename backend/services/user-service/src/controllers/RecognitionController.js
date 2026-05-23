import { validationResult } from "express-validator";
import { RecognitionService } from "../services/RecognitionService.js";

export class RecognitionController {
  static async listFeed(req, res, next) {
    try {
      const rows = await RecognitionService.listFeedForViewer(req.user.id, req.user.roles || []);
      return res.json(rows);
    } catch (e) {
      next(e);
    }
  }

  static async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const row = await RecognitionService.create(req.user.id, req.body);
      return res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  }
}
