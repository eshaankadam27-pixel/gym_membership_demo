import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { IoFitnessOutline } from "react-icons/io5";
import {
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineArrowLeft,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineUser,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/formatters";
import "../styles/register.css";
import ThemeToggle from "../components/ui/ThemeToggle";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [role, setRole] = useState("MEMBER"); // "MEMBER" | "ADMIN"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Validation ────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!role) {
      errs.role = "Please select your role";
    }
    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!password) {
      errs.password = "Password is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await login(email, password, role);
      const userRole = res?.auth?.role || role;
      const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN" || userRole === "SuperAdmin";

      toast.success(
        `Welcome back! Signed in as ${isAdmin ? "Administrator" : "Member"}.`
      );

      // Check if there's a plan to auto-enroll after login
      const pendingPlan = searchParams.get("plan");
      if (pendingPlan) {
        navigate(`/?plan=${encodeURIComponent(pendingPlan)}#plans`);
      } else if (isAdmin) {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      const statusCode = err.response?.status;

      if (statusCode === 401) {
        // Invalid credentials
        toast.error("Invalid email or password. Please try again.");
        setErrors((prev) => ({ ...prev, password: "Invalid credentials" }));
      } else if (statusCode === 403) {
        // Account blocked/deactivated or role mismatch
        toast.error(msg);
        setErrors((prev) => ({ ...prev, role: msg }));
      } else if (msg.toLowerCase().includes("not found") || statusCode === 404) {
        // Email not registered
        toast.error("Email not registered. Please register first.");
        setErrors((prev) => ({
          ...prev,
          email: "This email is not registered",
        }));
      } else {
        toast.error(msg || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-wrapper">
      {/* Background & ambient glowing orbs */}
      <div className="register-bg-layer" />
      <div className="register-ambient-orb register-orb-1" />
      <div className="register-ambient-orb register-orb-2" />

      {/* Top Header Navigation */}
      <header className="register-topbar">
        <Link to="/" className="register-brand-link">
          <div className="register-brand-icon">
            <IoFitnessOutline />
          </div>
          <span className="register-brand-name">FitTrack</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle />
          <Link to="/" className="register-back-link">
            <HiOutlineArrowLeft /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Centered Card */}
      <main className="register-card" style={{ maxWidth: 480 }}>
        <div className="register-card-header" style={{ marginBottom: 8 }}>
          <div className="register-tag-badge">
            <HiOutlineSparkles /> {role === "ADMIN" ? "Staff / Admin Access" : "Member Portal Access"}
          </div>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--primary-glow)",
              color: "var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              margin: "0 auto 16px",
              boxShadow: "0 0 20px var(--primary-glow)",
            }}
          >
            <HiOutlineLockClosed />
          </div>
          <h1 className="register-card-title" style={{ fontSize: "1.6rem" }}>
            Sign In to FitTrack
          </h1>
          <p className="register-card-subtitle">
            Select your role and enter your credentials to access your fitness dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="register-form-grid">
          {/* Role Selection */}
          <div className="register-field-group">
            <label className="register-field-label">
              <HiOutlineShieldCheck /> Select Your Role
            </label>
            <div className="register-role-grid">
              <div
                className={`register-role-card ${role === "MEMBER" ? "selected" : ""}`}
                onClick={() => {
                  setRole("MEMBER");
                  if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
                }}
                role="button"
                tabIndex={0}
              >
                <div className="register-role-icon">
                  <HiOutlineUser />
                </div>
                <div className="register-role-details">
                  <div className="register-role-title">
                    Member <span className="register-role-badge member">User</span>
                  </div>
                  <div className="register-role-desc">
                    Workout routines, diet charts & plans
                  </div>
                </div>
              </div>

              <div
                className={`register-role-card ${role === "ADMIN" ? "selected" : ""}`}
                onClick={() => {
                  setRole("ADMIN");
                  if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
                }}
                role="button"
                tabIndex={0}
              >
                <div className="register-role-icon">
                  <HiOutlineShieldCheck />
                </div>
                <div className="register-role-details">
                  <div className="register-role-title">
                    Admin <span className="register-role-badge admin">Staff</span>
                  </div>
                  <div className="register-role-desc">
                    Manage members, billing & attendance
                  </div>
                </div>
              </div>
            </div>
            {errors.role && (
              <span className="register-error-text">{errors.role}</span>
            )}
          </div>

          {/* Email */}
          <div className="register-field-group">
            <label className="register-field-label" htmlFor="login-email">
              <HiOutlineEnvelope /> Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className={`register-field-input ${errors.email ? "register-field-error" : ""}`}
              placeholder={role === "ADMIN" ? "admin@gym.com" : "you@example.com"}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              autoComplete="email"
              autoFocus
            />
            {errors.email && (
              <span className="register-error-text">{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="register-field-group">
            <label className="register-field-label" htmlFor="login-password">
              <HiOutlineLockClosed /> Password
            </label>
            <div className="register-password-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className={`register-field-input ${errors.password ? "register-field-error" : ""}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors({ ...errors, password: undefined });
                }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
              </button>
            </div>
            {errors.password && (
              <span className="register-error-text">{errors.password}</span>
            )}
          </div>

          {/* Submit */}
          <div className="register-actions-group" style={{ marginTop: 8 }}>
            <button
              type="submit"
              className="register-btn-submit"
              disabled={loading}
            >
              <span>{loading ? "Signing in…" : "Sign In"}</span>
              {!loading && <HiOutlineArrowRight />}
            </button>
          </div>
        </form>

        <footer className="register-card-footer" style={{ marginTop: 20 }}>
          <p>
            Don't have an account?{" "}
            <Link to="/register">Register here</Link>
          </p>
          <div className="register-security-badge">
            <span>🔒</span>
            <span>256-bit SSL encrypted • Private fitness identity</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Login;
