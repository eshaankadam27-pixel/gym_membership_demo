import api from "./api";

/**
 * Payment API service.
 */

export const getAllPayments = () => api.get("/payments");

export const getPaymentStats = () => api.get("/payments/stats");

export const recordPayment = (data) => api.post("/payments", data);

export const getMyPayments = () => api.get("/payments/me");
