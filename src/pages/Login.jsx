import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { initNotifications, listenForMessages } from "../utils/firebase";

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { setLoginData } = useAuth();
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const apiUrl = `${baseUrl}/auth/login`; 
      
      const response = await axios.post(apiUrl, {
        email: credentials.email.trim(),
        password: credentials.password
      });

      if (response.data.status === "success") {
        const { token, data } = response.data;
        const user = data.user;

        const allowedRoles = ["superAdmin", "admin"];
        if (!allowedRoles.includes(user?.role)) {
          setError("Access denied. This panel is for Admins only.");
          return;
        }

        // Save to AuthContext
        setLoginData({ ...user, token });

        await initNotifications(token);
        listenForMessages();

        navigate("/dashboard", { replace: true });
      } else {
        setError(response.data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || 
        "Something went wrong. Please check your credentials and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: themeColors.background,
        fontFamily: currentFont.family,
      }}
    >
      <div
        className="w-full max-w-sm p-8 rounded-2xl shadow-xl border transition-all"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        {/* Branding Section */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-extrabold mb-2"
            style={{ color: themeColors.primary }}
          >
            CRM
          </h1>
          <p
            className="text-sm font-medium"
            style={{ color: themeColors.textSecondary }}
          >
            SuperAdmin Portal
          </p>
        </div>

        {/* Error Box */}
        {error && (
          <div
            className="mb-6 p-3 rounded-lg text-center text-sm font-medium animate-fade-in"
            style={{
              backgroundColor: themeColors.danger + "15",
              color: themeColors.danger,
              border: `1px solid ${themeColors.danger}30`,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-semibold"
              style={{ color: themeColors.text }}
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
              className="w-full p-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all shadow-sm"
              style={{
                backgroundColor: themeColors.background,
                color: themeColors.text,
                borderColor: themeColors.border,
              }}
              placeholder="adminsuper@crm.com"
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-semibold"
              style={{ color: themeColors.text }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              className="w-full p-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all shadow-sm"
              style={{
                backgroundColor: themeColors.background,
                color: themeColors.text,
                borderColor: themeColors.border,
              }}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 mt-4"
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.onPrimary,
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Authenticating...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;