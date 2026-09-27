import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiOutlineBars3, HiOutlineUserPlus, HiOutlineArrowRightOnRectangle } from "react-icons/hi2";
import { getHealthStatus } from "../../services/healthService";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../ui/ThemeToggle";

const Navbar = ({ onHamburgerClick }) => {
  const location = useLocation();
  const { user, auth, isAuthenticated, logout } = useAuth();
  const [health, setHealth] = useState(null);

  // Derive breadcrumb from path
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return "Dashboard";
    if (path === "/memberships") return "Memberships";
    if (path === "/payments") return "Payments";
    if (path === "/attendance") return "Attendance";
    if (path === "/register") return "Register User";
    if (path === "/login") return "Login";
    if (path.match(/^\/users\/[^/]+\/edit$/)) return "Users › Edit";
    if (path.match(/^\/users\/[^/]+$/)) return "Users › Details";
    if (path === "/users") return "Users";
    return "Page";
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await getHealthStatus();
        setHealth(res.data?.data || res.data);
      } catch {
        setHealth(null);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = health?.database === "connected";
  const isOnLogin = location.pathname === "/login";
  const isOnRegister = location.pathname === "/register";

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button
          className="navbar-hamburger"
          onClick={onHamburgerClick}
          aria-label="Toggle navigation"
        >
          <HiOutlineBars3 />
        </button>
        <span className="navbar-breadcrumb">{getBreadcrumb()}</span>
      </div>

      <div className="navbar-right">
        {/* Auth navigation buttons */}
        <div className="navbar-auth-buttons">
          {isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className={`badge ${
                  (auth?.role || "").toUpperCase() === "SUPERADMIN"
                    ? "badge-amber"
                    : (auth?.role || "").toUpperCase() === "ADMIN"
                    ? "badge-rose"
                    : "badge-primary"
                }`}
                style={{
                  fontWeight: 700,
                  boxShadow:
                    (auth?.role || "").toUpperCase() === "SUPERADMIN"
                      ? "0 0 12px rgba(245, 158, 11, 0.4)"
                      : "none",
                }}
              >
                {(auth?.role || "").toUpperCase() === "SUPERADMIN"
                  ? "SUPER ADMIN"
                  : auth?.role || "MEMBER"}
              </span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {user?.firstName || auth?.username || "User"}
              </span>
              <button
                className="btn btn-sm btn-ghost"
                onClick={logout}
                title="Sign Out"
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px" }}
              >
                <HiOutlineArrowRightOnRectangle />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/register"
                className={`btn btn-sm navbar-auth-btn navbar-signup-btn${isOnRegister ? " active" : ""}`}
                id="navbar-signup"
              >
                <HiOutlineUserPlus />
                <span>Sign Up</span>
              </Link>
              <Link
                to="/login"
                className={`btn btn-sm navbar-auth-btn navbar-signin-btn${isOnLogin ? " active" : ""}`}
                id="navbar-signin"
              >
                <HiOutlineArrowRightOnRectangle />
                <span>Sign In</span>
              </Link>
            </>
          )}
        </div>

        {/* Theme toggle */}
        <div className="navbar-divider" />
        <ThemeToggle />

        {/* Health status divider & indicator */}
        <div className="navbar-divider" />
        <div
          className={`navbar-health-dot ${isConnected ? "" : "disconnected"}`}
          title={isConnected ? "Backend connected" : "Backend disconnected"}
        />
        <span className="navbar-health-label">
          {isConnected ? "API Connected" : "Disconnected"}
        </span>
      </div>
    </nav>
  );
};

export default Navbar;
