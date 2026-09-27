import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import adminRoutes from "./admin.routes.js";
import membershipRoutes from "./membership.routes.js";
import paymentRoutes from "./payment.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import discountRoutes from "./discount.routes.js";

const router = Router();

// ── Versioned API routes ──────────────────────────────────
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/memberships", membershipRoutes);
router.use("/payments", paymentRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/discounts", discountRoutes);

export default router;

