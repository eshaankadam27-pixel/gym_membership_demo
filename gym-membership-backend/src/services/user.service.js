import ApiError from "../utils/ApiError.js";
import * as userRepo from "../repositories/user.repository.js";
import * as authRepo from "../repositories/auth.repository.js";

/**
 * Business-logic layer for User profiles.
 * Validates data, enforces rules, delegates persistence to the repository.
 */

/**
 * Create a user profile linked to an existing auth record.
 * @param {Object} data - { authId, firstName, lastName?, phone?, dob?, gender?, profileImageUrl? }
 * @returns {Promise<Document>}
 */
export const createUser = async (data) => {
  const { authId } = data;

  // Ensure the referenced auth record exists
  const auth = await authRepo.findAuthById(authId);
  if (!auth) {
    throw new ApiError(404, "Auth record not found — register first");
  }

  // Ensure one-to-one: no duplicate profile for the same auth
  const existingProfile = await userRepo.findUserByAuthId(authId);
  if (existingProfile) {
    throw new ApiError(409, "A profile already exists for this auth record");
  }

  return userRepo.createUser(data);
};

/**
 * Get a single user by ID (populated with auth data).
 * @param {string} id
 * @returns {Promise<Document>}
 */
export const getUserById = async (id) => {
  const user = await userRepo.findUserByIdPopulated(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

/**
 * Get a user profile by their auth ID (populated with auth data).
 * Used for /users/me endpoint.
 * @param {string} authId
 * @returns {Promise<Document>}
 */
export const getUserByAuthId = async (authId) => {
  const user = await userRepo.findUserByAuthIdPopulated(authId);
  if (!user) {
    throw new ApiError(404, "User profile not found");
  }
  return user;
};

/**
 * Update a user profile by auth ID.
 * Used for /users/me endpoint.
 * @param {string} authId
 * @param {Object} updateData
 * @returns {Promise<Document>}
 */
export const updateUserByAuthId = async (authId, updateData) => {
  const user = await userRepo.findUserByAuthId(authId);
  if (!user) {
    throw new ApiError(404, "User profile not found");
  }

  const updated = await userRepo.updateUserById(user._id, updateData);
  return updated;
};

/**
 * List all users (with optional filter — placeholder for future pagination).
 * @param {Object} [filter]
 * @returns {Promise<Document[]>}
 */
export const getAllUsers = async (filter = {}) => {
  return userRepo.findAllUsers(filter);
};

/**
 * Update a user profile.
 * @param {string} id
 * @param {Object} updateData
 * @returns {Promise<Document>}
 */
export const updateUser = async (id, updateData) => {
  // Guard: authId must never be reassigned
  if (updateData.authId) {
    throw new ApiError(400, "authId cannot be changed after creation");
  }

  const user = await userRepo.updateUserById(id, updateData);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

/**
 * Delete a user profile.
 * @param {string} id
 * @returns {Promise<Document>}
 */
export const deleteUser = async (id) => {
  const user = await userRepo.deleteUserById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};
