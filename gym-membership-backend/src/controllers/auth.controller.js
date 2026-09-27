import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as authService from "../services/auth.service.js";

/**
 * POST /api/v1/auth/register
 * Register a new user (creates auth + user profile, returns JWT).
 */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res
    .status(201)
    .json(new ApiResponse(201, result, "User registered successfully"));
});

/**
 * POST /api/v1/auth/login
 * Login with email and password, returns JWT.
 */
export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Login successful"));
});

/**
 * GET /api/v1/auth/:id
 * Retrieve an auth record by ID.
 */
export const getAuthById = asyncHandler(async (req, res) => {
  const auth = await authService.getAuthById(req.params.id);

  res
    .status(200)
    .json(new ApiResponse(200, auth, "Auth record fetched successfully"));
});

/**
 * PATCH /api/v1/auth/:id
 * Update auth fields (role, isBlocked, etc.). Password changes are blocked.
 */
export const updateAuth = asyncHandler(async (req, res) => {
  const auth = await authService.updateAuth(req.params.id, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, auth, "Auth record updated successfully"));
});

/**
 * DELETE /api/v1/auth/:id
 * Delete an auth record.
 */
export const deleteAuth = asyncHandler(async (req, res) => {
  await authService.deleteAuth(req.params.id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Auth record deleted successfully"));
});
