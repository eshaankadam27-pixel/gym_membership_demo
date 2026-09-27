import { useEffect, useState } from "react";
import {
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlineCurrencyDollar,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineHeart,
} from "react-icons/hi2";
import StatCard from "../components/ui/StatCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { getAllUsers } from "../services/userService";
import { getHealthStatus } from "../services/healthService";
import { getAllMemberships, getMembershipStats } from "../services/membershipService";

const Dashboard = () => {
  const [userCount, setUserCount] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [membershipStats, setMembershipStats] = useState(null);
  const [memberships, setMemberships] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, healthRes, statsRes, membershipsRes] =
          await Promise.allSettled([
            getAllUsers(),
            getHealthStatus(),
            getMembershipStats(),
            getAllMemberships(),
          ]);

        if (usersRes.status === "fulfilled") {
          const users = usersRes.value.data?.data ?? usersRes.value.data;
          setUserCount(Array.isArray(users) ? users.length : 0);
        }

        if (healthRes.status === "fulfilled") {
          setHealth(healthRes.value.data?.data ?? healthRes.value.data);
        }

        if (statsRes.status === "fulfilled") {
          setMembershipStats(
            statsRes.value.data?.data ?? statsRes.value.data
          );
        }

        if (membershipsRes.status === "fulfilled") {
          const data =
            membershipsRes.value.data?.data ?? membershipsRes.value.data;
          setMemberships(Array.isArray(data) ? data : []);
        }
      } catch {
        // silently handle — stat cards will show "—"
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate total revenue from memberships
  const totalRevenue = memberships.reduce(
    (sum, m) => sum + (m.planPrice || 0),
    0
  );

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>
          <span className="gradient-text">Dashboard</span>
        </h1>
        <p>Welcome to GymPro — your gym membership management hub.</p>
      </div>

      {/* Health banner */}
      {health && (
        <div
          className="card"
          style={{
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "16px 24px",
          }}
        >
          <HiOutlineHeart
            style={{
              fontSize: "1.3rem",
              color:
                health.database === "connected"
                  ? "var(--accent-emerald)"
                  : "var(--accent-rose)",
            }}
          />
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
              Server {health.server === "running" ? "Online" : "Offline"} ·
              Database{" "}
              {health.database === "connected" ? "Connected" : "Disconnected"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Uptime: {health.uptime}
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-section-title">Overview</div>
      <div className="dashboard-grid">
        <StatCard
          icon={HiOutlineUsers}
          label="Total Users"
          value={userCount ?? "—"}
          colorClass="primary"
        />
        <StatCard
          icon={HiOutlineClipboardDocumentList}
          label="Active Memberships"
          value={membershipStats?.activeMemberships ?? "—"}
          colorClass="emerald"
        />
        <StatCard
          icon={HiOutlineCurrencyDollar}
          label="Revenue"
          value={
            totalRevenue > 0
              ? `₹${totalRevenue.toLocaleString("en-IN")}`
              : "—"
          }
          colorClass="amber"
        />
        <StatCard
          icon={HiOutlineCalendarDays}
          label="Total Enrollments"
          value={membershipStats?.totalMemberships ?? "—"}
          colorClass="cyan"
        />
      </div>

      {/* Recent Enrollments */}
      <div className="dashboard-section-title" style={{ marginTop: 32 }}>
        Recent Enrollments
      </div>
      {memberships.length > 0 ? (
        <div className="card" style={{ overflow: "auto" }}>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Price</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {memberships.slice(0, 20).map((m) => {
                const name =
                  m.userId?.firstName ||
                  m.authId?.username ||
                  "Unknown";
                const email = m.authId?.email || "—";
                const statusClass =
                  m.status === "ACTIVE"
                    ? "badge-emerald"
                    : m.status === "EXPIRED"
                      ? "badge-amber"
                      : "badge-rose";

                return (
                  <tr key={m._id}>
                    <td style={{ fontWeight: 600 }}>{name}</td>
                    <td style={{ color: "var(--text-muted)" }}>{email}</td>
                    <td>{m.planName}</td>
                    <td>₹{m.planPrice?.toLocaleString("en-IN")}</td>
                    <td>
                      {new Date(m.startDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      {new Date(m.endDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <span className={`badge ${statusClass}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "40px 24px",
            color: "var(--text-muted)",
          }}
        >
          <HiOutlineChartBar
            style={{ fontSize: "2rem", marginBottom: 12, opacity: 0.5 }}
          />
          <p>No enrollments yet. Members will appear here once they enroll in plans.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
