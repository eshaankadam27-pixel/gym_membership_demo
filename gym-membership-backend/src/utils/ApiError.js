/**
 * Custom API error class for operational errors.
 * Extends the native Error to carry HTTP status codes and structured error data.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode  - HTTP status code (e.g. 400, 404, 500)
   * @param {string} message     - Human-readable error message
   * @param {Array}  [errors=[]] - Optional array of granular error details
   * @param {string} [stack]     - Optional custom stack trace
   */
  constructor(statusCode, message = "Something went wrong", errors = [], stack) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.data = null;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
