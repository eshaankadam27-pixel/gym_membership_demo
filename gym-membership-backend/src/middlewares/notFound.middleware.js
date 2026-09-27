import ApiError from "../utils/ApiError.js";

/**
 * Catch-all middleware for routes that don't match any defined endpoint.
 * Must be registered AFTER all route handlers.
 */
const notFoundHandler = (_req, _res, next) => {
  next(new ApiError(404, "Resource not found"));
};

export default notFoundHandler;
