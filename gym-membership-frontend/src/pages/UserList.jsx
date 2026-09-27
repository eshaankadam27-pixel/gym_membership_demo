import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineUserPlus,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { RoleBadge } from "../components/ui/Badge";
import { getAllUsers, deleteUser } from "../services/userService";
import { getFullName, getInitials, formatDate, getErrorMessage } from "../utils/formatters";

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllUsers();
      setUsers(res.data?.data ?? res.data ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget._id);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      toast.success("User deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading users..." />;
  if (error) return <ErrorState message={error} onRetry={fetchUsers} />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Users</h1>
        <p>Manage all registered gym members and staff.</p>
      </div>

      <div className="list-toolbar">
        <span className="list-toolbar-count">
          {users.length} user{users.length !== 1 ? "s" : ""} found
        </span>
        <Link to="/register" className="btn btn-primary btn-sm">
          <HiOutlineUserPlus /> Add User
        </Link>
      </div>

      {users.length === 0 ? (
        <EmptyState
          title="No users found"
          message="Create your first user to get started with FitTrack."
          actionLabel="Register User"
          actionTo="/register"
        />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const auth = user.authId; // populated by backend
                const fullName = getFullName(user.firstName, user.lastName);
                return (
                  <tr key={user._id}>
                    <td>
                      <div className="user-name-cell">
                        <div className="user-avatar">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <span className="user-name-text">{fullName}</span>
                      </div>
                    </td>
                    <td>{auth?.email || "—"}</td>
                    <td>{user.phone || "—"}</td>
                    <td>{user.gender || "—"}</td>
                    <td>{auth?.role ? <RoleBadge role={auth.role} /> : "—"}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="btn btn-ghost btn-icon"
                          title="View"
                          onClick={() => navigate(`/users/${user._id}`)}
                        >
                          <HiOutlineEye />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Edit"
                          onClick={() => navigate(`/users/${user._id}/edit`)}
                        >
                          <HiOutlinePencilSquare />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Delete"
                          onClick={() => setDeleteTarget(user)}
                          style={{ color: "var(--accent-rose)" }}
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget ? getFullName(deleteTarget.firstName, deleteTarget.lastName) : "this user"}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default UserList;
