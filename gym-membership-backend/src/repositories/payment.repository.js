import Payment from "../models/payment.model.js";

/**
 * Data-access layer for Payment documents.
 */

export const createPayment = (data) => Payment.create(data);

export const findAllPayments = (filter = {}) =>
  Payment.find(filter)
    .populate("authId", "username email role status")
    .populate("userId", "firstName lastName phone gender")
    .populate("membershipId", "planName planPrice planDuration startDate endDate status")
    .sort({ paymentDate: -1, createdAt: -1 });

export const findPaymentById = (id) =>
  Payment.findById(id)
    .populate("authId", "username email role")
    .populate("userId", "firstName lastName phone")
    .populate("membershipId");

export const findPaymentsByAuthId = (authId) =>
  Payment.find({ authId }).sort({ paymentDate: -1 });

export const countPayments = (filter = {}) => Payment.countDocuments(filter);

export const aggregateRevenue = async () => {
  const result = await Payment.aggregate([
    { $match: { status: "SUCCESS" } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { totalRevenue: 0, count: 0 };
};
