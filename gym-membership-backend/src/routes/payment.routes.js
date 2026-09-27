import { Router } from "express";
import {
  getAllPayments,
  getPaymentStats,
  recordPayment,
  getMyPayments,
} from "../controllers/payment.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Member route
router.get("/me", authenticate, getMyPayments);

// Admin routes
router.get("/stats", authenticate, requireAdmin, getPaymentStats);
router.get("/", authenticate, requireAdmin, getAllPayments);
router.post("/", authenticate, requireAdmin, recordPayment);

export default router;
