import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Discount title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    planName: {
      type: String,
      required: [true, "Plan name is required"],
      enum: {
        values: ["Monthly", "Quarterly", "Half Yearly", "Annual", "ALL"],
        message: "Plan must be Monthly, Quarterly, Half Yearly, Annual, or ALL",
      },
      default: "Monthly",
    },
    discountPercentage: {
      type: Number,
      required: [true, "Discount percentage is required"],
      min: [1, "Discount percentage must be at least 1%"],
      max: [100, "Discount percentage cannot exceed 100%"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, "End date / expiry is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
  },
  {
    timestamps: true,
  }
);

// Index for quickly retrieving active discounts by plan and date range
discountSchema.index({ planName: 1, isActive: 1, startDate: 1, endDate: 1 });

const Discount = mongoose.model("Discount", discountSchema);

export default Discount;
