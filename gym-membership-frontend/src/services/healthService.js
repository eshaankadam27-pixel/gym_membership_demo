import api from "./api";

/**
 * Health API service — mirrors backend route:
 *   GET /health
 */
export const getHealthStatus = () => api.get("/health");
