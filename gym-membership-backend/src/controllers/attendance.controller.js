import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as attendanceService from "../services/attendance.service.js";

/**
 * GET /api/v1/attendance
 * Get daily roster and statistics for a given date (?date=YYYY-MM-DD).
 */
export const getDailyAttendance = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const result = await attendanceService.getDailyRoster(date);
  res.status(200).json(new ApiResponse(200, result, "Daily attendance roster fetched successfully"));
});

/**
 * POST /api/v1/attendance/mark
 * Mark or update attendance for a user.
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const record = await attendanceService.markAttendance(req.body);
  res.status(200).json(new ApiResponse(200, record, "Attendance marked successfully"));
});

/**
 * GET /api/v1/attendance/user/:userId
 * Get user-specific attendance history and streak.
 */
export const getUserAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getUserAttendanceHistory(req.params.userId);
  res.status(200).json(new ApiResponse(200, result, "User attendance history fetched successfully"));
});

/**
 * GET /api/v1/attendance/stats
 * Overview stats for attendance.
 */
export const getAttendanceStats = asyncHandler(async (_req, res) => {
  const result = await attendanceService.getAttendanceOverviewStats();
  res.status(200).json(new ApiResponse(200, result.stats, "Attendance stats fetched successfully"));
});
