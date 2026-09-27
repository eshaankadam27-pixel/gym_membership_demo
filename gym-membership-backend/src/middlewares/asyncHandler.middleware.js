/**
 * Wraps an async Express route handler so that any rejected promise
 * is automatically forwarded to the next error-handling middleware.
 *
 * @param {Function} fn - Async request handler (req, res, next) => Promise
 * @returns {Function}  - Express-compatible middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
