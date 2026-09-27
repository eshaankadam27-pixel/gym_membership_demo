import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";
import { getUserById, updateUser } from "../services/userService";
import { GENDERS_ARRAY } from "../utils/constants";
import { getErrorMessage, formatDateForInput } from "../utils/formatters";

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dob: "",
    gender: "",
  });

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserById(id);
      const user = res.data?.data ?? res.data;
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        dob: formatDateForInput(user.dob),
        gender: user.gender || "",
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = { firstName: form.firstName };
      if (form.lastName.trim()) payload.lastName = form.lastName;
      else payload.lastName = "";
      if (form.phone.trim()) payload.phone = form.phone;
      else payload.phone = "";
      if (form.dob) payload.dob = form.dob;
      if (form.gender) payload.gender = form.gender;

      await updateUser(id, payload);
      toast.success("User updated successfully.");
      navigate(`/users/${id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading user data..." />;
  if (error) return <ErrorState message={error} onRetry={fetchUser} />;

  return (
    <div className="fade-in">
      <Link
        to={`/users/${id}`}
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 16, display: "inline-flex" }}
      >
        <HiOutlineArrowLeft /> Back to Details
      </Link>

      <div className="page-header">
        <h1>Edit User</h1>
        <p>Update user profile information. Account credentials are managed separately.</p>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">
                First Name <span className="required">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className={`form-input ${errors.firstName ? "error" : ""}`}
                value={form.firstName}
                onChange={handleChange}
              />
              {errors.firstName && <span className="form-error">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className="form-input"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-input"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dob">Date of Birth</label>
              <input
                id="dob"
                name="dob"
                type="date"
                className="form-input"
                value={form.dob}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              className="form-select"
              value={form.gender}
              onChange={handleChange}
            >
              <option value="">Select gender (optional)</option>
              {GENDERS_ARRAY.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/users/${id}`)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEdit;
