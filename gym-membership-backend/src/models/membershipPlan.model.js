import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Plan price is required"],
      min: [0, "Price cannot be negative"],
    },
    durationInDays: {
      type: Number,
      required: [true, "Duration in days is required"],
      min: [1, "Duration must be at least 1 day"],
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "INACTIVE"],
        message: "Status must be ACTIVE or INACTIVE",
      },
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

const MembershipPlan = mongoose.model("MembershipPlan", membershipPlanSchema);

export default MembershipPlan;
