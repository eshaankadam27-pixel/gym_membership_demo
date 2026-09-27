import axios from "axios";

/**
 * Centralized Axios instance.
 * Base URL comes from VITE_API_URL env variable → http://localhost:5000/api/v1
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ── Request interceptor: attach JWT ───────────────────
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("fittrack_token");
      if (token && token !== "null" && token !== "undefined" && token.trim() !== "") {
        if (config.headers && typeof config.headers.set === "function") {
          config.headers.set("Authorization", `Bearer ${token.trim()}`);
        } else {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token.trim()}`;
        }
      }
    } catch (e) {
      console.warn("Could not read token from localStorage:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────
// The backend wraps every response in: { statusCode, success, message, data }
// We extract `data` for convenience, but keep the full response available.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Let the caller handle errors — just pass through
    return Promise.reject(error);
  }
);

export default api;

