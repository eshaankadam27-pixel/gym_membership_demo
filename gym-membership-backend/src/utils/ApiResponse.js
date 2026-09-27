/**
 * Standard API success response wrapper.
 * Ensures every successful response follows a consistent shape:
 * { statusCode, success, message, data }
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code (2xx)
   * @param {*}      data       - Response payload
   * @param {string} [message]  - Human-readable success message
   */
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}

export default ApiResponse;
