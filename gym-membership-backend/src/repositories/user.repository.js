import User from "../models/user.model.js";

/**
 * Data-access layer for the User collection.
 * Every method returns plain Mongoose queries/documents — no HTTP concerns.
 */

/**
 * @param {Object} data - Fields for the new User document
 * @returns {Promise<Document>}
 */
export const createUser = (data) => User.create(data);

/**
 * @param {string} id
 * @param {Object} [projection]
 * @returns {Promise<Document|null>}
 */
export const findUserById = (id, projection) => User.findById(id, projection);

/**
 * Includes the referenced Auth document.
 * @param {string} id
 * @returns {Promise<Document|null>}
 */
export const findUserByIdPopulated = (id) =>
  User.findById(id).populate("authId", "-refreshTokens");

/**
 * @param {string} authId
 * @returns {Promise<Document|null>}
 */
export const findUserByAuthId = (authId) => User.findOne({ authId });

/**
 * Includes the referenced Auth document (excluding sensitive fields).
 * @param {string} authId
 * @returns {Promise<Document|null>}
 */
export const findUserByAuthIdPopulated = (authId) =>
  User.findOne({ authId }).populate("authId", "-refreshTokens -password");

/**
 * @param {Object} filter
 * @param {Object} [projection]
 * @returns {Promise<Document[]>}
 */
export const findAllUsers = (filter = {}, projection) =>
  User.find(filter, projection).populate("authId", "-refreshTokens -password");

/**
 * @param {string} id
 * @param {Object} updateData
 * @param {Object} [options]
 * @returns {Promise<Document|null>}
 */
export const updateUserById = (id, updateData, options = {}) =>
  User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true, ...options });

/**
 * @param {string} id
 * @returns {Promise<Document|null>}
 */
export const deleteUserById = (id) => User.findByIdAndDelete(id);
