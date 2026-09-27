import Discount from "../models/discount.model.js";

/**
 * Data-access layer for the Discount collection.
 */

export const createDiscount = (data) => Discount.create(data);

export const findDiscountById = (id) => Discount.findById(id).populate("createdBy", "username email");

export const findAllDiscounts = (filter = {}) =>
  Discount.find(filter).populate("createdBy", "username email").sort({ createdAt: -1 });

export const findActiveDiscounts = (now = new Date()) =>
  Discount.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ discountPercentage: -1 });

export const findActiveDiscountForPlan = (planName, now = new Date()) =>
  Discount.findOne({
    isActive: true,
    planName: { $in: [planName, "ALL"] },
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ discountPercentage: -1 });

export const updateDiscountById = (id, updateData) =>
  Discount.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

export const deleteDiscountById = (id) => Discount.findByIdAndDelete(id);
