import api from "./api";

/**
 * Attendance API service.
 */

export const getDailyAttendance = (date) =>
  api.get("/attendance", { params: { date } });

export const markAttendance = (data) => api.post("/attendance/mark", data);

export const getUserAttendance = (userId) => api.get(`/attendance/user/${userId}`);

export const getAttendanceStats = () => api.get("/attendance/stats");
