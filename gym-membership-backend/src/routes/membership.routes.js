import { Router } from "express";
import {
  enroll,
  getMyMembership,
  getMembershipStats,
  getAllMemberships,
  adminEnroll,
  updateStatus,
} from "../controllers/membership.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// ── Member routes (protected) ─────────────────────────────
router.post("/enroll", authenticate, enroll);
router.get("/me", authenticate, getMyMembership);

// ── Admin routes (protected + admin) ──────────────────────
router.get("/stats", authenticate, requireAdmin, getMembershipStats);
router.get("/", authenticate, requireAdmin, getAllMemberships);
router.post("/admin/enroll", authenticate, requireAdmin, adminEnroll);
router.patch("/:id/status", authenticate, requireAdmin, updateStatus);

export default router;
