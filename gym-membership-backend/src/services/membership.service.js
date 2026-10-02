import ApiError from "../utils/ApiError.js";
import * as membershipRepo from "../repositories/membership.repository.js";
import * as userRepo from "../repositories/user.repository.js";
import Payment from "../models/payment.model.js";

/**
 * Business-logic layer for Memberships.
 * Validates data, enforces rules, delegates persistence to the repository.
 */

/**
 * Plan configuration mapping — mirrors the frontend plan data.
 * Used to validate and resolve plan details during enrollment.
 */
export const PLAN_CONFIG = {
  Monthly: { price: 1500, durationInDays: 30, duration: "/ month" },
  Quarterly: { price: 4000, durationInDays: 90, duration: "/ 3 months" },
  "Half Yearly": { price: 7500, durationInDays: 180, duration: "/ 6 months" },
  Annual: { price: 14000, durationInDays: 365, duration: "/ year" },
};

/**
 * Enroll a member in a plan.
 * @param {string} authId - The authenticated user's auth ID
 * @param {Object} planData - { planName }
 * @returns {Promise<Document>}
 */
export const enrollMember = async (authId, planData) => {
  const { planName, fitnessGoal, fitnessLevel, bodyFocus, dietPreference } = planData;

  if (!planName) {
    throw new ApiError(400, "Plan name is required.");
  }

  const planConfig = PLAN_CONFIG[planName];
  if (!planConfig) {
    throw new ApiError(400, `Invalid plan: "${planName}". Available plans: ${Object.keys(PLAN_CONFIG).join(", ")}`);
  }

  // Check for existing active membership
  const existingActive = await membershipRepo.findActiveMembershipByAuthId(authId);
  if (existingActive) {
    throw new ApiError(409, "You already have an active membership. Cancel or wait for it to expire before enrolling in a new plan.");
  }

  // Check for active discount
  let finalPrice = planConfig.price;
  let discountPercentage = 0;
  let discountAmount = 0;

  try {
    const { findActiveDiscountForPlan } = await import("../repositories/discount.repository.js");
    const activeDiscount = await findActiveDiscountForPlan(planName);
    if (activeDiscount) {
      discountPercentage = activeDiscount.discountPercentage;
      discountAmount = Math.round((planConfig.price * discountPercentage) / 100);
      finalPrice = planConfig.price - discountAmount;
    }
  } catch (discErr) {
    console.warn("Could not check active discount:", discErr);
  }

  // Try to find the user profile for this auth
  const user = await userRepo.findUserByAuthId(authId);

  const membership = await membershipRepo.createMembership({
    authId,
    userId: user?._id || undefined,
    planName,
    planPrice: finalPrice,
    originalPrice: planConfig.price,
    discountPercentage,
    discountAmount,
    planDuration: planConfig.duration,
    planDurationInDays: planConfig.durationInDays,
    startDate: new Date(),
    fitnessGoal: fitnessGoal || undefined,
    fitnessLevel: fitnessLevel || undefined,
    bodyFocus: bodyFocus || undefined,
    dietPreference: dietPreference || undefined,
  });

  // Automatically record payment
  let paymentRecord = null;
  try {
    paymentRecord = await Payment.create({
      authId,
      userId: user?._id || undefined,
      membershipId: membership._id,
      amount: finalPrice,
      paymentDate: new Date(),
      paymentMethod: planData.paymentMethod || "UPI",
      planName,
      status: "SUCCESS",
      notes: discountPercentage > 0
        ? `Online enrollment in ${planName} plan (${discountPercentage}% discount applied)`
        : `Online enrollment in ${planName} plan`,
    });
  } catch (err) {
    console.error("Failed to auto-record payment on enrollment:", err);
  }

  const result = membership.toObject ? membership.toObject() : { ...membership._doc || membership };
  if (paymentRecord) {
    result.payment = {
      transactionId: paymentRecord.transactionId,
      paymentMethod: paymentRecord.paymentMethod,
      amount: paymentRecord.amount,
      status: paymentRecord.status,
    };
  }

  return result;
};

/**
 * Admin directly enrolls or assigns a plan to any user.
 */
export const adminEnrollMember = async ({ userId, authId, planName, paymentMethod, startDate }) => {
  if (!planName) {
    throw new ApiError(400, "Plan name is required.");
  }

  const planConfig = PLAN_CONFIG[planName];
  if (!planConfig) {
    throw new ApiError(400, `Invalid plan: "${planName}". Available plans: ${Object.keys(PLAN_CONFIG).join(", ")}`);
  }

  let targetAuthId = authId;
  let targetUserId = userId;

  if (targetUserId && !targetAuthId) {
    const user = await userRepo.findUserById(targetUserId);
    if (!user) throw new ApiError(404, "User not found.");
    targetAuthId = user.authId;
  } else if (targetAuthId && !targetUserId) {
    const user = await userRepo.findUserByAuthId(targetAuthId);
    targetUserId = user?._id;
  }

  if (!targetAuthId) {
    throw new ApiError(400, "A valid user or auth ID is required.");
  }

  // Cancel any currently active membership for this user first
  const existingActive = await membershipRepo.findActiveMembershipByAuthId(targetAuthId);
  if (existingActive) {
    await membershipRepo.updateMembershipById(existingActive._id, { status: "EXPIRED" });
  }

  const start = startDate ? new Date(startDate) : new Date();

  const membership = await membershipRepo.createMembership({
    authId: targetAuthId,
    userId: targetUserId,
    planName,
    planPrice: planConfig.price,
    planDuration: planConfig.duration,
    planDurationInDays: planConfig.durationInDays,
    startDate: start,
    status: "ACTIVE",
  });

  // Record payment
  try {
    await Payment.create({
      authId: targetAuthId,
      userId: targetUserId,
      membershipId: membership._id,
      amount: planConfig.price,
      paymentDate: new Date(),
      paymentMethod: paymentMethod || "Cash",
      planName,
      status: "SUCCESS",
      notes: `Admin assigned ${planName} plan`,
    });
  } catch (err) {
    console.error("Failed to record payment in admin enrollment:", err);
  }

  return membership;
};

/**
 * Update membership status (e.g. CANCELLED or ACTIVE or EXPIRED).
 */
export const updateMembershipStatus = async (membershipId, status) => {
  if (!["ACTIVE", "EXPIRED", "CANCELLED"].includes(status)) {
    throw new ApiError(400, "Invalid status. Must be ACTIVE, EXPIRED, or CANCELLED.");
  }

  const updated = await membershipRepo.updateMembershipById(membershipId, { status });
  if (!updated) {
    throw new ApiError(404, "Membership not found.");
  }
  return updated;
};

/**
 * Get the current active membership for a user.
 * @param {string} authId
 * @returns {Promise<Document|null>}
 */
export const getMyMembership = async (authId) => {
  const membership = await membershipRepo.findActiveMembershipByAuthId(authId);
  return membership;
};

/**
 * Get all memberships for a user (history).
 * @param {string} authId
 * @returns {Promise<Document[]>}
 */
export const getMyMembershipHistory = async (authId) => {
  return membershipRepo.findMembershipsByAuthId(authId);
};

/**
 * Get all memberships (admin).
 * @param {Object} [filter]
 * @returns {Promise<Document[]>}
 */
export const getAllMemberships = async (filter = {}) => {
  return membershipRepo.findAllMemberships(filter);
};

/**
 * Get membership statistics (admin).
 * @returns {Promise<Object>}
 */
export const getMembershipStats = async () => {
  const [activeCount, totalCount] = await Promise.all([
    membershipRepo.countActiveMemberships(),
    membershipRepo.countAllMemberships(),
  ]);

  return {
    activeMemberships: activeCount,
    totalMemberships: totalCount,
  };
};
