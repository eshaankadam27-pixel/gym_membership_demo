import ApiError from "../utils/ApiError.js";
import * as discountRepo from "../repositories/discount.repository.js";
import { PLAN_CONFIG } from "./membership.service.js";

/**
 * Business logic layer for Discounts.
 */

const VALID_PLANS = ["Monthly", "Quarterly", "Half Yearly", "Annual", "ALL"];

/**
 * Create a new discount.
 */
export const createDiscount = async (data, adminAuthId) => {
  const { title, description, planName = "Monthly", discountPercentage, startDate, endDate, isActive } = data;

  if (!title || !title.trim()) {
    throw new ApiError(400, "Discount title is required.");
  }

  if (!VALID_PLANS.includes(planName)) {
    throw new ApiError(400, `Invalid plan name. Must be one of: ${VALID_PLANS.join(", ")}`);
  }

  const percentage = Number(discountPercentage);
  if (isNaN(percentage) || percentage < 1 || percentage > 100) {
    throw new ApiError(400, "Discount percentage must be a number between 1 and 100.");
  }

  const start = startDate ? new Date(startDate) : new Date();
  if (isNaN(start.getTime())) {
    throw new ApiError(400, "Invalid start date.");
  }

  if (!endDate) {
    throw new ApiError(400, "End date / duration is required.");
  }
  const end = new Date(endDate);
  if (isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid end date.");
  }

  if (end <= start) {
    throw new ApiError(400, "End date must be later than start date.");
  }

  const discount = await discountRepo.createDiscount({
    title: title.trim(),
    description: description?.trim() || "",
    planName,
    discountPercentage: percentage,
    startDate: start,
    endDate: end,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    createdBy: adminAuthId,
  });

  return discount;
};

/**
 * Get all discounts with calculated status for Admin management.
 */
export const getAllDiscounts = async () => {
  const discounts = await discountRepo.findAllDiscounts();
  const now = new Date();

  return discounts.map((d) => {
    const doc = d.toObject();
    let computedStatus = "INACTIVE";
    if (d.isActive) {
      if (now < new Date(d.startDate)) {
        computedStatus = "UPCOMING";
      } else if (now > new Date(d.endDate)) {
        computedStatus = "EXPIRED";
      } else {
        computedStatus = "ACTIVE";
      }
    }

    // Include plan pricing preview
    const basePlan = PLAN_CONFIG[d.planName];
    if (basePlan) {
      const discountAmount = Math.round((basePlan.price * d.discountPercentage) / 100);
      doc.originalPrice = basePlan.price;
      doc.discountAmount = discountAmount;
      doc.discountedPrice = basePlan.price - discountAmount;
    }

    doc.computedStatus = computedStatus;
    return doc;
  });
};

/**
 * Get currently active and unexpired discounts for public display on plan cards.
 */
export const getActiveDiscounts = async () => {
  const now = new Date();
  const activeDiscounts = await discountRepo.findActiveDiscounts(now);

  // Group discounts by planName with best discount for each
  const planDiscountMap = {};

  activeDiscounts.forEach((d) => {
    const plan = d.planName;
    const basePrice = PLAN_CONFIG[plan]?.price;
    const discountAmount = basePrice ? Math.round((basePrice * d.discountPercentage) / 100) : 0;
    const discountedPrice = basePrice ? basePrice - discountAmount : null;

    const discountSummary = {
      _id: d._id,
      title: d.title,
      description: d.description,
      planName: d.planName,
      discountPercentage: d.discountPercentage,
      startDate: d.startDate,
      endDate: d.endDate,
      originalPrice: basePrice,
      discountAmount,
      discountedPrice,
      timeRemainingMs: Math.max(0, new Date(d.endDate).getTime() - now.getTime()),
    };

    if (plan === "ALL") {
      // Applies to all plans unless a specific plan has a higher or specific discount
      Object.keys(PLAN_CONFIG).forEach((p) => {
        if (!planDiscountMap[p]) {
          const pBase = PLAN_CONFIG[p].price;
          const pDisc = Math.round((pBase * d.discountPercentage) / 100);
          planDiscountMap[p] = {
            ...discountSummary,
            planName: p,
            originalPrice: pBase,
            discountAmount: pDisc,
            discountedPrice: pBase - pDisc,
          };
        }
      });
    } else {
      // Specific plan discount overrides or takes precedence
      if (!planDiscountMap[plan] || d.discountPercentage > planDiscountMap[plan].discountPercentage) {
        planDiscountMap[plan] = discountSummary;
      }
    }
  });

  return {
    discounts: activeDiscounts,
    planDiscountMap,
  };
};

/**
 * Find active discount for a specific plan.
 */
export const getActiveDiscountForPlan = async (planName) => {
  const now = new Date();
  return discountRepo.findActiveDiscountForPlan(planName, now);
};

/**
 * Update an existing discount.
 */
export const updateDiscount = async (id, updateData) => {
  const discount = await discountRepo.findDiscountById(id);
  if (!discount) {
    throw new ApiError(404, "Discount not found.");
  }

  if (updateData.planName && !VALID_PLANS.includes(updateData.planName)) {
    throw new ApiError(400, `Invalid plan name. Must be one of: ${VALID_PLANS.join(", ")}`);
  }

  if (updateData.discountPercentage !== undefined) {
    const percentage = Number(updateData.discountPercentage);
    if (isNaN(percentage) || percentage < 1 || percentage > 100) {
      throw new ApiError(400, "Discount percentage must be a number between 1 and 100.");
    }
    updateData.discountPercentage = percentage;
  }

  const start = updateData.startDate ? new Date(updateData.startDate) : discount.startDate;
  const end = updateData.endDate ? new Date(updateData.endDate) : discount.endDate;

  if (end <= start) {
    throw new ApiError(400, "End date must be later than start date.");
  }

  const updated = await discountRepo.updateDiscountById(id, updateData);
  return updated;
};

/**
 * Toggle discount active status.
 */
export const toggleDiscountStatus = async (id) => {
  const discount = await discountRepo.findDiscountById(id);
  if (!discount) {
    throw new ApiError(404, "Discount not found.");
  }

  discount.isActive = !discount.isActive;
  await discount.save();
  return discount;
};

/**
 * Delete a discount.
 */
export const deleteDiscount = async (id) => {
  const discount = await discountRepo.deleteDiscountById(id);
  if (!discount) {
    throw new ApiError(404, "Discount not found.");
  }
  return discount;
};
