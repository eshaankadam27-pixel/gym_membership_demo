import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineTag,
  HiOutlinePlus,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
  HiOutlineCurrencyDollar,
  HiOutlineBolt,
  HiOutlineSparkles,
  HiOutlineMagnifyingGlass,
  HiOutlineEye,
  HiXMark,
  HiOutlineArrowTrendingDown,
  HiOutlineFire,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatCard from "../components/ui/StatCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import {
  getAllDiscounts,
  createDiscount,
  updateDiscount,
  toggleDiscountStatus,
  deleteDiscount,
} from "../services/discountService";
import { formatDate, getErrorMessage } from "../utils/formatters";

const PLAN_PRICES = {
  Monthly: 1500,
  Quarterly: 4000,
  "Half Yearly": 7500,
  Annual: 14000,
};

const PLAN_DURATIONS = {
  Monthly: "30 Days (1 Month)",
  Quarterly: "90 Days (3 Months)",
  "Half Yearly": "180 Days (6 Months)",
  Annual: "365 Days (1 Year)",
};

const PLAN_OPTIONS = [
  { value: "Monthly", label: "Monthly Plan — ₹1,500 / mo" },
  { value: "Quarterly", label: "Quarterly Plan — ₹4,000 / 3 mo" },
  { value: "Half Yearly", label: "Half Yearly Plan — ₹7,500 / 6 mo" },
  { value: "Annual", label: "Annual Plan — ₹14,000 / yr" },
  { value: "ALL", label: "🌟 All Membership Plans (Site-wide)" },
];

const PRESET_PERCENTAGES = [10, 15, 20, 25, 30, 40, 50];

const PRESET_DURATIONS = [
  { label: "+3 Days", days: 3 },
  { label: "+7 Days", days: 7 },
  { label: "+14 Days", days: 14 },
  { label: "+30 Days", days: 30 },
  { label: "+60 Days", days: 60 },
];

const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | EXPIRED | UPCOMING | INACTIVE
  const [planFilter, setPlanFilter] = useState("ALL");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    planName: "Monthly",
    discountPercentage: 20,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
  });

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await getAllDiscounts();
      const data = res.data?.data ?? res.data ?? [];
      setDiscounts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  // Stats computation
  const stats = useMemo(() => {
    const total = discounts.length;
    const active = discounts.filter((d) => d.computedStatus === "ACTIVE").length;
    const expired = discounts.filter((d) => d.computedStatus === "EXPIRED").length;
    const monthlyDiscounts = discounts.filter(
      (d) => (d.planName === "Monthly" || d.planName === "ALL") && d.computedStatus === "ACTIVE"
    ).length;
    return { total, active, expired, monthlyDiscounts };
  }, [discounts]);

  // Filtered discounts
  const filteredDiscounts = useMemo(() => {
    return discounts.filter((d) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        d.title?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.planName?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" || d.computedStatus === statusFilter;

      const matchesPlan =
        planFilter === "ALL" || d.planName === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [discounts, search, statusFilter, planFilter]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingDiscount(null);
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setFormData({
      title: "Monthly Membership Special Discount",
      description: "Limited time promotional discount for new and renewing members",
      planName: "Monthly",
      discountPercentage: 20,
      startDate: now.toISOString().slice(0, 16),
      endDate: end.toISOString().slice(0, 16),
      isActive: true,
    });
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item) => {
    setEditingDiscount(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      planName: item.planName,
      discountPercentage: item.discountPercentage,
      startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : "",
      endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : "",
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  // Quick preset duration click (dynamically sets endDate from startDate)
  const applyPresetDuration = (days) => {
    const start = formData.startDate ? new Date(formData.startDate) : new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    setFormData((prev) => ({
      ...prev,
      endDate: end.toISOString().slice(0, 16),
    }));
  };

  // Dynamic step adjust duration by +1 or -1 day
  const adjustDurationDays = (deltaDays) => {
    const currentEnd = formData.endDate ? new Date(formData.endDate) : new Date();
    const newEnd = new Date(currentEnd.getTime() + deltaDays * 24 * 60 * 60 * 1000);
    const start = formData.startDate ? new Date(formData.startDate) : new Date();
    if (newEnd > start) {
      setFormData((prev) => ({
        ...prev,
        endDate: newEnd.toISOString().slice(0, 16),
      }));
    } else {
      toast.error("End date cannot be earlier than start date.");
    }
  };

  // Dynamic duration calculation in modal
  const durationSummary = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return null;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const now = new Date();
    const diffMs = end.getTime() - start.getTime();

    if (diffMs <= 0) {
      return { isValid: false, message: "End date must be after start date." };
    }

    const totalDays = Math.round((diffMs / (1000 * 60 * 60 * 24)) * 10) / 10;
    const totalHours = Math.round(diffMs / (1000 * 60 * 60));

    let status = "ACTIVE";
    let statusLabel = "🟢 Active Now";
    let statusColor = "#10B981";

    if (now < start) {
      status = "UPCOMING";
      const startInDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      statusLabel = `⏳ Upcoming in ${startInDays} day${startInDays > 1 ? "s" : ""}`;
      statusColor = "#38BDF8";
    } else if (now > end) {
      status = "EXPIRED";
      statusLabel = "🔴 Expired";
      statusColor = "#EF4444";
    } else {
      const remainingDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      statusLabel = `🟢 Active (Ends in ${remainingDays} day${remainingDays > 1 ? "s" : ""})`;
    }

    return {
      isValid: true,
      totalDays,
      totalHours,
      status,
      statusLabel,
      statusColor,
      formattedEnd: end.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
    };
  }, [formData.startDate, formData.endDate]);

  // Dynamic live pricing preview
  const pricingCalculations = useMemo(() => {
    const pct = formData.discountPercentage || 0;
    const target = formData.planName;

    if (target === "ALL") {
      // Calculate for all plans
      return Object.entries(PLAN_PRICES).map(([name, price]) => {
        const discountAmount = Math.round((price * pct) / 100);
        const finalPrice = price - discountAmount;
        return {
          name,
          originalPrice: price,
          discountAmount,
          finalPrice,
          percentage: pct,
        };
      });
    } else {
      const price = PLAN_PRICES[target] || 1500;
      const discountAmount = Math.round((price * pct) / 100);
      const finalPrice = price - discountAmount;
      return [
        {
          name: target,
          originalPrice: price,
          discountAmount,
          finalPrice,
          percentage: pct,
        },
      ];
    }
  }, [formData.planName, formData.discountPercentage]);

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Please enter a discount title.");
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error("End date must be later than start date.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingDiscount) {
        await updateDiscount(editingDiscount._id, formData);
        toast.success(`Discount "${formData.title}" updated dynamically!`);
      } else {
        await createDiscount(formData);
        toast.success("New discount added! Visible on membership plan cards.");
      }
      setShowModal(false);
      fetchDiscounts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Instant inline toggle active status
  const handleToggle = async (id, currentStatus) => {
    // Optimistic update
    setDiscounts((prev) =>
      prev.map((d) => (d._id === id ? { ...d, isActive: !d.isActive } : d))
    );
    try {
      await toggleDiscountStatus(id);
      toast.success(`Discount ${!currentStatus ? "activated" : "deactivated"}!`);
      fetchDiscounts();
    } catch (err) {
      toast.error(getErrorMessage(err));
      fetchDiscounts();
    }
  };

  // Delete discount
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDiscount(deleteTarget._id);
      toast.success("Discount deleted successfully.");
      setDeleteTarget(null);
      fetchDiscounts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 60 }}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.8rem" }}>🏷️</span>
            <h1 style={{ margin: 0 }}>Plan Discounts & Offers</h1>
          </div>
          <p style={{ marginTop: 4 }}>
            Create and edit promotional discounts with custom durations. Changes dynamically reflect on plan cards and during checkout.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchDiscounts}
            disabled={loading}
            title="Refresh Discounts"
          >
            <HiOutlineArrowPath className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <HiOutlinePlus style={{ fontSize: "1.1rem" }} />
            <span>Add Discount</span>
          </button>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard
          icon="HiOutlineTag"
          label="Total Campaigns"
          value={stats.total}
          variant="primary"
        />
        <StatCard
          icon="HiOutlineCheckCircle"
          label="Active Campaigns"
          value={stats.active}
          variant="success"
        />
        <StatCard
          icon="HiOutlineClock"
          label="Expired Offers"
          value={stats.expired}
          variant="warning"
        />
        <StatCard
          icon="HiOutlineBolt"
          label="Monthly Plan Offers"
          value={stats.monthlyDiscounts}
          variant="info"
        />
      </div>

      {/* ── Filter / Search Bar ────────────────────────────── */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Search Input */}
          <div style={{ position: "relative", minWidth: 260, flex: "1 1 260px" }}>
            <HiOutlineMagnifyingGlass
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                fontSize: "1.1rem",
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search by campaign title, plan, or note…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {/* Status Filter */}
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "auto" }}
            >
              <option value="ALL">All Statuses ({discounts.length})</option>
              <option value="ACTIVE">Active Now ({stats.active})</option>
              <option value="EXPIRED">Expired ({stats.expired})</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="INACTIVE">Disabled</option>
            </select>

            {/* Plan Filter */}
            <select
              className="form-input"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              style={{ width: "auto" }}
            >
              <option value="ALL">All Target Plans</option>
              <option value="Monthly">Monthly Plan</option>
              <option value="Quarterly">Quarterly Plan</option>
              <option value="Half Yearly">Half Yearly Plan</option>
              <option value="Annual">Annual Plan</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Discounts Table Card (Scrollable & Responsive) ─── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <LoadingSpinner size="lg" />
            <p style={{ marginTop: 12, color: "var(--text-secondary)" }}>
              Loading promotional discounts…
            </p>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div style={{ padding: 48 }}>
            <EmptyState
              icon="HiOutlineTag"
              title="No Discounts Found"
              description={
                search || statusFilter !== "ALL" || planFilter !== "ALL"
                  ? "No discounts match your filter criteria. Try adjusting your search query."
                  : "No promotional discounts currently configured. Click 'Add Discount' to create one!"
              }
              action={
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOpenCreate}
                >
                  <HiOutlinePlus /> Create First Discount
                </button>
              }
            />
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table className="data-table" style={{ width: "100%", minWidth: 840 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 220 }}>Campaign & Title</th>
                  <th>Target Plan</th>
                  <th>Discount %</th>
                  <th>Effective Price</th>
                  <th style={{ minWidth: 200 }}>Duration & Timeline</th>
                  <th>Status</th>
                  <th>Quick Toggle</th>
                  <th style={{ textAlign: "right", minWidth: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.map((d) => {
                  const now = new Date();
                  const start = new Date(d.startDate);
                  const end = new Date(d.endDate);
                  const isCurrent = now >= start && now <= end && d.isActive;
                  const msRemaining = end.getTime() - now.getTime();
                  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

                  let statusBadge = "neutral";
                  let statusText = d.computedStatus;
                  if (d.computedStatus === "ACTIVE") {
                    statusBadge = "success";
                    statusText = "Active Now";
                  } else if (d.computedStatus === "EXPIRED") {
                    statusBadge = "danger";
                    statusText = "Expired";
                  } else if (d.computedStatus === "UPCOMING") {
                    statusBadge = "info";
                    statusText = "Upcoming";
                  }

                  return (
                    <tr
                      key={d._id}
                      style={{
                        background: isCurrent ? "rgba(16, 185, 129, 0.04)" : undefined,
                        transition: "background 0.2s ease",
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.94rem" }}>
                          {d.title}
                        </div>
                        {d.description && (
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--text-muted)",
                              marginTop: 2,
                              maxWidth: 280,
                              lineHeight: 1.4,
                            }}
                          >
                            {d.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            background:
                              d.planName === "Monthly"
                                ? "rgba(99, 102, 241, 0.14)"
                                : "var(--bg-hover)",
                            color:
                              d.planName === "Monthly"
                                ? "var(--primary-light)"
                                : "var(--text-primary)",
                            border:
                              d.planName === "Monthly"
                                ? "1px solid rgba(99, 102, 241, 0.3)"
                                : "1px solid var(--border-default)",
                          }}
                        >
                          {d.planName === "ALL" ? "🌟 All Plans" : d.planName}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: "0.88rem",
                            fontWeight: 700,
                            background:
                              "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))",
                            color: "#F87171",
                            border: "1px solid rgba(239, 68, 68, 0.35)",
                          }}
                        >
                          🔥 {d.discountPercentage}% OFF
                        </span>
                      </td>
                      <td>
                        {d.originalPrice ? (
                          <div>
                            <span
                              style={{
                                textDecoration: "line-through",
                                color: "var(--text-muted)",
                                fontSize: "0.82rem",
                                marginRight: 6,
                              }}
                            >
                              ₹{d.originalPrice?.toLocaleString("en-IN")}
                            </span>
                            <span style={{ fontWeight: 700, color: "#10B981", fontSize: "0.95rem" }}>
                              ₹{d.discountedPrice?.toLocaleString("en-IN")}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                            {d.discountPercentage}% off
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ color: "var(--text-secondary)" }}>
                            <strong style={{ color: "var(--text-muted)" }}>From:</strong>{" "}
                            {new Date(d.startDate).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span style={{ color: "var(--text-secondary)" }}>
                            <strong style={{ color: "var(--text-muted)" }}>To:</strong>{" "}
                            {new Date(d.endDate).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isCurrent && (
                            <span
                              style={{
                                fontSize: "0.74rem",
                                color: "#10B981",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              ⏱️ Ends in{" "}
                              {daysRemaining > 0
                                ? `${daysRemaining} day${daysRemaining > 1 ? "s" : ""}`
                                : "< 24 hrs"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge variant={statusBadge}>{statusText}</Badge>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggle(d._id, d.isActive)}
                          style={{
                            padding: "4px 12px",
                            borderRadius: 14,
                            border: "none",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            background: d.isActive ? "#10B981" : "var(--bg-hover)",
                            color: d.isActive ? "#FFFFFF" : "var(--text-muted)",
                            transition: "all 0.2s ease",
                            boxShadow: d.isActive
                              ? "0 0 10px rgba(16, 185, 129, 0.3)"
                              : "none",
                          }}
                          title="Click to toggle active state instantly"
                        >
                          {d.isActive ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 8 }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(d)}
                            title="Edit Discount (Dynamic & Scrollable)"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "6px 12px",
                              fontWeight: 600,
                            }}
                          >
                            <HiOutlinePencilSquare style={{ fontSize: "1rem" }} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDeleteTarget(d)}
                            title="Delete Discount"
                            style={{ padding: "6px 10px", color: "var(--danger)" }}
                          >
                            <HiOutlineTrash />
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
      </div>

      {/* ═══════════════════════════════════════════════════════
          DYNAMIC & SCROLLABLE ADD / EDIT DISCOUNT MODAL
          ═══════════════════════════════════════════════════════ */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => !submitting && setShowModal(false)}
          style={{
            alignItems: "flex-start",
            padding: "24px 16px",
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: 640,
              width: "100%",
              margin: "auto",
              maxHeight: "calc(100vh - 48px)",
              display: "flex",
              flexDirection: "column",
              borderRadius: 18,
              border: "1px solid var(--border-default)",
              boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.85)",
              background: "var(--bg-surface)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Fixed at top) */}
            <div
              className="modal-header"
              style={{
                background: "var(--bg-surface)",
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-default)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "var(--primary-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.3rem",
                  }}
                >
                  <HiOutlineTag />
                </div>
                <div>
                  <h3 className="modal-title" style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
                    {editingDiscount ? "Edit Discount Campaign" : "Create New Discount"}
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {editingDiscount
                      ? `Editing "${editingDiscount.title}" (${editingDiscount.planName})`
                      : "Configure duration and percentage to display on plan cards"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
                disabled={submitting}
                style={{
                  background: "var(--bg-hover)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <HiXMark style={{ fontSize: "1.2rem" }} />
              </button>
            </div>

            {/* Modal Form — with scrollable body and fixed footer */}
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              {/* Modal Body (Smoothly Scrollable) */}
              <div
                className="modal-body"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                {/* 1. Target Plan Selection */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                    <span>Target Membership Plan <span style={{ color: "var(--danger)" }}>*</span></span>
                    <span style={{ fontSize: "0.78rem", color: "var(--primary-light)", fontWeight: 500 }}>
                      {formData.planName === "ALL" ? "Applies site-wide" : `Base price: ₹${(PLAN_PRICES[formData.planName] || 1500).toLocaleString("en-IN")}`}
                    </span>
                  </label>
                  <select
                    className="form-input"
                    value={formData.planName}
                    onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                    required
                    style={{ fontSize: "0.95rem" }}
                  >
                    {PLAN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Offer Title */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, marginBottom: 6 }}>
                    Discount / Campaign Title <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Monthly Kickstart Offer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* 3. Dynamic Interactive Discount Percentage Slider & Presets */}
                <div
                  className="form-group"
                  style={{
                    margin: 0,
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <HiOutlineArrowTrendingDown style={{ color: "#F87171" }} />
                      <span>Discount Percentage (%)</span>
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.discountPercentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountPercentage: Math.min(100, Math.max(1, Number(e.target.value) || 1)),
                          })
                        }
                        className="form-input"
                        style={{
                          width: 80,
                          textAlign: "center",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color: "#F87171",
                          padding: "4px 8px",
                        }}
                        required
                      />
                      <span style={{ fontWeight: 700, color: "#F87171" }}>%</span>
                    </div>
                  </div>

                  {/* Range Slider for dynamic instant adjustment */}
                  <div style={{ marginBottom: 14 }}>
                    <input
                      type="range"
                      min="1"
                      max="90"
                      step="1"
                      value={formData.discountPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountPercentage: Number(e.target.value),
                        })
                      }
                      style={{
                        width: "100%",
                        accentColor: "#F87171",
                        cursor: "pointer",
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                      <span>1%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>90%</span>
                    </div>
                  </div>

                  {/* Quick percentage preset chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginRight: 2 }}>
                      Presets:
                    </span>
                    {PRESET_PERCENTAGES.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setFormData({ ...formData, discountPercentage: pct })}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 8,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          border:
                            formData.discountPercentage === pct
                              ? "1px solid #F87171"
                              : "1px solid var(--border-default)",
                          background:
                            formData.discountPercentage === pct
                              ? "rgba(239, 68, 68, 0.2)"
                              : "var(--bg-surface)",
                          color:
                            formData.discountPercentage === pct
                              ? "#F87171"
                              : "var(--text-secondary)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Live Dynamic Pricing & Savings Box */}
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(99, 102, 241, 0.08))",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
                      Live Plan Pricing Preview
                    </span>
                    <span
                      style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#F87171",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontWeight: 700,
                        fontSize: "0.8rem",
                      }}
                    >
                      🔥 {formData.discountPercentage}% OFF
                    </span>
                  </div>

                  {pricingCalculations.length === 1 ? (
                    // Single Plan Preview
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{ textDecoration: "line-through", color: "var(--text-muted)", fontSize: "1rem" }}>
                            ₹{pricingCalculations[0].originalPrice.toLocaleString("en-IN")}
                          </span>
                          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10B981" }}>
                            ₹{pricingCalculations[0].finalPrice.toLocaleString("en-IN")}
                          </span>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            ({formData.planName})
                          </span>
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#10B981", fontWeight: 600, marginTop: 4 }}>
                          Member saves ₹{pricingCalculations[0].discountAmount.toLocaleString("en-IN")} ({formData.discountPercentage}% discount)
                        </div>
                      </div>

                      {/* Mini Landing Page Card Mockup */}
                      <div
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-default)",
                          borderRadius: 10,
                          padding: "10px 14px",
                          textAlign: "center",
                          minWidth: 160,
                        }}
                      >
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                          Card Display
                        </div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          {formData.planName}
                        </div>
                        <div style={{ color: "#10B981", fontWeight: 800, fontSize: "1.05rem" }}>
                          ₹{pricingCalculations[0].finalPrice.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // All Plans Multi-Card Comparison Preview
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 6 }}>
                      {pricingCalculations.map((p) => (
                        <div
                          key={p.name}
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-default)",
                            borderRadius: 10,
                            padding: "8px 12px",
                          }}
                        >
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                            {p.name}
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                            <span style={{ textDecoration: "line-through", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                              ₹{p.originalPrice.toLocaleString("en-IN")}
                            </span>
                            <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#10B981" }}>
                              ₹{p.finalPrice.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            Save ₹{p.discountAmount.toLocaleString("en-IN")}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Dynamic Time Duration & Countdown Manager */}
                <div
                  className="form-group"
                  style={{
                    margin: 0,
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <HiOutlineClock style={{ color: "var(--primary-light)" }} />
                      <span>Campaign Duration Window</span>
                    </label>

                    {/* Step duration buttons (+1 day, -1 day) */}
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Adjust:</span>
                      <button
                        type="button"
                        onClick={() => adjustDurationDays(-1)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "2px 8px", fontSize: "0.75rem" }}
                        title="Decrease end date by 1 day"
                      >
                        -1d
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustDurationDays(1)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "2px 8px", fontSize: "0.75rem" }}
                        title="Extend end date by 1 day"
                      >
                        +1d
                      </button>
                    </div>
                  </div>

                  {/* Preset duration buttons */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center", marginRight: 2 }}>
                      Quick duration:
                    </span>
                    {PRESET_DURATIONS.map((dur) => (
                      <button
                        key={dur.label}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => applyPresetDuration(dur.days)}
                        style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                        title={`Set duration to ${dur.days} days from start date`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>

                  {/* Datetime Pickers Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 4, fontWeight: 500 }}>
                        Start Date & Time
                      </span>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                        style={{ fontSize: "0.88rem" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: 4, fontWeight: 500 }}>
                        End Date / Expiry
                      </span>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                        style={{ fontSize: "0.88rem" }}
                      />
                    </div>
                  </div>

                  {/* Dynamic Duration Summary Badge */}
                  {durationSummary && durationSummary.isValid && (
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: "0.78rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "var(--bg-hover)",
                        padding: "6px 12px",
                        borderRadius: 8,
                      }}
                    >
                      <span style={{ color: "var(--text-secondary)" }}>
                        Total Duration: <strong>{durationSummary.totalDays} Days</strong> ({durationSummary.totalHours} hrs)
                      </span>
                      <span style={{ fontWeight: 600, color: durationSummary.statusColor }}>
                        {durationSummary.statusLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* 6. Description / Internal Note */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, marginBottom: 6 }}>
                    Description / Promotional Note (Optional)
                  </label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="e.g. Special offer for monthly members joining this week"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ fontSize: "0.88rem", resize: "vertical" }}
                  />
                </div>

                {/* 7. Active Status Toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: formData.isActive ? "rgba(16, 185, 129, 0.08)" : "var(--bg-hover)",
                    border: formData.isActive
                      ? "1px solid rgba(16, 185, 129, 0.3)"
                      : "1px solid var(--border-default)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    id="discount-active-toggle"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: 20, height: 20, accentColor: "#10B981", cursor: "pointer" }}
                  />
                  <label
                    htmlFor="discount-active-toggle"
                    style={{ cursor: "pointer", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}
                  >
                    Active Campaign (Displayed on plan cards immediately within duration window)
                  </label>
                </div>
              </div>

              {/* Modal Footer (Pinned at bottom, always accessible) */}
              <div
                className="modal-footer"
                style={{
                  background: "var(--bg-surface)",
                  padding: "16px 24px",
                  borderTop: "1px solid var(--border-default)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {formData.discountPercentage}% OFF on {formData.planName}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Saving…</span>
                      </>
                    ) : (
                      <>
                        <HiOutlineCheckCircle style={{ fontSize: "1.1rem" }} />
                        <span>{editingDiscount ? "Update Discount" : "Save & Activate"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM DIALOG ──────────────────────────── */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          title="Delete Discount Campaign"
          message={`Are you sure you want to permanently delete "${deleteTarget.title}" (${deleteTarget.discountPercentage}% off on ${deleteTarget.planName})? Plan cards will revert to regular pricing.`}
          confirmLabel={deleting ? "Deleting…" : "Delete Discount"}
          confirmVariant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default Discounts;
