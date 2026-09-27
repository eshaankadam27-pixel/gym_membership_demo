import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { ROLES, ROLES_ARRAY } from "../constants/roles.constant.js";
import { STATUS, STATUS_ARRAY } from "../constants/status.constant.js";

const SALT_ROUNDS = 10;

const authSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      minlength: [8, "Password must be at least 8 characters"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: {
        values: ROLES_ARRAY,
        message: "Role must be one of: {VALUE}",
      },
      default: ROLES.MEMBER,
    },
    status: {
      type: String,
      enum: {
        values: STATUS_ARRAY,
        message: "Status must be one of: {VALUE}",
      },
      default: STATUS.ACTIVE,
    },
    refreshTokens: [
      {
        token: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
      },
    ],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // auto-manages createdAt & updatedAt
  }
);

// ── Pre-save: hash password ───────────────────────────────
authSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    next();
  } catch (error) {
    next(error);
  }
});

// ── Instance methods ──────────────────────────────────────
/**
 * Compare a plain-text candidate against the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
authSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Auth = mongoose.model("Auth", authSchema);

export default Auth;
