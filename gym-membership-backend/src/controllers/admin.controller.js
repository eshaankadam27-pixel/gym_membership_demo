import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import * as authRepo from "../repositories/auth.repository.js";
import * as userRepo from "../repositories/user.repository.js";
import { ROLES } from "../constants/roles.constant.js";
import { STATUS } from "../constants/status.constant.js";

/**
 * GET /api/v1/admin/users
 * List all users with their auth info.
 */
export const getAllUsers = asyncHandler(async (_req, res) => {
  const users = await userRepo.findAllUsers();

  res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

/**
 * GET /api/v1/admin/users/:id
 * Get a single user with auth info.
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userRepo.findUserByIdPopulated(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

/**
 * POST /api/v1/admin/users
 * Admin creates a new user (auth + profile).
 */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required.");
  }

  // Check duplicate email
  const existing = await authRepo.findAuthByEmail(email);
  if (existing) {
    throw new ApiError(409, "Email is already registered.");
  }

  // Generate username from email
  let username = email.split("@")[0].toLowerCase();
  const existingUsername = await authRepo.findAuthByUsername(username);
  if (existingUsername) {
    username = `${username}_${Date.now()}`;
  }

  // Create auth record
  const auth = await authRepo.createAuth({
    username,
    email,
    password,
    role: role && Object.values(ROLES).includes(role) ? role : ROLES.MEMBER,
    status: STATUS.ACTIVE,
  });

  // Create user profile
  const user = await userRepo.createUser({
    authId: auth._id,
    firstName: name,
    phone: phone || undefined,
  });

  // Return created user (populated)
  const populated = await userRepo.findUserByIdPopulated(user._id);

  res
    .status(201)
    .json(new ApiResponse(201, populated, "User created successfully"));
});

/**
 * PUT /api/v1/admin/users/:id
 * Admin updates user profile and/or auth fields.
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { firstName, phone, role, status } = req.body;
  const userId = req.params.id;

  const user = await userRepo.findUserByIdPopulated(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Update user profile fields
  const profileUpdates = {};
  if (firstName !== undefined) profileUpdates.firstName = firstName;
  if (phone !== undefined) profileUpdates.phone = phone;

  if (Object.keys(profileUpdates).length > 0) {
    await userRepo.updateUserById(userId, profileUpdates);
  }

  // Update auth fields (role, status)
  const authUpdates = {};
  if (role !== undefined && Object.values(ROLES).includes(role)) {
    authUpdates.role = role;
  }
  if (status !== undefined && Object.values(STATUS).includes(status)) {
    authUpdates.status = status;
  }

  if (Object.keys(authUpdates).length > 0) {
    await authRepo.updateAuthById(user.authId._id || user.authId, authUpdates);
  }

  // Return updated user
  const updated = await userRepo.findUserByIdPopulated(userId);

  res
    .status(200)
    .json(new ApiResponse(200, updated, "User updated successfully"));
});

/**
 * DELETE /api/v1/admin/users/:id
 * Deactivate a user instead of permanently deleting.
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const user = await userRepo.findUserByIdPopulated(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Soft delete: set status to INACTIVE
  const authId = user.authId._id || user.authId;
  await authRepo.updateAuthById(authId, { status: STATUS.INACTIVE });

  res
    .status(200)
    .json(new ApiResponse(200, null, "User deactivated successfully"));
});
