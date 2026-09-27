import { useTheme } from "../../context/ThemeContext";

/**
 * ThemeToggle — A compact sun/moon toggle switch.
 *
 * Uses the ThemeContext to read and toggle the current theme.
 * The visual transition is handled via CSS on `.theme-toggle-thumb`.
 */
const ThemeToggle = ({ className = "" }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={className}>
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Light mode" : "Dark mode"}
      >
        <span className="theme-toggle-track">
          <span className="theme-toggle-icon sun" aria-hidden="true">☀️</span>
          <span className="theme-toggle-icon moon" aria-hidden="true">🌙</span>
        </span>
        <span className="theme-toggle-thumb" />
      </button>
    </div>
  );
};

export default ThemeToggle;
