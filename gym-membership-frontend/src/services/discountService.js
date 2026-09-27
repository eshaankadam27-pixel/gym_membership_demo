import api from "./api";

/**
 * Discount API service.
 * Public:
 *   GET    /discounts/active
 * Admin:
 *   GET    /discounts
 *   POST   /discounts
 *   PUT    /discounts/:id
 *   PATCH  /discounts/:id/toggle
 *   DELETE /discounts/:id
 */

/**
 * Get currently active and valid discounts (public).
 * @returns {Promise<{ discounts: Array, planDiscountMap: Object }>}
 */
export const getActiveDiscounts = () => api.get("/discounts/active");

/**
 * Get all discounts for admin view.
 * @returns {Promise<Array>}
 */
export const getAllDiscounts = () => api.get("/discounts");

/**
 * Create a new discount (admin).
 * @param {{ title: string, description?: string, planName: string, discountPercentage: number, startDate: string, endDate: string, isActive?: boolean }} data
 * @returns {Promise}
 */
export const createDiscount = (data) => api.post("/discounts", data);

/**
 * Update an existing discount (admin).
 * @param {string} id
 * @param {Object} data
 * @returns {Promise}
 */
export const updateDiscount = (id, data) => api.put(`/discounts/${id}`, data);

/**
 * Toggle discount active status (admin).
 * @param {string} id
 * @returns {Promise}
 */
export const toggleDiscountStatus = (id) => api.patch(`/discounts/${id}/toggle`);

/**
 * Delete a discount (admin).
 * @param {string} id
 * @returns {Promise}
 */
export const deleteDiscount = (id) => api.delete(`/discounts/${id}`);
