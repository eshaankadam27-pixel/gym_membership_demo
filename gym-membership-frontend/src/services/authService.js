import api from "./api";

/**
 * Auth API service — mirrors backend routes:
 *   POST   /auth/register
 *   POST   /auth/login
 *   GET    /auth/:id
 *   PATCH  /auth/:id
 *   DELETE /auth/:id
 */

/**
 * Register a new auth record.
 * @param {{ username: string, email: string, password: string, role?: string }} data
 * @returns {Promise<{ statusCode, success, message, data }>}
 */
export const registerAuth = (data) => api.post("/auth/register", data);

/**
 * Login with email and password.
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ statusCode, success, message, data: { user, auth, token } }>}
 */
export const loginAuth = (data) => api.post("/auth/login", data);

/**
 * Get auth record by ID (password excluded by backend).
 * @param {string} id
 */
export const getAuthById = (id) => api.get(`/auth/${id}`);

/**
 * Update auth fields (password update is blocked by backend).
 * @param {string} id
 * @param {Object} data
 */
export const updateAuth = (id, data) => api.patch(`/auth/${id}`, data);

/**
 * Delete auth record.
 * @param {string} id
 */
export const deleteAuth = (id) => api.delete(`/auth/${id}`);

