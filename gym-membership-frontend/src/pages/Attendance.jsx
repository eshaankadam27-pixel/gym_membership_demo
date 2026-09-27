import { useEffect, useState, useMemo } from "react";
import {
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiOutlineFire,
  HiOutlineXMark,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatCard from "../components/ui/StatCard";
import {
  getDailyAttendance,
  markAttendance,
  getUserAttendance,
} from "../services/attendanceService";
import { getInitials, formatDate, getErrorMessage } from "../utils/formatters";

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [rosterData, setRosterData] = useState({ roster: [], stats: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PRESENT | ABSENT | UNMARKED

  // Member History Modal
  const [historyUser, setHistoryUser] = useState(null);
  const [userHistoryData, setUserHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchAttendance = async (date) => {
    setLoading(true);
    try {
      const res = await getDailyAttendance(date);
      const data = res.data?.data ?? res.data ?? { roster: [], stats: null };
      setRosterData(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate]);

  // Date navigation helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleToday = () => {
    setSelectedDate(getTodayString());
  };

  // 1-Click Mark Attendance
  const handleMark = async (userId, newStatus) => {
    try {
      await markAttendance({
        userId,
        date: selectedDate,
        status: newStatus,
      });
      toast.success(`Marked as ${newStatus}`);

      // Update local roster immediately for snappy feel
      setRosterData((prev) => {
        const updatedRoster = prev.roster.map((item) => {
          if (item.userId === userId) {
            const nowTime = new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
            return {
              ...item,
              attendanceStatus: newStatus,
              checkInTime: newStatus === "ABSENT" ? "—" : nowTime,
            };
          }
          return item;
        });

        const present = updatedRoster.filter((r) => r.attendanceStatus === "PRESENT").length;
        const absent = updatedRoster.filter((r) => r.attendanceStatus === "ABSENT").length;
        const late = updatedRoster.filter((r) => r.attendanceStatus === "LATE").length;
        const unmarked = updatedRoster.filter((r) => r.attendanceStatus === "UNMARKED").length;
        const total = updatedRoster.length;

        return {
          ...prev,
          roster: updatedRoster,
          stats: {
            totalUsers: total,
            present,
            absent,
            late,
            unmarked,
            rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
          },
        };
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // View User History Modal
  const handleViewUserHistory = async (userItem) => {
    setHistoryUser(userItem);
    setHistoryLoading(true);
    try {
      const res = await getUserAttendance(userItem.userId);
      setUserHistoryData(res.data?.data ?? res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filter roster
  const filteredRoster = useMemo(() => {
    return (rosterData.roster || []).filter((item) => {
      const name = (item.fullName || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      const phone = (item.phone || "").toLowerCase();
      const q = search.toLowerCase();

      const matchesSearch = !search || name.includes(q) || email.includes(q) || phone.includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        item.attendanceStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rosterData.roster, search, statusFilter]);

  const stats = rosterData.stats || {
    totalUsers: 0,
    present: 0,
    absent: 0,
    late: 0,
    unmarked: 0,
    rate: 0,
  };

  const isToday = selectedDate === getTodayString();

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1>
              <span className="gradient-text">Member Attendance</span>
            </h1>
            <p>Daily member check-in register, user attendance logs, and streak tracking.</p>
          </div>

          {/* Date Selector Navigation Bar */}
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <button
              className="btn btn-ghost btn-icon"
              title="Previous Day"
              onClick={handlePrevDay}
              style={{ padding: 6 }}
            >
              <HiOutlineChevronLeft />
            </button>

            <input
              type="date"
              className="input-field"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: "4px 8px",
                fontSize: "0.85rem",
                width: "auto",
                border: "none",
                background: "transparent",
              }}
            />

            <button
              className="btn btn-ghost btn-icon"
              title="Next Day"
              onClick={handleNextDay}
              style={{ padding: 6 }}
            >
              <HiOutlineChevronRight />
            </button>

            {!isToday && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleToday}
                style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: 14 }}
              >
                Today
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 28 }}>
        <StatCard
          icon={HiOutlineCheckCircle}
          label="Present Today"
          value={stats.present}
          colorClass="emerald"
        />
        <StatCard
          icon={HiOutlineXCircle}
          label="Absent"
          value={stats.absent}
          colorClass="rose"
        />
        <StatCard
          icon={HiOutlineUserGroup}
          label="Total Registered Members"
          value={stats.totalUsers}
          colorClass="primary"
        />
        <StatCard
          icon={HiOutlineClock}
          label="Daily Attendance Rate"
          value={`${stats.rate}%`}
          colorClass="amber"
        />
      </div>

      {/* Toolbar & Filters */}
      <div className="card" style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          {/* Search */}
          <div style={{ position: "relative", minWidth: 280, flex: 1 }}>
            <HiOutlineMagnifyingGlass
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Search member name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36, width: "100%" }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Status:</span>
            {["ALL", "PRESENT", "ABSENT", "LATE", "UNMARKED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`btn btn-sm ${statusFilter === st ? "btn-primary" : "btn-ghost"}`}
                style={{
                  padding: "4px 12px",
                  fontSize: "0.8rem",
                  borderRadius: "20px",
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Roster Table */}
      {loading ? (
        <LoadingSpinner text={`Loading attendance for ${selectedDate}...`} />
      ) : filteredRoster.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <HiOutlineCalendarDays style={{ fontSize: "2.5rem", color: "var(--text-muted)", marginBottom: 12 }} />
          <h3 style={{ marginBottom: 6 }}>No Members Found</h3>
          <p style={{ color: "var(--text-muted)" }}>
            {search || statusFilter !== "ALL"
              ? "No members match the current search or status filter."
              : "No users registered yet."}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Membership Plan</th>
                <th>Attendance Status</th>
                <th>Check-in Time</th>
                <th>Quick Mark</th>
                <th>User History</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoster.map((item) => {
                const status = item.attendanceStatus;
                const statusBadge =
                  status === "PRESENT"
                    ? "badge-emerald"
                    : status === "ABSENT"
                    ? "badge-rose"
                    : status === "LATE"
                    ? "badge-amber"
                    : "badge-muted";

                return (
                  <tr key={item.userId}>
                    <td>
                      <div className="user-name-cell">
                        <div
                          className="user-avatar"
                          style={{
                            background:
                              status === "PRESENT"
                                ? "linear-gradient(135deg, #10b981, #047857)"
                                : "linear-gradient(135deg, #6366f1, #4f46e5)",
                          }}
                        >
                          {getInitials(item.firstName || "U", item.lastName || "")}
                        </div>
                        <div>
                          <div className="user-name-text" style={{ fontWeight: 600 }}>
                            {item.fullName}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {item.email} · {item.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {item.membershipPlan ? (
                        <div>
                          <span className="badge badge-primary" style={{ fontWeight: 600 }}>
                            {item.membershipPlan.planName}
                          </span>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                            Expires: {formatDate(item.membershipPlan.endDate)}
                          </div>
                        </div>
                      ) : (
                        <span
                          className="badge"
                          style={{
                            background: "rgba(239, 68, 68, 0.12)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                          }}
                        >
                          No Active Plan
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${statusBadge}`} style={{ fontWeight: 600 }}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, fontSize: "0.85rem" }}>
                        {item.checkInTime}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          className={`btn btn-sm ${status === "PRESENT" ? "btn-primary" : "btn-ghost"}`}
                          title="Mark Present"
                          onClick={() => handleMark(item.userId, "PRESENT")}
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            color: status === "PRESENT" ? "#fff" : "var(--accent-emerald)",
                            background: status === "PRESENT" ? "var(--accent-emerald)" : "transparent",
                            border: "1px solid var(--accent-emerald)",
                          }}
                        >
                          Present
                        </button>
                        <button
                          className={`btn btn-sm ${status === "LATE" ? "btn-primary" : "btn-ghost"}`}
                          title="Mark Late"
                          onClick={() => handleMark(item.userId, "LATE")}
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            color: status === "LATE" ? "#fff" : "var(--accent-amber)",
                            background: status === "LATE" ? "var(--accent-amber)" : "transparent",
                            border: "1px solid var(--accent-amber)",
                          }}
                        >
                          Late
                        </button>
                        <button
                          className={`btn btn-sm ${status === "ABSENT" ? "btn-primary" : "btn-ghost"}`}
                          title="Mark Absent"
                          onClick={() => handleMark(item.userId, "ABSENT")}
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            color: status === "ABSENT" ? "#fff" : "var(--accent-rose)",
                            background: status === "ABSENT" ? "var(--accent-rose)" : "transparent",
                            border: "1px solid var(--accent-rose)",
                          }}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleViewUserHistory(item)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.8rem" }}
                      >
                        <HiOutlineEye /> View Stats
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Member Attendance Profile & Streak Modal */}
      {historyUser && (
        <div className="modal-overlay visible" onClick={() => setHistoryUser(null)}>
          <div
            className="modal-card card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540, width: "90%", padding: 28 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                  {historyUser.fullName}
                </h2>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Member Attendance Profile & Visit Analytics
                </span>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setHistoryUser(null)}>
                <HiOutlineXMark />
              </button>
            </div>

            {historyLoading ? (
              <LoadingSpinner text="Fetching attendance history..." />
            ) : userHistoryData ? (
              <div>
                {/* Stats Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 10,
                      padding: "12px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>
                      Total Visits
                    </div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--accent-emerald)" }}>
                      {userHistoryData.stats?.totalVisits ?? 0}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 10,
                      padding: "12px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>
                      Attendance Rate
                    </div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
                      {userHistoryData.stats?.attendanceRate ?? 0}%
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 10,
                      padding: "12px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>
                      Current Streak
                    </div>
                    <div
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "var(--accent-amber)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <HiOutlineFire /> {userHistoryData.stats?.currentStreak ?? 0}d
                    </div>
                  </div>
                </div>

                {/* History Log */}
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 10 }}>
                  Recent Visit History
                </h4>
                {userHistoryData.history && userHistoryData.history.length > 0 ? (
                  <div
                    style={{
                      maxHeight: 220,
                      overflowY: "auto",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 8,
                    }}
                  >
                    <table className="data-table" style={{ fontSize: "0.85rem" }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Check-in Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userHistoryData.history.map((h) => (
                          <tr key={h._id}>
                            <td>{h.date}</td>
                            <td>
                              <span
                                className={`badge ${
                                  h.status === "PRESENT"
                                    ? "badge-emerald"
                                    : h.status === "ABSENT"
                                    ? "badge-rose"
                                    : "badge-amber"
                                }`}
                              >
                                {h.status}
                              </span>
                            </td>
                            <td>{h.checkInTime || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No prior attendance records recorded for this member.
                  </div>
                )}
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-primary" onClick={() => setHistoryUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
