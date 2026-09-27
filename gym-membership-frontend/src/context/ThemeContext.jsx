import { createContext, useContext, useState, useEffect, useCallback } from "react";

/**
 * ThemeContext — provides dark/light theme toggle.
 *
 * Persists preference in localStorage (`fittrack_theme`).
 * Applies `data-theme="light"` on <html> for CSS overrides.
 * Defaults to "dark".
 */

const ThemeContext = createContext({
  theme: "dark",
  isDark: true,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("fittrack_theme") || "dark";
    } catch {
      return "dark";
    }
  });

  const isDark = theme === "dark";

  // Sync data-theme attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fittrack_theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
