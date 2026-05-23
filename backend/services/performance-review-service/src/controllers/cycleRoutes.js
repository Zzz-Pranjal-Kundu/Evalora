import { Router } from "express";
import { jwtAuth, requireRoles } from "../middleware/jwtAuth.js";
import * as cycleService from "../services/cycleService.js";
import * as cycleView from "../views/cycleView.js";

const router = Router();

router.get("/", jwtAuth, async (req, res) => {
  try {
    const list = await cycleService.listCycles();
    res.json(cycleView.toCycleList(list));
  } catch (e) {
    res.status(500).json({ detail: e.message, message: e.message });
  }
});

router.post("/", jwtAuth, requireRoles("ADMIN", "SUPER_ADMIN", "HR_ADMIN"), async (req, res) => {
  try {
    const { name, start_date, end_date, status = "DRAFT" } = req.body || {};
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ detail: "name, start_date, end_date required", message: "Invalid body" });
    }
    const row = await cycleService.createCycle({ name, start_date, end_date, status });
    res.status(201).json(cycleView.toCycle(row));
  } catch (e) {
    res.status(500).json({ detail: e.message, message: e.message });
  }
});

router.patch("/:cycle_id", jwtAuth, requireRoles("ADMIN", "MANAGER", "HR_ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const row = await cycleService.updateCycle(req.params.cycle_id, req.body);
    if (!row) return res.status(404).json({ detail: "Not found", message: "Not found" });
    res.json(cycleView.toCycle(row));
  } catch (e) {
    res.status(500).json({ detail: e.message, message: e.message });
  }
});

export default router;
