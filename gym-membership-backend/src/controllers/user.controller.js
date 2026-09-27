import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as userService from "../services/user.service.js";

/**
 * GET /api/v1/users/me
 * Get the logged-in user's profile.
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserByAuthId(req.user.userId);

  res
    .status(200)
    .json(new ApiResponse(200, user, "Profile fetched successfully"));
});

/**
 * PUT /api/v1/users/me
 * Update the logged-in user's profile (name, phone only).
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const { firstName, phone } = req.body;

  // Only allow name and phone updates
  const allowedUpdates = {};
  if (firstName !== undefined) allowedUpdates.firstName = firstName;
  if (phone !== undefined) allowedUpdates.phone = phone;

  const user = await userService.updateUserByAuthId(req.user.userId, allowedUpdates);

  res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully"));
});

/**
 * POST /api/v1/users
 * Create a user profile linked to an existing auth record.
 */
export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);

  res
    .status(201)
    .json(new ApiResponse(201, user, "User profile created successfully"));
});

/**
 * GET /api/v1/users
 * List all user profiles.
 */
export const getAllUsers = asyncHandler(async (_req, res) => {
  const users = await userService.getAllUsers();

  res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

/**
 * GET /api/v1/users/:id
 * Get a single user profile by ID (populated with auth).
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

/**
 * PATCH /api/v1/users/:id
 * Update a user profile.
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

/**
 * DELETE /api/v1/users/:id
 * Delete a user profile.
 */
export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "User deleted successfully"));
});
