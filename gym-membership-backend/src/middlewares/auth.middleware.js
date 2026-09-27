import jwt from "jsonwebtoken";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import * as authRepo from "../repositories/auth.repository.js";

/**
 * Authentication middleware.
 * Verifies the JWT from the Authorization header and attaches the
 * authenticated user's auth record to `req.user`.
 *
 * Header format: Authorization: Bearer <token>
 */
const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Access denied. No token provided.");
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Fetch the auth record to ensure user still exists and is active
    const auth = await authRepo.findAuthById(decoded.userId);

    if (!auth) {
      throw new ApiError(401, "User not found. Token is invalid.");
    }

    if (auth.status === "INACTIVE") {
      throw new ApiError(403, "Account has been deactivated. Contact admin.");
    }

    if (auth.isBlocked) {
      throw new ApiError(403, "Account has been blocked. Contact admin.");
    }

    // Attach user info to request
    req.user = {
      userId: auth._id,
      email: auth.email,
      role: auth.role,
      status: auth.status,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token."));
    }

    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token has expired. Please login again."));
    }

    next(new ApiError(401, "Authentication failed."));
  }
};

/**
 * Role-based authorization middleware.
 * Must be used AFTER `authenticate` middleware.
 *
 * @param  {...string} allowedRoles - Roles that are permitted to access the route.
 * @returns {Function} Express middleware
 *
 * Usage: router.get("/admin/data", authenticate, authorize("ADMIN"), handler)
 */
const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required."));
    }

    const userRole = (req.user.role || "").toUpperCase();
    const isSuperAdmin = userRole === "SUPERADMIN";

    // SUPER ADMIN BYPASS: SuperAdmin has full root access across all routes
    if (isSuperAdmin) {
      return next();
    }

    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
    if (!normalizedAllowed.includes(userRole)) {
      return next(
        new ApiError(403, "You do not have permission to access this resource.")
      );
    }

    next();
  };
};

/**
 * Convenience middleware — only ADMIN can access.
 */
const requireAdmin = authorize("ADMIN");

export { authenticate, authorize, requireAdmin };
