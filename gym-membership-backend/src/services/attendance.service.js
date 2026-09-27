import ApiError from "../utils/ApiError.js";
import * as attendanceRepo from "../repositories/attendance.repository.js";
import * as userRepo from "../repositories/user.repository.js";
import * as membershipRepo from "../repositories/membership.repository.js";

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Mark or update attendance for a user.
 */
export const markAttendance = async ({ userId, date, status, checkInTime, notes }) => {
  if (!userId) {
    throw new ApiError(400, "User ID is required.");
  }

  const user = await userRepo.findUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const targetDate = date || getTodayDateString();
  const targetStatus = status || "PRESENT";
  const nowTime =
    checkInTime ||
    new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const record = await attendanceRepo.upsertAttendance(user._id, user.authId, targetDate, {
    status: targetStatus,
    checkInTime: targetStatus === "ABSENT" ? "—" : nowTime,
    notes: notes || "",
  });

  return record;
};

/**
 * Get daily attendance roster with user and membership details.
 */
export const getDailyRoster = async (date) => {
  const targetDate = date || getTodayDateString();

  const [users, attendanceRecords, activeMemberships] = await Promise.all([
    userRepo.findAllUsers(),
    attendanceRepo.findAttendanceByDate(targetDate),
    membershipRepo.findAllMemberships({ status: "ACTIVE" }),
  ]);

  // Index attendance by userId string
  const attendanceMap = new Map();
  attendanceRecords.forEach((rec) => {
    const uId = rec.userId?._id?.toString() || rec.userId?.toString();
    if (uId) attendanceMap.set(uId, rec);
  });

  // Index active memberships by userId & authId
  const membershipMap = new Map();
  activeMemberships.forEach((m) => {
    const uId = m.userId?._id?.toString() || m.userId?.toString();
    const aId = m.authId?._id?.toString() || m.authId?.toString();
    if (uId) membershipMap.set(uId, m);
    if (aId) membershipMap.set(aId, m);
  });

  // Build daily roster
  const roster = users.map((user) => {
    const uId = user._id.toString();
    const aId = user.authId?._id?.toString() || user.authId?.toString();
    const attendance = attendanceMap.get(uId);
    const membership = membershipMap.get(uId) || membershipMap.get(aId);

    const fName = user.firstName && user.firstName !== "undefined" ? user.firstName : "";
    const lName = user.lastName && user.lastName !== "undefined" ? user.lastName : "";
    const nameStr = `${fName} ${lName}`.trim();

    return {
      userId: user._id,
      firstName: fName,
      lastName: lName,
      fullName: nameStr || user.authId?.username || "Member",
      email: user.authId?.email || "—",
      phone: user.phone || "—",
      gender: user.gender || "—",
      membershipPlan: membership
        ? {
            planName: membership.planName,
            planPrice: membership.planPrice,
            startDate: membership.startDate,
            endDate: membership.endDate,
            status: membership.status,
          }
        : null,
      attendanceStatus: attendance ? attendance.status : "UNMARKED",
      checkInTime: attendance ? attendance.checkInTime : "—",
      attendanceId: attendance?._id || null,
      notes: attendance?.notes || "",
    };
  });

  const presentCount = roster.filter((r) => r.attendanceStatus === "PRESENT").length;
  const lateCount = roster.filter((r) => r.attendanceStatus === "LATE").length;
  const absentCount = roster.filter((r) => r.attendanceStatus === "ABSENT").length;
  const unmarkedCount = roster.filter((r) => r.attendanceStatus === "UNMARKED").length;

  return {
    date: targetDate,
    stats: {
      totalUsers: roster.length,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      unmarked: unmarkedCount,
      rate: roster.length > 0 ? Math.round(((presentCount + lateCount) / roster.length) * 100) : 0,
    },
    roster,
  };
};

/**
 * Get attendance statistics and history for a specific user.
 */
export const getUserAttendanceHistory = async (userId) => {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const records = await attendanceRepo.findAttendanceByUserId(userId);

  const totalPresent = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  const totalAbsent = records.filter((r) => r.status === "ABSENT").length;
  const totalRecorded = records.length;

  // Compute current streak (consecutive days marked PRESENT/LATE)
  let currentStreak = 0;
  // Sort descending by date
  const sortedDates = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  for (const rec of sortedDates) {
    if (rec.status === "PRESENT" || rec.status === "LATE") {
      currentStreak += 1;
    } else {
      break;
    }
  }

  return {
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    },
    stats: {
      totalVisits: totalPresent,
      totalAbsent,
      totalRecorded,
      attendanceRate: totalRecorded > 0 ? Math.round((totalPresent / totalRecorded) * 100) : 0,
      currentStreak,
    },
    history: records,
  };
};

/**
 * Get overall attendance stats.
 */
export const getAttendanceOverviewStats = async () => {
  const today = getTodayDateString();
  return getDailyRoster(today);
};
