import api from "./api";

/**
 * Membership API service — mirrors backend routes:
 *   POST   /memberships/enroll
 *   GET    /memberships/me
 *   GET    /memberships/stats   (admin)
 *   GET    /memberships          (admin)
 */

/**
 * Enroll in a membership plan.
 * @param {{ planName: string }} data
 * @returns {Promise}
 */
export const enrollInPlan = (data) => api.post("/memberships/enroll", data);

/**
 * Get the current user's active membership.
 * @returns {Promise}
 */
export const getMyMembership = () => api.get("/memberships/me");

/**
 * Get membership statistics (admin).
 * @returns {Promise}
 */
export const getMembershipStats = () => api.get("/memberships/stats");

/**
 * Get all memberships (admin).
 * @returns {Promise}
 */
export const getAllMemberships = () => api.get("/memberships");

/**
 * Admin assigns plan to user.
 * @param {{ userId?: string, authId?: string, planName: string, paymentMethod?: string, startDate?: string }} data
 * @returns {Promise}
 */
export const adminEnrollInPlan = (data) => api.post("/memberships/admin/enroll", data);

/**
 * Update status of a membership (admin).
 * @param {string} id
 * @param {string} status - 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
 * @returns {Promise}
 */
export const updateMembershipStatus = (id, status) =>
  api.patch(`/memberships/${id}/status`, { status });
