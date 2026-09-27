import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineUser,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatCard from "../components/ui/StatCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import {
  getAllMemberships,
  adminEnrollInPlan,
  updateMembershipStatus,
} from "../services/membershipService";
import { getAllUsers } from "../services/userService";
import { getFullName, getInitials, formatDate, getErrorMessage } from "../utils/formatters";

const PLAN_PRESETS = [
  { name: "Monthly", price: 1500, duration: "1 Month (30 Days)" },
  { name: "Quarterly", price: 4000, duration: "3 Months (90 Days)" },
  { name: "Half Yearly", price: 7500, duration: "6 Months (180 Days)" },
  { name: "Annual", price: 14000, duration: "1 Year (365 Days)" },
];

const Memberships = () => {
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | EXPIRED | CANCELLED
  const [planFilter, setPlanFilter] = useState("ALL");

  // Admin Enroll Modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollUserId, setEnrollUserId] = useState("");
  const [enrollPlan, setEnrollPlan] = useState("Quarterly");
  const [enrollPaymentMethod, setEnrollPaymentMethod] = useState("UPI");
  const [enrolling, setEnrolling] = useState(false);

  // Status change dialog
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [memRes, usersRes] = await Promise.allSettled([
        getAllMemberships(),
        getAllUsers(),
      ]);

      if (memRes.status === "fulfilled") {
        const data = memRes.value.data?.data ?? memRes.value.data ?? [];
        setMemberships(Array.isArray(data) ? data : []);
      }
      if (usersRes.status === "fulfilled") {
        const uData = usersRes.value.data?.data ?? usersRes.value.data ?? [];
        setUsers(Array.isArray(uData) ? uData : []);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const total = memberships.length;
    const active = memberships.filter((m) => m.status === "ACTIVE").length;
    const expired = memberships.filter((m) => m.status === "EXPIRED").length;
    const revenue = memberships.reduce((sum, m) => sum + (m.planPrice || 0), 0);

    const now = new Date();
    const soonThreshold = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const expiringSoon = memberships.filter(
      (m) => m.status === "ACTIVE" && new Date(m.endDate) <= soonThreshold && new Date(m.endDate) >= now
    ).length;

    return { total, active, expired, revenue, expiringSoon };
  }, [memberships]);

  // Filter memberships
  const filteredMemberships = useMemo(() => {
    return memberships.filter((m) => {
      const memberName = (
        m.userId?.firstName ||
        m.authId?.username ||
        ""
      ).toLowerCase();
      const memberEmail = (m.authId?.email || "").toLowerCase();
      const plan = (m.planName || "").toLowerCase();
      const q = search.toLowerCase();

      const matchesSearch =
        !search ||
        memberName.includes(q) ||
        memberEmail.includes(q) ||
        plan.includes(q);

      const matchesStatus =
        statusFilter === "ALL" || m.status === statusFilter;

      const matchesPlan =
        planFilter === "ALL" || m.planName === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [memberships, search, statusFilter, planFilter]);

  // Handle Admin Direct Enrollment
  const handleAdminEnroll = async (e) => {
    e.preventDefault();
    if (!enrollUserId) {
      toast.error("Please select a member to enroll.");
      return;
    }

    setEnrolling(true);
    try {
      const res = await adminEnrollInPlan({
        userId: enrollUserId,
        planName: enrollPlan,
        paymentMethod: enrollPaymentMethod,
      });
      toast.success("Membership assigned successfully!");
      setShowEnrollModal(false);
      setEnrollUserId("");
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEnrolling(false);
    }
  };

  // Handle Status Update (e.g. Cancel)
  const handleUpdateStatus = async () => {
    if (!statusTarget) return;
    setStatusUpdating(true);
    try {
      const newStatus = statusTarget.status === "ACTIVE" ? "CANCELLED" : "ACTIVE";
      await updateMembershipStatus(statusTarget._id, newStatus);
      toast.success(`Membership status updated to ${newStatus}`);
      setStatusTarget(null);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStatusUpdating(false);
    }
  };

  const getDaysRemaining = (endDateStr) => {
    const end = new Date(endDateStr);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: "Expired", isExpired: true };
    if (diff === 0) return { label: "Expires today", isUrgent: true };
    if (diff <= 7) return { label: `${diff}d left`, isUrgent: true };
    return { label: `${diff}d left`, isUrgent: false };
  };

  if (loading) return <LoadingSpinner text="Loading memberships..." />;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1>
              <span className="gradient-text">Memberships</span>
            </h1>
            <p>Active members, plan subscriptions, and expiration timelines.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              to="/discounts"
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
            >
              <span>🏷️ Manage Discounts</span>
            </Link>
            <button
              className="btn btn-primary"
              onClick={() => setShowEnrollModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <HiOutlinePlus /> Assign / Enroll Plan
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 28 }}>
        <StatCard
          icon={HiOutlineCheckCircle}
          label="Active Members"
          value={stats.active}
          colorClass="emerald"
        />
        <StatCard
          icon={HiOutlineClipboardDocumentList}
          label="Total Subscriptions"
          value={stats.total}
          colorClass="primary"
        />
        <StatCard
          icon={HiOutlineCurrencyDollar}
          label="Total Value"
          value={`₹${stats.revenue.toLocaleString("en-IN")}`}
          colorClass="amber"
        />
        <StatCard
          icon={HiOutlineClock}
          label="Expiring in 14 Days"
          value={stats.expiringSoon}
          colorClass="rose"
        />
      </div>

      {/* Toolbar & Filters */}
      <div className="card" style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          {/* Search */}
          <div style={{ position: "relative", minWidth: 260, flex: 1 }}>
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
              placeholder="Search member name, email, plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36, width: "100%" }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Status:</span>
            {["ALL", "ACTIVE", "EXPIRED", "CANCELLED"].map((st) => (
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

          {/* Plan Filter */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Plan:</span>
            <select
              className="input-field"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              style={{ padding: "6px 12px", fontSize: "0.85rem", width: "auto" }}
            >
              <option value="ALL">All Plans</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Half Yearly">Half Yearly</option>
              <option value="Annual">Annual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Memberships Table */}
      {filteredMemberships.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <HiOutlineClipboardDocumentList style={{ fontSize: "2.5rem", color: "var(--text-muted)", marginBottom: 12 }} />
          <h3 style={{ marginBottom: 6 }}>No Memberships Found</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
            {search || statusFilter !== "ALL" || planFilter !== "ALL"
              ? "No memberships matched your current filters."
              : "No members have bought a plan yet. Assign a plan above!"}
          </p>
          {(search || statusFilter !== "ALL" || planFilter !== "ALL") && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setPlanFilter("ALL");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Contact</th>
                <th>Plan Name</th>
                <th>Fee Paid</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Validity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMemberships.map((m) => {
                const name =
                  getFullName(m.userId?.firstName, m.userId?.lastName) !== "Unnamed"
                    ? getFullName(m.userId?.firstName, m.userId?.lastName)
                    : m.authId?.username || "Member";

                const email = m.authId?.email || "—";
                const phone = m.userId?.phone || "—";
                const remaining = getDaysRemaining(m.endDate);

                const statusColor =
                  m.status === "ACTIVE"
                    ? "badge-emerald"
                    : m.status === "EXPIRED"
                    ? "badge-amber"
                    : "badge-rose";

                return (
                  <tr key={m._id}>
                    <td>
                      <div className="user-name-cell">
                        <div className="user-avatar" style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
                          {getInitials(m.userId?.firstName || m.authId?.username || "M", m.userId?.lastName || "")}
                        </div>
                        <div>
                          <div className="user-name-text" style={{ fontWeight: 600 }}>{name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            @{m.authId?.username || "user"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.85rem" }}>{email}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{phone}</div>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontWeight: 600 }}>
                        {m.planName}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--accent-emerald)" }}>
                        ₹{m.planPrice?.toLocaleString("en-IN")}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.planDuration}</div>
                    </td>
                    <td>{formatDate(m.startDate)}</td>
                    <td>{formatDate(m.endDate)}</td>
                    <td>
                      <span
                        className={`badge ${
                          remaining.isExpired
                            ? "badge-rose"
                            : remaining.isUrgent
                            ? "badge-amber"
                            : "badge-cyan"
                        }`}
                      >
                        {remaining.label}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusColor}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        {m.userId?._id && (
                          <button
                            className="btn btn-ghost btn-icon"
                            title="View User Details"
                            onClick={() => navigate(`/users/${m.userId._id}`)}
                          >
                            <HiOutlineEye />
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-icon"
                          title={m.status === "ACTIVE" ? "Cancel Membership" : "Reactivate Membership"}
                          onClick={() => setStatusTarget(m)}
                          style={{
                            color: m.status === "ACTIVE" ? "var(--accent-rose)" : "var(--accent-emerald)",
                          }}
                        >
                          {m.status === "ACTIVE" ? <HiOutlineXMark /> : <HiOutlineArrowPath />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Enroll Member Modal */}
      {showEnrollModal && (
        <div className="modal-overlay visible" onClick={() => setShowEnrollModal(false)}>
          <div
            className="modal-card card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 500, width: "90%", padding: 28 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Assign Membership Plan</h2>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowEnrollModal(false)}
              >
                <HiOutlineXMark />
              </button>
            </div>

            <form onSubmit={handleAdminEnroll}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 600 }}>
                  Select Member *
                </label>
                <select
                  className="input-field"
                  value={enrollUserId}
                  onChange={(e) => setEnrollUserId(e.target.value)}
                  required
                  style={{ width: "100%" }}
                >
                  <option value="">-- Choose a registered member --</option>
                  {users.map((u) => {
                    const fullName = getFullName(u.firstName, u.lastName) || u.authId?.username;
                    return (
                      <option key={u._id} value={u._id}>
                        {fullName} ({u.authId?.email || u.phone || "No email"})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 600 }}>
                  Choose Plan *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {PLAN_PRESETS.map((p) => (
                    <div
                      key={p.name}
                      onClick={() => setEnrollPlan(p.name)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        border: enrollPlan === p.name ? "2px solid #6366f1" : "1px solid var(--border-subtle)",
                        background: enrollPlan === p.name ? "rgba(99, 102, 241, 0.12)" : "var(--card-bg)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.name}</div>
                      <div style={{ color: "var(--accent-emerald)", fontWeight: 700, fontSize: "0.85rem" }}>
                        ₹{p.price.toLocaleString("en-IN")}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.duration}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 600 }}>
                  Payment Method
                </label>
                <select
                  className="input-field"
                  value={enrollPaymentMethod}
                  onChange={(e) => setEnrollPaymentMethod(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash (In Gym)</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowEnrollModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={enrolling}
                >
                  {enrolling ? "Enrolling..." : "Confirm & Enroll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Status Change */}
      <ConfirmDialog
        isOpen={!!statusTarget}
        title={statusTarget?.status === "ACTIVE" ? "Cancel Membership" : "Reactivate Membership"}
        message={
          statusTarget?.status === "ACTIVE"
            ? `Are you sure you want to cancel the active ${statusTarget?.planName} membership for ${statusTarget?.userId?.firstName || statusTarget?.authId?.username}?`
            : `Reactivate this ${statusTarget?.planName} membership?`
        }
        confirmLabel={statusTarget?.status === "ACTIVE" ? "Cancel Membership" : "Reactivate"}
        variant={statusTarget?.status === "ACTIVE" ? "danger" : "primary"}
        loading={statusUpdating}
        onConfirm={handleUpdateStatus}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  );
};

export default Memberships;
