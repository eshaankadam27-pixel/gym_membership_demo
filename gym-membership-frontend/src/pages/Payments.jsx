import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineCreditCard,
  HiOutlineCurrencyDollar,
  HiOutlineCalendarDays,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlinePrinter,
  HiOutlineArrowDownTray,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatCard from "../components/ui/StatCard";
import { getAllPayments, getPaymentStats, recordPayment } from "../services/paymentService";
import { getAllUsers } from "../services/userService";
import { getFullName, getInitials, formatDate, getErrorMessage } from "../utils/formatters";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");

  // Record Payment Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordUserId, setRecordUserId] = useState("");
  const [recordAmount, setRecordAmount] = useState("");
  const [recordPlanName, setRecordPlanName] = useState("Monthly Membership");
  const [recordMethod, setRecordMethod] = useState("UPI");
  const [recordNotes, setRecordNotes] = useState("");
  const [recording, setRecording] = useState(false);

  // Invoice Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, statsRes, usersRes] = await Promise.allSettled([
        getAllPayments(),
        getPaymentStats(),
        getAllUsers(),
      ]);

      if (payRes.status === "fulfilled") {
        const data = payRes.value.data?.data ?? payRes.value.data ?? [];
        setPayments(Array.isArray(data) ? data : []);
      }
      if (statsRes.status === "fulfilled") {
        const sData = statsRes.value.data?.data ?? statsRes.value.data;
        setStats(sData);
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

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const name = (
        p.userId?.firstName && p.userId?.lastName
          ? `${p.userId.firstName} ${p.userId.lastName}`
          : p.userId?.firstName || p.authId?.username || ""
      ).toLowerCase();
      const email = (p.authId?.email || "").toLowerCase();
      const txn = (p.transactionId || "").toLowerCase();
      const plan = (p.planName || "").toLowerCase();
      const q = search.toLowerCase();

      const matchesSearch =
        !search ||
        name.includes(q) ||
        email.includes(q) ||
        txn.includes(q) ||
        plan.includes(q);

      const matchesMethod =
        methodFilter === "ALL" || p.paymentMethod === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [payments, search, methodFilter]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!recordUserId) {
      toast.error("Please select a member.");
      return;
    }
    if (!recordAmount || Number(recordAmount) <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    setRecording(true);
    try {
      await recordPayment({
        userId: recordUserId,
        amount: Number(recordAmount),
        planName: recordPlanName,
        paymentMethod: recordMethod,
        notes: recordNotes,
      });
      toast.success("Payment recorded successfully!");
      setShowRecordModal(false);
      setRecordUserId("");
      setRecordAmount("");
      setRecordNotes("");
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRecording(false);
    }
  };

  const formatPaymentDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) return <LoadingSpinner text="Loading payment records..." />;

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1>
              <span className="gradient-text">Payments & Invoices</span>
            </h1>
            <p>Track member payments, receipts, amounts paid, and transaction history.</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowRecordModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <HiOutlinePlus /> Record Offline Payment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 28 }}>
        <StatCard
          icon={HiOutlineCurrencyDollar}
          label="Total Revenue"
          value={stats?.totalRevenue ? `₹${stats.totalRevenue.toLocaleString("en-IN")}` : "₹0"}
          colorClass="emerald"
        />
        <StatCard
          icon={HiOutlineCreditCard}
          label="Total Payments"
          value={stats?.totalCount ?? payments.length}
          colorClass="primary"
        />
        <StatCard
          icon={HiOutlineCalendarDays}
          label="This Month"
          value={stats?.monthRevenue ? `₹${stats.monthRevenue.toLocaleString("en-IN")}` : "₹0"}
          colorClass="cyan"
        />
        <StatCard
          icon={HiOutlineCheckCircle}
          label="Today's Collection"
          value={stats?.todayRevenue ? `₹${stats.todayRevenue.toLocaleString("en-IN")}` : "₹0"}
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
              placeholder="Search member name, email, transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36, width: "100%" }}
            />
          </div>

          {/* Payment Method Filter */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Method:</span>
            {["ALL", "UPI", "Credit Card", "Debit Card", "Cash"].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`btn btn-sm ${methodFilter === m ? "btn-primary" : "btn-ghost"}`}
                style={{
                  padding: "4px 12px",
                  fontSize: "0.8rem",
                  borderRadius: "20px",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <HiOutlineCreditCard style={{ fontSize: "2.5rem", color: "var(--text-muted)", marginBottom: 12 }} />
          <h3 style={{ marginBottom: 6 }}>No Payments Found</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
            {search || methodFilter !== "ALL"
              ? "No transactions matched your search criteria."
              : "No payments recorded yet. Enroll members or record payments above!"}
          </p>
          {(search || methodFilter !== "ALL") && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch("");
                setMethodFilter("ALL");
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
                <th>Member Name</th>
                <th>Amount Paid</th>
                <th>Date of Payment</th>
                <th>Plan / Purpose</th>
                <th>Payment Method</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => {
                const name =
                  getFullName(p.userId?.firstName, p.userId?.lastName) !== "Unnamed"
                    ? getFullName(p.userId?.firstName, p.userId?.lastName)
                    : p.authId?.username || "Gym Member";

                const email = p.authId?.email || "—";
                const phone = p.userId?.phone || "—";

                return (
                  <tr key={p._id}>
                    <td>
                      <div className="user-name-cell">
                        <div
                          className="user-avatar"
                          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                        >
                          {getInitials(p.userId?.firstName || p.authId?.username || "M", p.userId?.lastName || "")}
                        </div>
                        <div>
                          <div className="user-name-text" style={{ fontWeight: 600 }}>{name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          color: "var(--accent-emerald)",
                        }}
                      >
                        ₹{p.amount?.toLocaleString("en-IN")}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{formatPaymentDateTime(p.paymentDate || p.createdAt)}</div>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontWeight: 600 }}>
                        {p.planName || "Membership"}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {p.paymentMethod || "UPI"}
                      </span>
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: "0.75rem",
                          background: "rgba(0,0,0,0.3)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {p.transactionId || "TXN-DIRECT"}
                      </code>
                    </td>
                    <td>
                      <span className="badge badge-emerald" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <HiOutlineCheckCircle /> {p.status || "SUCCESS"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setActiveReceipt(p)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.8rem" }}
                      >
                        <HiOutlineDocumentText /> Invoice
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="modal-overlay visible" onClick={() => setShowRecordModal(false)}>
          <div
            className="modal-card card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480, width: "90%", padding: 28 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Record Member Payment</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowRecordModal(false)}>
                <HiOutlineXMark />
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 600 }}>
                  Select Member *
                </label>
                <select
                  className="input-field"
                  value={recordUserId}
                  onChange={(e) => setRecordUserId(e.target.value)}
                  required
                  style={{ width: "100%" }}
                >
                  <option value="">-- Choose Member --</option>
                  {users.map((u) => {
                    const fullName = getFullName(u.firstName, u.lastName) || u.authId?.username;
                    return (
                      <option key={u._id} value={u._id}>
                        {fullName} ({u.authId?.email || u.phone || "No contact"})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 600 }}>
                  Amount Paid (₹) *
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 4000"
                  value={recordAmount}
                  onChange={(e) => setRecordAmount(e.target.value)}
                  required
                  min="1"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 600 }}>
                  Plan / Purpose
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Quarterly Plan / Personal Training"
                  value={recordPlanName}
                  onChange={(e) => setRecordPlanName(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 600 }}>
                  Payment Method
                </label>
                <select
                  className="input-field"
                  value={recordMethod}
                  onChange={(e) => setRecordMethod(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 600 }}>
                  Notes / Reference
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Optional remarks"
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowRecordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={recording}>
                  {recording ? "Saving..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {activeReceipt && (
        <div className="modal-overlay visible" onClick={() => setActiveReceipt(null)}>
          <div
            className="modal-card card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, width: "90%", padding: 32 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#6366f1", letterSpacing: 0.5 }}>
                  FITTRACK FITNESS SUITE
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Official Payment Receipt</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setActiveReceipt(null)}>
                <HiOutlineXMark />
              </button>
            </div>

            {/* Receipt Details Box */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 10 }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Receipt ID:</span>
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{activeReceipt.transactionId || "TXN-DIRECT"}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Member:</span>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {getFullName(activeReceipt.userId?.firstName, activeReceipt.userId?.lastName) !== "Unnamed"
                    ? getFullName(activeReceipt.userId?.firstName, activeReceipt.userId?.lastName)
                    : activeReceipt.authId?.username || "Member"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Email:</span>
                <span style={{ fontSize: "0.85rem" }}>{activeReceipt.authId?.email || "—"}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Date & Time:</span>
                <span style={{ fontSize: "0.85rem" }}>{formatPaymentDateTime(activeReceipt.paymentDate || activeReceipt.createdAt)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Plan Description:</span>
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{activeReceipt.planName}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Payment Mode:</span>
                <span style={{ fontSize: "0.85rem" }}>{activeReceipt.paymentMethod || "UPI"}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px dashed var(--border-subtle)", marginTop: 12 }}>
                <span style={{ fontWeight: 700, fontSize: "1rem" }}>Total Amount Paid:</span>
                <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--accent-emerald)" }}>
                  ₹{activeReceipt.amount?.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                className="btn btn-ghost"
                onClick={() => window.print()}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <HiOutlinePrinter /> Print Receipt
              </button>
              <button className="btn btn-primary" onClick={() => setActiveReceipt(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
