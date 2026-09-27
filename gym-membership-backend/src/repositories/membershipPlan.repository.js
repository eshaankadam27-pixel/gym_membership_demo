import MembershipPlan from "../models/membershipPlan.model.js";

/**
 * Data-access layer for the MembershipPlan collection.
 */

export const createPlan = (data) => MembershipPlan.create(data);

export const findPlanById = (id) => MembershipPlan.findById(id);

export const findAllPlans = (filter = {}) =>
  MembershipPlan.find(filter).sort({ createdAt: -1 });

export const findActivePlans = () =>
  MembershipPlan.find({ status: "ACTIVE" }).sort({ price: 1 });

export const updatePlanById = (id, updateData) =>
  MembershipPlan.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

export const deletePlanById = (id) => MembershipPlan.findByIdAndDelete(id);
