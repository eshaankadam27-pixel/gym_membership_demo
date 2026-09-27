import Membership from "../models/membership.model.js";

/**
 * Data-access layer for the Membership collection.
 * Every method returns plain Mongoose queries/documents — no HTTP concerns.
 */

/**
 * @param {Object} data - Fields for the new Membership document
 * @returns {Promise<Document>}
 */
export const createMembership = (data) => Membership.create(data);

/**
 * Find active membership for a given auth ID.
 * @param {string} authId
 * @returns {Promise<Document|null>}
 */
export const findActiveMembershipByAuthId = (authId) =>
  Membership.findOne({ authId, status: "ACTIVE" });

/**
 * Find all memberships for a given auth ID (including expired/cancelled).
 * @param {string} authId
 * @returns {Promise<Document[]>}
 */
export const findMembershipsByAuthId = (authId) =>
  Membership.find({ authId }).sort({ createdAt: -1 });

/**
 * Find a membership by ID.
 * @param {string} id
 * @returns {Promise<Document|null>}
 */
export const findMembershipById = (id) => Membership.findById(id);

/**
 * Find all memberships (admin), populated with auth and user data.
 * @param {Object} [filter]
 * @returns {Promise<Document[]>}
 */
export const findAllMemberships = (filter = {}) =>
  Membership.find(filter)
    .populate("authId", "username email role status")
    .populate("userId", "firstName lastName phone")
    .sort({ createdAt: -1 });

/**
 * Count active memberships.
 * @returns {Promise<number>}
 */
export const countActiveMemberships = () =>
  Membership.countDocuments({ status: "ACTIVE" });

/**
 * Count all memberships.
 * @returns {Promise<number>}
 */
export const countAllMemberships = () => Membership.countDocuments();

/**
 * Update a membership by ID.
 * @param {string} id
 * @param {Object} updateData
 * @returns {Promise<Document|null>}
 */
export const updateMembershipById = (id, updateData) =>
  Membership.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
