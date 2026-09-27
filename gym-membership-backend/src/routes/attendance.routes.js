import { Router } from "express";
import {
  getDailyAttendance,
  markAttendance,
  getUserAttendance,
  getAttendanceStats,
} from "../controllers/attendance.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// All attendance operations in the admin portal require authentication & admin role
router.use(authenticate, requireAdmin);

router.get("/stats", getAttendanceStats);
router.get("/user/:userId", getUserAttendance);
router.get("/", getDailyAttendance);
router.post("/mark", markAttendance);

export default router;
