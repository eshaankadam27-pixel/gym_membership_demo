import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as paymentService from "../services/payment.service.js";

/**
 * GET /api/v1/payments
 * Get all payment records (admin).
 */
export const getAllPayments = asyncHandler(async (_req, res) => {
  const payments = await paymentService.getAllPayments();
  res.status(200).json(new ApiResponse(200, payments, "Payments fetched successfully"));
});

/**
 * GET /api/v1/payments/stats
 * Get revenue statistics (admin).
 */
export const getPaymentStats = asyncHandler(async (_req, res) => {
  const stats = await paymentService.getPaymentStats();
  res.status(200).json(new ApiResponse(200, stats, "Payment stats fetched successfully"));
});

/**
 * POST /api/v1/payments
 * Record a manual / direct payment (admin).
 */
export const recordPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.recordPayment(req.body);
  res.status(201).json(new ApiResponse(201, payment, "Payment recorded successfully"));
});

/**
 * GET /api/v1/payments/me
 * Get current member's payments.
 */
export const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getMyPayments(req.user.userId);
  res.status(200).json(new ApiResponse(200, payments, "Your payments fetched successfully"));
});
