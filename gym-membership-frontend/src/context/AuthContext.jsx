import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginAuth } from "../services/authService";
import { getErrorMessage } from "../utils/formatters";

/**
 * AuthContext — provides login/logout + session management.
 *
 * Persists token in localStorage (`fittrack_token`) and user/auth data
 * in `fittrack_auth`. The axios request interceptor in api.js reads
 * `fittrack_token` to attach the Authorization header automatically.
 */

const AuthContext = createContext({
  user: null,
  auth: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [auth, setAuth] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Restore session from localStorage on mount ────────
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("fittrack_token");
      const storedAuth = localStorage.getItem("fittrack_auth");

      if (storedToken && storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        setToken(storedToken);
        setAuth(parsedAuth.auth || null);
        setUser(parsedAuth.user || null);
        setIsAuthenticated(true);
      }
    } catch {
      // Corrupted data — clear everything
      localStorage.removeItem("fittrack_token");
      localStorage.removeItem("fittrack_auth");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Login ──────────────────────────────────────────────
  const login = useCallback(async (email, password, role) => {
    const response = await loginAuth({ email, password, role });
    const resData = response.data?.data ?? response.data;

    const newToken = resData.token;
    const newAuth = resData.auth;
    const newUser = resData.user;

    // Persist to localStorage
    localStorage.setItem("fittrack_token", newToken);
    localStorage.setItem(
      "fittrack_auth",
      JSON.stringify({ auth: newAuth, user: newUser })
    );

    // Also update fittrack_member for the ForMembers page personalization
    if (newUser || newAuth) {
      const memberData = {
        name: newUser?.firstName || newAuth?.username || "",
        firstName: newUser?.firstName || newAuth?.username || "",
        lastName: newUser?.lastName || "",
        username: newAuth?.username || "",
        email: newAuth?.email || email,
        role: newAuth?.role || "MEMBER",
      };
      localStorage.setItem("fittrack_member", JSON.stringify(memberData));
    }

    // Update state
    setToken(newToken);
    setAuth(newAuth);
    setUser(newUser);
    setIsAuthenticated(true);

    return { user: newUser, auth: newAuth, token: newToken };
  }, []);

  // ── Logout ─────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("fittrack_token");
    localStorage.removeItem("fittrack_auth");
    localStorage.removeItem("fittrack_member");

    setToken(null);
    setAuth(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = {
    user,
    auth,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
