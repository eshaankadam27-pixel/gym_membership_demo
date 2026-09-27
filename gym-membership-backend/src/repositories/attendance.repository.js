import Attendance from "../models/attendance.model.js";

/**
 * Data-access layer for Attendance documents.
 */

export const upsertAttendance = async (userId, authId, date, updateData) => {
  return Attendance.findOneAndUpdate(
    { userId, date },
    {
      $set: {
        userId,
        authId,
        date,
        ...updateData,
      },
    },
    { new: true, upsert: true, runValidators: true }
  )
    .populate("userId", "firstName lastName phone gender profileImageUrl")
    .populate("authId", "username email role");
};

export const findAttendanceByDate = async (date) => {
  return Attendance.find({ date })
    .populate("userId", "firstName lastName phone gender profileImageUrl")
    .populate("authId", "username email role")
    .sort({ createdAt: -1 });
};

export const findAttendanceByUserId = async (userId) => {
  return Attendance.find({ userId }).sort({ date: -1 });
};

export const countAttendanceByDateAndStatus = async (date, status) => {
  return Attendance.countDocuments({ date, status });
};
