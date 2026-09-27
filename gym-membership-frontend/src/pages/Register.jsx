import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoFitnessOutline } from "react-icons/io5";
import {
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineCheck,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineCalendarDays,
  HiOutlineShieldCheck,
  HiOutlineBolt,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import { registerAuth } from "../services/authService";
import { createUser } from "../services/userService";
import { ROLES_ARRAY } from "../utils/constants";
import { getErrorMessage } from "../utils/formatters";
import "../styles/register.css";

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authId, setAuthId] = useState(null);

  // Step 1: Auth fields
  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "MEMBER",
  });

  // Step 2: Profile fields
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dob: "",
    gender: "",
  });

  const [errors, setErrors] = useState({});

  // ── Password Strength Computation ─────────────────────
  const passwordStrength = useMemo(() => {
    const pwd = authForm.password;
    if (!pwd) return { score: 0, label: "", checks: { length: false, number: false, mixed: false, special: false } };

    const checks = {
      length: pwd.length >= 8,
      number: /\d/.test(pwd),
      mixed: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd),
      special: /[^a-zA-Z0-9]/.test(pwd),
    };

    let score = 0;
    if (checks.length) score++;
    if (checks.number) score++;
    if (checks.mixed) score++;
    if (checks.special) score++;

    let label = "Weak";
    let cssClass = "strength-weak";
    if (score === 2) {
      label = "Fair";
      cssClass = "strength-fair";
    } else if (score === 3) {
      label = "Good";
      cssClass = "strength-good";
    } else if (score >= 4) {
      label = "Strong";
      cssClass = "strength-strong";
    }

    return { score, label, cssClass, checks };
  }, [authForm.password]);

  // ── Validation ────────────────────────────────────────
  const validateStep1 = () => {
    const errs = {};
    const trimmedUsername = authForm.username.trim();
    if (!trimmedUsername) {
      errs.username = "Username is required";
    } else if (trimmedUsername.length < 3) {
      errs.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      errs.username = "Only letters, numbers, and underscores allowed";
    }

    if (!authForm.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email)) {
      errs.email = "Please enter a valid email address";
    }

    if (!authForm.password) {
      errs.password = "Password is required";
    } else if (authForm.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!profileForm.firstName.trim()) {
      errs.firstName = "First name is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Handlers ──────────────────────────────────────────
  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const handleRoleSelect = (role) => {
    setAuthForm((prev) => ({ ...prev, role }));
  };

  const handleGenderSelect = (gender) => {
    setProfileForm((prev) => ({
      ...prev,
      gender: prev.gender === gender ? "" : gender,
    }));
  };

  // Step 1: Register auth
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setLoading(true);
    try {
      const response = await registerAuth({ ...authForm, name: authForm.username });
      const resData = response.data?.data ?? response.data;
      const authRecord = resData.auth ?? resData;
      setAuthId(authRecord._id);

      if (resData.token) {
        localStorage.setItem("fittrack_token", resData.token);
      }
      localStorage.setItem(
        "fittrack_auth",
        JSON.stringify({ auth: authRecord, user: null })
      );

      setStep(2);
      toast.success("Account created! Now complete your personal profile.");
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      if (msg.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: msg }));
      } else if (msg.toLowerCase().includes("username")) {
        setErrors((prev) => ({ ...prev, username: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const payload = {
        authId,
        firstName: profileForm.firstName.trim(),
      };
      if (profileForm.lastName.trim()) payload.lastName = profileForm.lastName.trim();
      if (profileForm.phone.trim()) payload.phone = profileForm.phone.trim();
      if (profileForm.dob) payload.dob = profileForm.dob;
      if (profileForm.gender) payload.gender = profileForm.gender;

      const userRes = await createUser(payload);
      const createdUser = userRes?.data?.data ?? userRes?.data;

      // Store member info in localStorage for dynamic personalization
      const memberData = {
        name: profileForm.firstName.trim() || authForm.username,
        firstName: profileForm.firstName.trim() || authForm.username,
        lastName: profileForm.lastName.trim(),
        username: authForm.username,
        email: authForm.email,
        role: authForm.role,
        phone: profileForm.phone.trim(),
      };
      try {
        localStorage.setItem("fittrack_member", JSON.stringify(memberData));
        const currentAuth = JSON.parse(localStorage.getItem("fittrack_auth") || "{}");
        localStorage.setItem(
          "fittrack_auth",
          JSON.stringify({
            auth: currentAuth.auth || { _id: authId, username: authForm.username, email: authForm.email, role: authForm.role },
            user: createdUser || memberData,
          })
        );
      } catch (storageErr) {
        console.warn("Could not save to localStorage:", storageErr);
      }

      toast.success("Registration complete! Welcome to FitTrack.");
      setStep(3); // Success celebration screen
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-wrapper">
      {/* Dynamic atmospheric background & floating glowing orbs */}
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
        <Link to="/" className="register-back-link">
          <HiOutlineArrowLeft /> Back to Home
        </Link>
      </header>

      {/* Main Centered Card */}
      <main className="register-card">
        {/* Card Header */}
        <div className="register-card-header">
          <div className="register-tag-badge">
            <HiOutlineSparkles />
            {step === 1 ? "Start Your Journey" : step === 2 ? "Final Step" : "Welcome Aboard"}
          </div>
          <h1 className="register-card-title">
            {step === 1
              ? "Create Your Account"
              : step === 2
              ? "Complete Your Profile"
              : "Registration Complete"}
          </h1>
          <p className="register-card-subtitle">
            {step === 1
              ? "Join the premier fitness tracking community and achieve your peak performance."
              : step === 2
              ? "Set up your member details to personalize your workout metrics and records."
              : "Your account and athlete profile are ready. Welcome to FitTrack!"}
          </p>
        </div>

        {/* Steps Progress Indicator (Shown on Steps 1 & 2) */}
        {step < 3 && (
          <div className="register-steps-track">
            {/* Step 1 Node */}
            <div className={`register-step-node ${step === 1 ? "active" : "completed"}`}>
              <div className="register-step-bubble">
                {step > 1 ? <HiOutlineCheck /> : <HiOutlineLockClosed />}
              </div>
              <div className="register-step-info">
                <span className="register-step-name">1. Account</span>
                <span className="register-step-desc">Credentials & Role</span>
              </div>
            </div>

            {/* Connecting Line */}
            <div className="register-steps-line">
              <div className={`register-steps-line-fill ${step > 1 ? "completed" : ""}`} />
            </div>

            {/* Step 2 Node */}
            <div className={`register-step-node ${step === 2 ? "active" : ""}`}>
              <div className="register-step-bubble">
                <HiOutlineUser />
              </div>
              <div className="register-step-info">
                <span className="register-step-name">2. Profile</span>
                <span className="register-step-desc">Personal Details</span>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: ACCOUNT CREDENTIALS ───────────────────── */}
        {step === 1 && (
          <form onSubmit={handleAuthSubmit} noValidate>
            {/* Interactive Role Switcher */}
            <div className="register-role-section">
              <span className="register-section-label">Select Account Type</span>
              <div className="register-role-grid">
                <button
                  type="button"
                  className={`register-role-card ${authForm.role === "MEMBER" ? "selected" : ""}`}
                  onClick={() => handleRoleSelect("MEMBER")}
                >
                  <div className="register-role-icon">
                    <HiOutlineBolt />
                  </div>
                  <div className="register-role-details">
                    <div className="register-role-title">
                      Member <span className="register-role-badge member">Standard</span>
                    </div>
                    <div className="register-role-desc">Workout tracking & gym facility access</div>
                  </div>
                </button>

                <button
                  type="button"
                  className={`register-role-card ${authForm.role === "ADMIN" ? "selected" : ""}`}
                  onClick={() => handleRoleSelect("ADMIN")}
                >
                  <div className="register-role-icon">
                    <HiOutlineShieldCheck />
                  </div>
                  <div className="register-role-details">
                    <div className="register-role-title">
                      Admin <span className="register-role-badge admin">Staff</span>
                    </div>
                    <div className="register-role-desc">Full staff management & member directory</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Username Input */}
            <div className="register-input-group">
              <label className="register-input-label" htmlFor="username">
                <span>Username <span className="required-dot">*</span></span>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Unique gym handle</span>
              </label>
              <div className="register-input-wrapper">
                <input
                  id="username"
                  name="username"
                  type="text"
                  className={`register-input ${errors.username ? "has-error" : ""}`}
                  placeholder="e.g. alex_fitness"
                  value={authForm.username}
                  onChange={handleAuthChange}
                  autoComplete="username"
                  required
                />
                <HiOutlineUser className="register-field-icon" />
              </div>
              {errors.username && (
                <span className="register-error-msg">{errors.username}</span>
              )}
            </div>

            {/* Email Input */}
            <div className="register-input-group">
              <label className="register-input-label" htmlFor="email">
                <span>Email Address <span className="required-dot">*</span></span>
              </label>
              <div className="register-input-wrapper">
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  className={`register-input ${errors.email ? "has-error" : ""}`}
                  placeholder="e.g. alex@example.com"
                  value={authForm.email}
                  onChange={handleAuthChange}
                  autoComplete="email"
                  required
                />
                <HiOutlineEnvelope className="register-field-icon" />
              </div>
              {errors.email && (
                <span className="register-error-msg">{errors.email}</span>
              )}
            </div>

            {/* Password Input */}
            <div className="register-input-group">
              <label className="register-input-label" htmlFor="new-password">
                <span>Password <span className="required-dot">*</span></span>
              </label>
              <div className="register-input-wrapper">
                <input
                  id="new-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={`register-input ${errors.password ? "has-error" : ""}`}
                  placeholder="Minimum 8 characters"
                  value={authForm.password}
                  onChange={handleAuthChange}
                  autoComplete="new-password"
                  required
                />
                <HiOutlineLockClosed className="register-field-icon" />
                <button
                  type="button"
                  className="register-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                </button>
              </div>
              {errors.password && (
                <span className="register-error-msg">{errors.password}</span>
              )}

              {/* Dynamic Live Password Strength Meter */}
              {authForm.password.length > 0 && (
                <div className="register-pwd-meter">
                  <div className="register-pwd-meter-header">
                    <span className="register-pwd-meter-label">Password Strength</span>
                    <span className={`register-pwd-meter-val ${passwordStrength.cssClass}`}>
                      {passwordStrength.label}
                    </span>
                  </div>

                  <div className="register-pwd-bars">
                    {[1, 2, 3, 4].map((barIdx) => (
                      <div
                        key={barIdx}
                        className={`register-pwd-segment ${
                          passwordStrength.score >= barIdx
                            ? `active-${passwordStrength.label.toLowerCase()}`
                            : ""
                        }`}
                      />
                    ))}
                  </div>

                  <div className="register-pwd-rules">
                    <div className={`register-rule-item ${passwordStrength.checks.length ? "valid" : ""}`}>
                      <span className="register-rule-icon">
                        {passwordStrength.checks.length ? "✓" : "○"}
                      </span>
                      8+ characters
                    </div>
                    <div className={`register-rule-item ${passwordStrength.checks.number || passwordStrength.checks.special ? "valid" : ""}`}>
                      <span className="register-rule-icon">
                        {passwordStrength.checks.number || passwordStrength.checks.special ? "✓" : "○"}
                      </span>
                      Number or symbol
                    </div>
                    <div className={`register-rule-item ${passwordStrength.checks.mixed ? "valid" : ""}`}>
                      <span className="register-rule-icon">
                        {passwordStrength.checks.mixed ? "✓" : "○"}
                      </span>
                      Upper & lowercase
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="register-actions-group">
              <button
                type="submit"
                className="register-btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Profile</span>
                    <HiOutlineArrowRight />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: PROFILE DETAILS ───────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleProfileSubmit} noValidate>
            {/* Account created banner */}
            <div className="register-account-banner">
              <div className="register-account-banner-left">
                <div className="register-account-check-icon">
                  <HiOutlineCheck />
                </div>
                <div>
                  <div className="register-account-info-title">
                    Account Created: @{authForm.username}
                  </div>
                  <div className="register-account-info-sub">{authForm.email}</div>
                </div>
              </div>
              <span className="register-account-role-pill">{authForm.role}</span>
            </div>

            {/* Name Fields (2-col) */}
            <div className="register-form-row">
              <div className="register-input-group">
                <label className="register-input-label" htmlFor="firstName">
                  <span>First Name <span className="required-dot">*</span></span>
                </label>
                <div className="register-input-wrapper">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    className={`register-input ${errors.firstName ? "has-error" : ""}`}
                    placeholder="e.g. Alex"
                    value={profileForm.firstName}
                    onChange={handleProfileChange}
                    autoComplete="given-name"
                    required
                  />
                  <HiOutlineUser className="register-field-icon" />
                </div>
                {errors.firstName && (
                  <span className="register-error-msg">{errors.firstName}</span>
                )}
              </div>

              <div className="register-input-group">
                <label className="register-input-label" htmlFor="lastName">
                  <span>Last Name</span>
                </label>
                <div className="register-input-wrapper">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className="register-input"
                    placeholder="e.g. Mercer"
                    value={profileForm.lastName}
                    onChange={handleProfileChange}
                    autoComplete="family-name"
                  />
                  <HiOutlineUser className="register-field-icon" />
                </div>
              </div>
            </div>

            {/* Phone & Date of Birth (2-col) */}
            <div className="register-form-row">
              <div className="register-input-group">
                <label className="register-input-label" htmlFor="phone">
                  <span>Phone Number</span>
                </label>
                <div className="register-input-wrapper">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    className="register-input"
                    placeholder="e.g. +91 98765 43210"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    autoComplete="tel"
                  />
                  <HiOutlinePhone className="register-field-icon" />
                </div>
              </div>

              <div className="register-input-group">
                <label className="register-input-label" htmlFor="dob">
                  <span>Date of Birth</span>
                </label>
                <div className="register-input-wrapper">
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    className="register-input"
                    value={profileForm.dob}
                    onChange={handleProfileChange}
                    autoComplete="bday"
                  />
                  <HiOutlineCalendarDays className="register-field-icon" />
                </div>
              </div>
            </div>

            {/* Interactive Gender Chips */}
            <div className="register-input-group">
              <label className="register-input-label">
                <span>Gender (Optional)</span>
              </label>
              <div className="register-gender-chips">
                {[
                  { value: "Male", label: "Male", icon: "👨" },
                  { value: "Female", label: "Female", icon: "👩" },
                  { value: "Other", label: "Other", icon: "✨" },
                ].map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    className={`register-gender-chip ${
                      profileForm.gender === g.value ? "selected" : ""
                    }`}
                    onClick={() => handleGenderSelect(g.value)}
                  >
                    <span>{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit & Navigation */}
            <div className="register-actions-group">
              <button
                type="submit"
                className="register-btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    <span>Completing Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <HiOutlineCheckCircle />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: REGISTRATION COMPLETE CELEBRATION ────── */}
        {step === 3 && (
          <div className="register-success-view">
            <div className="register-success-badge-wrapper">
              <div className="register-success-pulse-ring" />
              <div className="register-success-icon-box">
                <HiOutlineCheck />
              </div>
            </div>

            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 6 }}>
              Welcome, {profileForm.firstName || authForm.username}!
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", maxWidth: 420, margin: "0 auto 20px" }}>
              Your member account is active and verified. You're ready to start tracking workouts, attendance, and fitness goals.
            </p>

            <div className="register-success-summary-card">
              <div className="register-summary-row">
                <span className="register-summary-label">Username</span>
                <span className="register-summary-val">@{authForm.username}</span>
              </div>
              <div className="register-summary-row">
                <span className="register-summary-label">Email</span>
                <span className="register-summary-val">{authForm.email}</span>
              </div>
              <div className="register-summary-row">
                <span className="register-summary-label">Role</span>
                <span className="register-summary-val" style={{ color: "var(--primary-light)" }}>
                  {authForm.role}
                </span>
              </div>
              {profileForm.phone && (
                <div className="register-summary-row">
                  <span className="register-summary-label">Phone</span>
                  <span className="register-summary-val">{profileForm.phone}</span>
                </div>
              )}
            </div>

            {authForm.role === "MEMBER" ? (
              <div className="register-success-actions">
                <button
                  type="button"
                  className="register-btn-submit"
                  onClick={() =>
                    navigate(
                      `/for-members?name=${encodeURIComponent(
                        profileForm.firstName.trim() || authForm.username
                      )}`,
                      {
                        state: {
                          name: profileForm.firstName.trim() || authForm.username,
                          username: authForm.username,
                          email: authForm.email,
                          role: authForm.role,
                        },
                      }
                    )
                  }
                >
                  <span>Open Member App</span>
                  <HiOutlineArrowRight />
                </button>
                <button
                  type="button"
                  className="register-btn-secondary"
                  onClick={() => navigate("/")}
                >
                  <span>Back to Home</span>
                </button>
              </div>
            ) : (
              <div className="register-success-actions">
                <button
                  type="button"
                  className="register-btn-submit"
                  onClick={() => navigate("/dashboard")}
                >
                  <span>Go to Dashboard</span>
                  <HiOutlineArrowRight />
                </button>
                <button
                  type="button"
                  className="register-btn-secondary"
                  onClick={() => navigate("/users")}
                >
                  <span>View Members Directory</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Card Footer (Only on Steps 1 & 2) */}
        {step < 3 && (
          <footer className="register-card-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login">Sign in here</Link>
            </p>
            <div className="register-security-badge">
              <span>🔒</span>
              <span>256-bit SSL encrypted • Private fitness identity</span>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
};

export default Register;
