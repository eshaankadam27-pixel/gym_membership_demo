import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineArrowLeft,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { RoleBadge } from "../components/ui/Badge";
import Badge from "../components/ui/Badge";
import { getUserById, deleteUser } from "../services/userService";
import { getFullName, getInitials, formatDate, getErrorMessage } from "../utils/formatters";

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserById(id);
      setUser(res.data?.data ?? res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteUser(id);
      toast.success("User deleted successfully.");
      navigate("/users");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading user details..." />;
  if (error) return <ErrorState message={error} onRetry={fetchUser} />;
  if (!user) return <ErrorState message="User not found." />;

  const auth = user.authId; // populated by backend
  const fullName = getFullName(user.firstName, user.lastName);

  return (
    <div className="fade-in">
      {/* Back link */}
      <Link
        to="/users"
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 16, display: "inline-flex" }}
      >
        <HiOutlineArrowLeft /> Back to Users
      </Link>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-avatar">
          {getInitials(user.firstName, user.lastName)}
        </div>
        <div className="detail-header-info">
          <h2>{fullName}</h2>
          <p>{auth?.email || "No email"}</p>
        </div>
        <div className="detail-header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/users/${id}/edit`)}
          >
            <HiOutlinePencilSquare /> Edit
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowDelete(true)}
          >
            <HiOutlineTrash /> Delete
          </button>
        </div>
      </div>

      {/* Detail grid */}
      <div className="detail-grid">
        {/* Profile section */}
        <div className="detail-section">
          <h3>Profile Information</h3>
          <div className="detail-field">
            <span className="detail-field-label">First Name</span>
            <span className="detail-field-value">{user.firstName || "—"}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Last Name</span>
            <span className="detail-field-value">{user.lastName || "—"}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Phone</span>
            <span className="detail-field-value">{user.phone || "—"}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Date of Birth</span>
            <span className="detail-field-value">{formatDate(user.dob)}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Gender</span>
            <span className="detail-field-value">{user.gender || "—"}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Joined</span>
            <span className="detail-field-value">{formatDate(user.createdAt)}</span>
          </div>
        </div>

        {/* Account section */}
        <div className="detail-section">
          <h3>Account Information</h3>
          {auth ? (
            <>
              <div className="detail-field">
                <span className="detail-field-label">Username</span>
                <span className="detail-field-value">{auth.username || "—"}</span>
              </div>
              <div className="detail-field">
                <span className="detail-field-label">Email</span>
                <span className="detail-field-value">{auth.email || "—"}</span>
              </div>
              <div className="detail-field">
                <span className="detail-field-label">Role</span>
                <span className="detail-field-value">
                  {auth.role ? <RoleBadge role={auth.role} /> : "—"}
                </span>
              </div>
              <div className="detail-field">
                <span className="detail-field-label">Email Verified</span>
                <span className="detail-field-value">
                  {auth.isEmailVerified ? (
                    <Badge variant="emerald">Verified</Badge>
                  ) : (
                    <Badge variant="amber">Not Verified</Badge>
                  )}
                </span>
              </div>
              <div className="detail-field">
                <span className="detail-field-label">Account Status</span>
                <span className="detail-field-value">
                  {auth.isBlocked ? (
                    <Badge variant="rose">Blocked</Badge>
                  ) : (
                    <Badge variant="emerald">Active</Badge>
                  )}
                </span>
              </div>
              <div className="detail-field">
                <span className="detail-field-label">Last Login</span>
                <span className="detail-field-value">
                  {auth.lastLoginAt ? formatDate(auth.lastLoginAt) : "Never"}
                </span>
              </div>
            </>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No account information available.
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${fullName}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
};

export default UserDetail;
