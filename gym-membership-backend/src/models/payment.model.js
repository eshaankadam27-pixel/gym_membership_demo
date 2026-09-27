import mongoose from "mongoose";

/**
 * Payment Model — records transactions for membership plans and services.
 */
const paymentSchema = new mongoose.Schema(
  {
    authId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: [true, "Auth reference is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["UPI", "Credit Card", "Debit Card", "Cash", "Net Banking"],
        message: "Payment method must be UPI, Credit Card, Debit Card, Cash, or Net Banking",
      },
      default: "UPI",
    },
    status: {
      type: String,
      enum: {
        values: ["SUCCESS", "PENDING", "FAILED"],
        message: "Status must be SUCCESS, PENDING, or FAILED",
      },
      default: "SUCCESS",
    },
    transactionId: {
      type: String,
      unique: true,
      trim: true,
    },
    planName: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate human-readable transaction ID if not provided
paymentSchema.pre("save", function (next) {
  if (!this.transactionId) {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    this.transactionId = `TXN-${timestamp}-${randomSuffix}`;
  }
  next();
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
