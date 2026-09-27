import mongoose from "mongoose";
import { GENDERS_ARRAY } from "../constants/genders.constant.js";

const userSchema = new mongoose.Schema(
  {
    authId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: [true, "Auth reference is required"],
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: {
        values: GENDERS_ARRAY,
        message: "Gender must be one of: {VALUE}",
      },
    },
    profileImageUrl: {
      type: String,
    },
  },
  {
    timestamps: true, // auto-manages createdAt & updatedAt
  }
);

const User = mongoose.model("User", userSchema);

export default User;
