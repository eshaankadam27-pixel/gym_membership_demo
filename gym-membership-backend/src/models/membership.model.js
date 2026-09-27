import mongoose from "mongoose";

/**
 * Membership — tracks a user's enrollment in a specific plan.
 *
 * Each membership links an Auth record and (optionally) a User profile
 * to a plan with pricing, duration, and active dates.
 */
const membershipSchema = new mongoose.Schema(
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
    planName: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },
    planPrice: {
      type: Number,
      required: [true, "Plan price is required"],
      min: [0, "Price cannot be negative"],
    },
    planDuration: {
      type: String,
      required: [true, "Plan duration label is required"],
      trim: true,
    },
    planDurationInDays: {
      type: Number,
      required: [true, "Plan duration in days is required"],
      min: [1, "Duration must be at least 1 day"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, "Discount percentage cannot be negative"],
      max: [100, "Discount percentage cannot exceed 100"],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "Discount amount cannot be negative"],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "EXPIRED", "CANCELLED"],
        message: "Status must be ACTIVE, EXPIRED, or CANCELLED",
      },
      default: "ACTIVE",
    },
    fitnessGoal: {
      type: String,
      enum: {
        values: ["weight_loss", "muscle_gain", "strength_training", "general_fitness", "endurance"],
        message: "Invalid fitness goal",
      },
    },
    fitnessLevel: {
      type: String,
      enum: {
        values: ["beginner", "intermediate", "advanced"],
        message: "Invalid fitness level",
      },
    },
    bodyFocus: {
      type: String,
      enum: {
        values: ["full_body", "upper_body", "lower_body", "core", "cardio"],
        message: "Invalid body focus area",
      },
    },
    dietPreference: {
      type: String,
      enum: {
        values: ["vegetarian", "non_vegetarian", "vegan", "eggetarian"],
        message: "Invalid diet preference",
      },
    },
  },
  {
    timestamps: true,
  }
);

// ── Pre-save: auto-compute endDate ────────────────────────
membershipSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("startDate") || this.isModified("planDurationInDays")) {
    const start = this.startDate || new Date();
    this.endDate = new Date(start.getTime() + this.planDurationInDays * 24 * 60 * 60 * 1000);
  }
  next();
});

const Membership = mongoose.model("Membership", membershipSchema);

export default Membership;
