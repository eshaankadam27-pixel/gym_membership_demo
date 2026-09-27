import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

/** Theme-aware Toaster — reads current theme for dynamic styling */
const ThemedToaster = () => {
  const { isDark } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: "toast-custom",
        style: {
          background: isDark ? "#1A1D2E" : "#FFFFFF",
          color: isDark ? "#F1F2F6" : "#1A1D2E",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.1)",
          borderRadius: "10px",
          fontSize: "0.88rem",
          fontFamily: "'Inter', sans-serif",
          boxShadow: isDark
            ? "0 4px 12px rgba(0, 0, 0, 0.4)"
            : "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
        success: {
          iconTheme: {
            primary: "#10B981",
            secondary: isDark ? "#1A1D2E" : "#FFFFFF",
          },
        },
        error: {
          iconTheme: {
            primary: "#F43F5E",
            secondary: isDark ? "#1A1D2E" : "#FFFFFF",
          },
        },
      }}
    />
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <ThemedToaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
