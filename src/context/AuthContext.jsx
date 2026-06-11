// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const USER_KEY = "admin-data";
const TOKEN_KEY = "admin-token";

export const AuthProvider = ({ children }) => {
  // admin object: { adminId, name, id, token }
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null); // string
  const [loading, setLoading] = useState(true);

  // hydrate from localStorage (persisted login)
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    const savedToken = localStorage.getItem(TOKEN_KEY);

    let parsedUser = null;
    if (savedUser) {
      try {
        parsedUser = JSON.parse(savedUser);
        const allowedRoles = ["superAdmin", "admin"];
        if (!allowedRoles.includes(parsedUser?.role)) {
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_KEY);
          parsedUser = null;
        } else {
          setAdmin(parsedUser);
        }
      } catch (e) {
        console.error("Error parsing saved admin data", e);
        localStorage.removeItem(USER_KEY);
      }
    }

    if (savedToken) {
      setToken(savedToken);
      // Fetch latest profile to sync permissions
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      fetch(`${baseUrl}/profile`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === "success") {
            const latestUser = data.data.user || data.data.admin;
            const updatedAdmin = { ...parsedUser, ...latestUser, token: savedToken };
            setAdmin(updatedAdmin);
            localStorage.setItem(USER_KEY, JSON.stringify(updatedAdmin));
          }
        })
        .catch(err => console.error("Error fetching fresh profile:", err));
    }

    setLoading(false);
  }, []);

  const setLoginData = (adminData) => {
    const allowedRoles = ["superAdmin", "admin"];
    if (!allowedRoles.includes(adminData?.role)) {
      console.warn("Blocked: Only superAdmin or admin role is allowed.");
      return;
    }
    setAdmin(adminData);
    setToken(adminData?.token || null);

    localStorage.setItem(USER_KEY, JSON.stringify(adminData));
    if (adminData?.token) {
      localStorage.setItem(TOKEN_KEY, adminData.token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const isLoggedIn = Boolean(admin && token);

  return (
    <AuthContext.Provider
      value={{ admin, token, setLoginData, logout, isLoggedIn, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
