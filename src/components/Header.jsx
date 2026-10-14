// src/components/Header.jsx
import { memo, useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaBell, 
  FaMoon, 
  FaSun, 
  FaPalette, 
  FaCheck, 
  FaDesktop, 
  FaChevronDown 
} from "react-icons/fa";
import { toast } from "sonner";

const Header = memo(({
  toggleSidebar,
  currentPageTitle
}) => {
  const { 
    theme, 
    resolvedTheme, 
    isDark, 
    toggleTheme, 
    setTheme, 
    palette, 
    changePalette, 
    themeColors, 
    colorPalettes 
  } = useTheme();

  const { currentFont } = useFont();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef(null);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
        setThemeMenuOpen(false);
      }
    };
    if (themeMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [themeMenuOpen]);

  // Notifications count
  useEffect(() => {
    if (!token) return;
    const fetchUnread = async () => {
      try {
        const res = await axios.get(`${baseUrl}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.status === "success") {
          const count = (res.data.data.notifications || []).filter((n) => !n.read).length;
          setUnreadCount(count);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    window.addEventListener("new-notification", fetchUnread);
    window.addEventListener("notifications-read", fetchUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener("new-notification", fetchUnread);
      window.removeEventListener("notifications-read", fetchUnread);
    };
  }, [token, baseUrl]);

  const handleQuickToggle = () => {
    const willBeDark = !isDark;
    toggleTheme();
    toast.success(willBeDark ? "🌙 Dark Mode activated" : "☀️ Light Mode activated", {
      duration: 2000,
    });
  };

  const handleSelectMode = (mode) => {
    setTheme(mode);
    const label = mode === "dark" ? "🌙 Dark Mode" : mode === "light" ? "☀️ Light Mode" : "💻 System Default";
    toast.success(`${label} applied`, { duration: 1500 });
  };

  const handleSelectPalette = (key) => {
    changePalette(key);
    const pName = colorPalettes[key]?.name || key;
    toast.success(`Theme palette changed to ${pName}`, { duration: 1500 });
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-4 border-b backdrop-blur-sm sticky top-0 z-40 transition-colors duration-200"
      style={{
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
      }}
    >
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center min-w-0 flex-1">
        <button
          onClick={toggleSidebar}
          className="lg:hidden mr-3 p-2 rounded-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border"
          style={{
            color: themeColors.text,
            backgroundColor: themeColors.background,
            borderColor: themeColors.border
          }}
          aria-label="Open sidebar"
        >
          <span className="text-base font-bold">☰</span>
        </button>

        <h2
          className="text-base font-bold truncate tracking-tight"
          style={{
            color: themeColors.text,
            fontFamily: currentFont?.family
          }}
        >
          {currentPageTitle}
        </h2>
      </div>

      {/* Right Controls: Dark Mode Switcher & Notifications */}
      <div className="flex items-center space-x-2.5">
        
        {/* Quick Dark Mode Toggle Button */}
        <button
          onClick={handleQuickToggle}
          className="relative p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-xs group"
          style={{
            color: isDark ? "#fbbf24" : "#4f46e5",
            backgroundColor: themeColors.background,
            borderColor: themeColors.border,
          }}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle dark mode"
        >
          <div className="relative w-4 h-4 flex items-center justify-center">
            {isDark ? (
              <FaSun className="text-base text-amber-400 transform group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <FaMoon className="text-base text-indigo-600 transform group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </div>
        </button>

        {/* Theme Settings & Palette Dropdown */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            style={{
              color: themeColors.text,
              backgroundColor: themeColors.background,
              borderColor: themeColors.border
            }}
            title="Appearance & Theme Options"
            aria-expanded={themeMenuOpen}
          >
            <FaPalette className="text-sm" style={{ color: themeColors.primary }} />
            <span className="hidden sm:inline capitalize">
              {theme === "system" ? "Auto" : theme}
            </span>
            <FaChevronDown className={`text-[10px] transition-transform duration-200 ${themeMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Theme Dropdown Popover */}
          {themeMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-2xl shadow-2xl border p-4 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: themeColors.border }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.textSecondary }}>
                  Appearance & Theme
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                  style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}
                >
                  {isDark ? "Dark Active" : "Light Active"}
                </span>
              </div>

              {/* Theme Mode Selector (Light, Dark, System) */}
              <div className="mb-4">
                <label className="text-xs font-bold block mb-2" style={{ color: themeColors.text }}>
                  Mode Selection
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl border" style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}>
                  <button
                    onClick={() => handleSelectMode("light")}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      theme === "light" ? "shadow-sm font-bold" : "opacity-75 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: theme === "light" ? themeColors.surface : "transparent",
                      color: theme === "light" ? themeColors.primary : themeColors.text,
                      border: theme === "light" ? `1px solid ${themeColors.border}` : "1px solid transparent"
                    }}
                  >
                    <FaSun className="text-amber-500 mb-1 text-sm" />
                    <span>Light</span>
                  </button>

                  <button
                    onClick={() => handleSelectMode("dark")}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      theme === "dark" ? "shadow-sm font-bold" : "opacity-75 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: theme === "dark" ? themeColors.surface : "transparent",
                      color: theme === "dark" ? themeColors.primary : themeColors.text,
                      border: theme === "dark" ? `1px solid ${themeColors.border}` : "1px solid transparent"
                    }}
                  >
                    <FaMoon className="text-indigo-400 mb-1 text-sm" />
                    <span>Dark</span>
                  </button>

                  <button
                    onClick={() => handleSelectMode("system")}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      theme === "system" ? "shadow-sm font-bold" : "opacity-75 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: theme === "system" ? themeColors.surface : "transparent",
                      color: theme === "system" ? themeColors.primary : themeColors.text,
                      border: theme === "system" ? `1px solid ${themeColors.border}` : "1px solid transparent"
                    }}
                  >
                    <FaDesktop className="text-emerald-500 mb-1 text-sm" />
                    <span>Auto</span>
                  </button>
                </div>
              </div>

              {/* Color Palette Selector */}
              <div>
                <label className="text-xs font-bold block mb-2" style={{ color: themeColors.text }}>
                  Color Palette
                </label>
                <div className="space-y-1.5">
                  {Object.entries(colorPalettes).map(([key, pal]) => {
                    const isSelected = palette === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleSelectPalette(key)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                          isSelected ? "shadow-xs font-bold" : "hover:opacity-90"
                        }`}
                        style={{
                          backgroundColor: isSelected ? `${themeColors.primary}12` : themeColors.background,
                          borderColor: isSelected ? themeColors.primary : themeColors.border,
                          color: isSelected ? themeColors.primary : themeColors.text
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full border shadow-xs inline-block"
                            style={{ backgroundColor: pal.previewColor, borderColor: "rgba(255,255,255,0.2)" }}
                          />
                          <div>
                            <p className="font-semibold">{pal.name}</p>
                          </div>
                        </div>
                        {isSelected && <FaCheck className="text-xs" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
          style={{ 
            color: themeColors.text, 
            backgroundColor: themeColors.background,
            borderColor: themeColors.border
          }}
          aria-label="Notifications"
        >
          <FaBell className="text-sm" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;