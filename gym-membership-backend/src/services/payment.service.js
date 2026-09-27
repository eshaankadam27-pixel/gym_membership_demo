import ApiError from "../utils/ApiError.js";
import * as paymentRepo from "../repositories/payment.repository.js";
import * as membershipRepo from "../repositories/membership.repository.js";
import * as userRepo from "../repositories/user.repository.js";
import * as authRepo from "../repositories/auth.repository.js";
import Payment from "../models/payment.model.js";

/**
 * Record a new payment.
 */
export const recordPayment = async (paymentData) => {
  const { authId, userId, amount, paymentMethod, planName, membershipId, notes } = paymentData;

  if (!authId && !userId) {
    throw new ApiError(400, "Either authId or userId is required.");
  }

  let resolvedAuthId = authId;
  let resolvedUserId = userId;

  if (!resolvedAuthId && resolvedUserId) {
    const user = await userRepo.findUserById(resolvedUserId);
    if (!user) throw new ApiError(404, "User profile not found.");
    resolvedAuthId = user.authId;
  }

  if (!resolvedUserId && resolvedAuthId) {
    const user = await userRepo.findUserByAuthId(resolvedAuthId);
    resolvedUserId = user?._id;
  }

  const payment = await paymentRepo.createPayment({
    authId: resolvedAuthId,
    userId: resolvedUserId,
    membershipId,
    amount: Number(amount),
    paymentMethod: paymentMethod || "UPI",
    planName: planName || "Membership Plan",
    status: "SUCCESS",
    notes,
    paymentDate: new Date(),
  });

  return payment;
};

/**
 * Get all payments (admin).
 * Also auto-syncs any legacy/existing memberships that don't yet have a payment record.
 */
export const getAllPayments = async (filter = {}) => {
  // Check if any existing memberships need payment records
  const allMemberships = await membershipRepo.findAllMemberships();
  for (const m of allMemberships) {
    const exists = await Payment.findOne({ membershipId: m._id });
    if (!exists && m.planPrice > 0) {
      await Payment.create({
        authId: m.authId?._id || m.authId,
        userId: m.userId?._id || m.userId,
        membershipId: m._id,
        amount: m.planPrice,
        paymentDate: m.startDate || m.createdAt || new Date(),
        paymentMethod: "UPI",
        planName: m.planName,
        status: "SUCCESS",
        notes: `Enrolled in ${m.planName} plan`,
      });
    }
  }

  return paymentRepo.findAllPayments(filter);
};

/**
 * Get revenue and payment statistics.
 */
export const getPaymentStats = async () => {
  // Ensure sync
  await getAllPayments();

  const allPayments = await paymentRepo.findAllPayments({ status: "SUCCESS" });

  const totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalCount = allPayments.length;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayPayments = allPayments.filter((p) => new Date(p.paymentDate) >= todayStart);
  const todayRevenue = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthPayments = allPayments.filter((p) => new Date(p.paymentDate) >= monthStart);
  const monthRevenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    totalRevenue,
    totalCount,
    todayRevenue,
    todayCount: todayPayments.length,
    monthRevenue,
    monthCount: monthPayments.length,
    avgTransaction: totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0,
  };
};

/**
 * Get payments for authenticated member.
 */
export const getMyPayments = async (authId) => {
  return paymentRepo.findPaymentsByAuthId(authId);
};
