import { Router } from "express";
import {
  createDiscount,
  getAllDiscounts,
  getActiveDiscounts,
  updateDiscount,
  toggleDiscountStatus,
  deleteDiscount,
} from "../controllers/discount.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// ── Public route: fetch currently active discounts for landing page ──────
router.get("/active", getActiveDiscounts);

// ── Admin routes: protected + admin only ──────────────────────────────────
router.use(authenticate, requireAdmin);

router.get("/", getAllDiscounts);
router.post("/", createDiscount);
router.put("/:id", updateDiscount);
router.patch("/:id/toggle", toggleDiscountStatus);
router.delete("/:id", deleteDiscount);

export default router;
