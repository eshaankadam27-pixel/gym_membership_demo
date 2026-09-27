import api from "./api";

/**
 * User API service — mirrors backend routes:
 *   POST   /users
 *   GET    /users
 *   GET    /users/:id
 *   PATCH  /users/:id
 *   DELETE /users/:id
 */

/**
 * Create a user profile linked to an existing auth record.
 * @param {{ authId: string, firstName: string, lastName?: string, phone?: string, dob?: string, gender?: string }} data
 */
export const createUser = (data) => api.post("/users", data);

/**
 * Get all users (populated with auth data — excludes refreshTokens & password).
 */
export const getAllUsers = () => api.get("/users");

/**
 * Get a single user by ID (populated with auth data).
 * @param {string} id
 */
export const getUserById = (id) => api.get(`/users/${id}`);

/**
 * Update user profile fields (authId change is blocked by backend).
 * @param {string} id
 * @param {Object} data
 */
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);

/**
 * Delete a user profile.
 * @param {string} id
 */
export const deleteUser = (id) => api.delete(`/users/${id}`);
