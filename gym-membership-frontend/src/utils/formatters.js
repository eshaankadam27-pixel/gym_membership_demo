/**
 * Format an ISO date string to a human-readable format.
 * @param {string} dateStr - ISO 8601 date string
 * @returns {string} Formatted date like "Aug 30, 2026"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

/**
 * Format a date for an input[type="date"] value.
 * @param {string} dateStr - ISO 8601 date string
 * @returns {string} "YYYY-MM-DD"
 */
export const formatDateForInput = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

/**
 * Get initials from first/last name.
 * @param {string} firstName
 * @param {string} [lastName]
 * @returns {string} e.g. "JD"
 */
export const getInitials = (firstName, lastName) => {
  const f = firstName && firstName !== "undefined" ? firstName.charAt(0).toUpperCase() : "";
  const l = lastName && lastName !== "undefined" ? lastName.charAt(0).toUpperCase() : "";
  return f + l || "?";
};

/**
 * Get full name from first + last.
 * @param {string} firstName
 * @param {string} [lastName]
 * @returns {string}
 */
export const getFullName = (firstName, lastName) => {
  return [firstName, lastName]
    .filter((p) => p && p !== "undefined")
    .join(" ") || "Unnamed";
};

/**
 * Normalize API error to a user-friendly message.
 * Matches the backend's error response shape: { success, statusCode, message, errors }
 * @param {Error} error - Axios error
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  if (error.response) {
    const { data, status } = error.response;
    // Backend ApiError shape
    if (data?.message) return data.message;
    // Fallback by status
    if (status === 400) return "Invalid request. Please check your input.";
    if (status === 401) return "Unauthorized. Please log in.";
    if (status === 404) return "Resource not found.";
    if (status === 409) return "This record already exists.";
    if (status === 500) return "Server error. Please try again later.";
    return `Server error (${status})`;
  }
  if (error.request) {
    return "Unable to connect to the server. Please check your connection.";
  }
  return error.message || "An unexpected error occurred.";
};
