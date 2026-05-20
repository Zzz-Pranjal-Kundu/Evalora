import { Router } from "express";
import { jwtAuth, requireRoles } from "../middleware/jwtAuth.js";
import * as cycleService from "../services/cycleService.js";
import * as cycleView from "../views/cycleView.js";

const router = Router();

router.get("/", jwtAuth, (req, res) => {
  res.json(cycleView.toCycleList(cycleService.listCycles()));
});

router.post("/", jwtAuth, requireRoles("ADMIN", "SUPER_ADMIN", "HR_ADMIN"), (req, res) => {
  const { name, start_date, end_date, status = "DRAFT" } = req.body || {};
  if (!name || !start_date || !end_date) {
    return res.status(400).json({ detail: "name, start_date, end_date required", message: "Invalid body" });
  }
  const row = cycleService.createCycle({ name, start_date, end_date, status });
  res.status(201).json(cycleView.toCycle(row));
});

router.patch("/:cycle_id", jwtAuth, requireRoles("ADMIN", "MANAGER", "HR_ADMIN", "SUPER_ADMIN"), (req, res) => {
  const row = cycleService.updateCycle(req.params.cycle_id, req.body);
  if (!row) return res.status(404).json({ detail: "Not found", message: "Not found" });
  res.json(cycleView.toCycle(row));
});

export default router;
