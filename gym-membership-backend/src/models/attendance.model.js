import mongoose from "mongoose";

/**
 * Attendance Model — tracks member attendance on a daily basis.
 */
const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    authId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
    date: {
      type: String,
      required: [true, "Date is required in YYYY-MM-DD format"],
      index: true,
    },
    checkInTime: {
      type: String,
      default: () =>
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
    },
    status: {
      type: String,
      enum: {
        values: ["PRESENT", "ABSENT", "LATE"],
        message: "Status must be PRESENT, ABSENT, or LATE",
      },
      default: "PRESENT",
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

// Compound index to ensure 1 attendance entry per user per date
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
