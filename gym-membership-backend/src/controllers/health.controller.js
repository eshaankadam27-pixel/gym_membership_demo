import mongoose from "mongoose";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";

/**
 * GET /api/v1/health
 * Returns server uptime and MongoDB connection readiness.
 */
export const getHealthStatus = asyncHandler(async (_req, res) => {
  const healthData = {
    server: "running",
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  };

  res
    .status(200)
    .json(new ApiResponse(200, healthData, "Service is healthy"));
});
