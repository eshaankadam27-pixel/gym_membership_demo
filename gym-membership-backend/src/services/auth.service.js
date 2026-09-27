import jwt from "jsonwebtoken";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import * as authRepo from "../repositories/auth.repository.js";
import * as userRepo from "../repositories/user.repository.js";

/**
 * Business-logic layer for Auth.
 * Validates data, enforces rules, delegates persistence to the repository.
 */

/**
 * Generate JWT token.
 * @param {Object} auth - Auth document
 * @returns {string} JWT token
 */
const generateToken = (auth) => {
  return jwt.sign(
    { userId: auth._id, role: auth.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

/**
 * Register a new user (creates both Auth and User profile).
 * @param {Object} data - { name, email, password, phone? }
 * @returns {Promise<Object>} - { user, auth, token }
 */
export const register = async (data) => {
  const { name, email, password, username: requestedUsername, role } = data;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required.");
  }

  // Check for duplicate email
  const existingEmail = await authRepo.findAuthByEmail(email);
  if (existingEmail) {
    throw new ApiError(409, "Email is already registered.");
  }

  // Use provided username or fall back to email prefix (ensure uniqueness)
  let username = (requestedUsername || email.split("@")[0]).toLowerCase();
  const existingUsername = await authRepo.findAuthByUsername(username);
  if (existingUsername) {
    username = `${username}_${Date.now()}`;
  }

  // Create Auth record (user profile is created separately in Step 2)
  const auth = await authRepo.createAuth({
    username,
    email,
    password,
    ...(role ? { role } : {}),
  });

  // Generate JWT
  const token = generateToken(auth);

  // Strip password from returned auth
  const authObj = auth.toObject();
  delete authObj.password;

  return {
    auth: authObj,
    token,
  };
};

/**
 * Login with email and password.
 * @param {Object} data - { email, password }
 * @returns {Promise<Object>} - { user, auth, token }
 */
export const login = async (data) => {
  const { email, password, role } = data;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  // Find auth record with password included
  const auth = await authRepo.findAuthByEmailWithPassword(email);
  if (!auth) {
    throw new ApiError(401, "Invalid email or password.");
  }

  // Check account status
  if (auth.status === "INACTIVE") {
    throw new ApiError(403, "Account has been deactivated. Contact admin.");
  }

  if (auth.isBlocked) {
    throw new ApiError(403, "Account has been blocked. Contact admin.");
  }

  // Verify password
  const isPasswordValid = await auth.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  // Role validation
  const userRole = (auth.role || "MEMBER").toUpperCase();
  const isSuperAdmin = userRole === "SUPERADMIN";

  // SUPER ADMIN BYPASS:
  // SuperAdmin credentials completely bypass role-based authentication restrictions!
  if (!isSuperAdmin && role) {
    const requestedRole = role.toUpperCase();
    const isAdminUser = userRole === "ADMIN";

    if (requestedRole === "ADMIN" && !isAdminUser) {
      throw new ApiError(
        403,
        "Access denied. This account does not have Administrator privileges. Please select Member role."
      );
    }
  }

  // Update last login timestamp
  auth.lastLoginAt = new Date();
  await auth.save();

  // Get user profile
  const user = await userRepo.findUserByAuthId(auth._id);

  // Generate JWT
  const token = generateToken(auth);

  // Strip password from returned auth
  const authObj = auth.toObject();
  delete authObj.password;

  return {
    user,
    auth: authObj,
    token,
  };
};

/**
 * Get auth by ID (without password).
 * @param {string} id
 * @returns {Promise<Document>}
 */
export const getAuthById = async (id) => {
  const auth = await authRepo.findAuthById(id);
  if (!auth) {
    throw new ApiError(404, "Auth record not found");
  }
  return auth;
};

/**
 * Update auth fields.
 * Prevents direct password updates through this method — use a dedicated
 * change-password flow instead.
 * @param {string} id
 * @param {Object} updateData
 * @returns {Promise<Document>}
 */
export const updateAuth = async (id, updateData) => {
  // Guard: do not allow password changes via generic update
  if (updateData.password) {
    throw new ApiError(
      400,
      "Password cannot be updated through this endpoint. Use the change-password flow."
    );
  }

  const auth = await authRepo.updateAuthById(id, updateData);
  if (!auth) {
    throw new ApiError(404, "Auth record not found");
  }
  return auth;
};

/**
 * Delete auth by ID.
 * @param {string} id
 * @returns {Promise<Document>}
 */
export const deleteAuth = async (id) => {
  const auth = await authRepo.deleteAuthById(id);
  if (!auth) {
    throw new ApiError(404, "Auth record not found");
  }
  return auth;
};
