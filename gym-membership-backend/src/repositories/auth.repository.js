import Auth from "../models/auth.model.js";

/**
 * Data-access layer for the Auth collection.
 * Every method returns plain Mongoose queries/documents — no HTTP concerns.
 */

/**
 * @param {Object} data - Fields for the new Auth document
 * @returns {Promise<Document>}
 */
export const createAuth = (data) => Auth.create(data);

/**
 * @param {string} id
 * @param {Object} [projection]
 * @returns {Promise<Document|null>}
 */
export const findAuthById = (id, projection) => Auth.findById(id, projection);

/**
 * @param {string} id
 * @returns {Promise<Document|null>}  Includes the password field.
 */
export const findAuthByIdWithPassword = (id) =>
  Auth.findById(id).select("+password");

/**
 * @param {string} email
 * @returns {Promise<Document|null>}
 */
export const findAuthByEmail = (email) =>
  Auth.findOne({ email: email.toLowerCase() });

/**
 * @param {string} email
 * @returns {Promise<Document|null>}  Includes the password field.
 */
export const findAuthByEmailWithPassword = (email) =>
  Auth.findOne({ email: email.toLowerCase() }).select("+password");

/**
 * @param {string} username
 * @returns {Promise<Document|null>}
 */
export const findAuthByUsername = (username) =>
  Auth.findOne({ username: username.toLowerCase() });

/**
 * @param {string} id
 * @param {Object} updateData
 * @param {Object} [options]
 * @returns {Promise<Document|null>}
 */
export const updateAuthById = (id, updateData, options = {}) =>
  Auth.findByIdAndUpdate(id, updateData, { new: true, runValidators: true, ...options });

/**
 * @param {string} id
 * @returns {Promise<Document|null>}
 */
export const deleteAuthById = (id) => Auth.findByIdAndDelete(id);
