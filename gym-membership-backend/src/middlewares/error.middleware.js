import env from "../config/env.js";

/**
 * Global error-handling middleware.
 * Normalises both operational (ApiError) and unexpected errors into a
 * consistent JSON shape.  Stack traces are only exposed in development.
 *
 * Must be registered as the LAST middleware in app.js.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  const response = {
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
    ...(env.isDevelopment && { stack: err.stack }),
  };

  console.error(`❌  [${statusCode}] ${message}`);
  if (env.isDevelopment) {
    console.error(err.stack);
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
