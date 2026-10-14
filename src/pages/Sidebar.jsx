// src/pages/Sidebar.jsx
import { Link } from "react-router-dom";
import { memo, useState } from "react";
import {
  FaSignOutAlt,
  FaTimes,
  FaUserCircle,
  FaChevronDown,
  FaChevronRight,
  FaSun,
  FaMoon
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const SidebarItem = memo(({ route, isActive, themeColors, onClose, currentPath }) => {
  const IconComponent = route.icon;
  const hasChildren = route.children && route.children.length > 0;
  const [isOpen, setIsOpen] = useState(() => {
    // Auto-open if child is active
    if (!hasChildren) return false;
    return route.children.some(child => currentPath === child.path || currentPath.startsWith(child.path + "/"));
  });

  // Toggle for parent items
  const handleToggle = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  if (hasChildren) {
    return (
      <div className="mb-1">
        <div
          onClick={handleToggle}
          className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${isActive ? "shadow-md" : "hover:shadow-sm"
            }`}
          style={{
            color: isActive ? themeColors.primary : themeColors.text,
            backgroundColor: isActive
              ? themeColors.active?.background || `${themeColors.primary}15`
              : "transparent",
            border: isActive ? `1px solid ${themeColors.primary}30` : "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor =
                themeColors.hover?.background || `${themeColors.primary}10`;
              e.currentTarget.style.borderColor = `${themeColors.primary}20`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "transparent";
            }
          }}
        >
          <div className="flex items-center">
            <IconComponent
              className="mr-3 text-lg transition-colors duration-200"
              style={{
                color: isActive ? themeColors.primary : themeColors.textSecondary,
              }}
            />
            <span className="font-medium text-sm">{route.name}</span>
          </div>
          {isOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
        </div>
        {isOpen && (
          <div className="ml-4 pl-2 border-l border-gray-200 mt-1 space-y-1">
            {route.children.map((child) => (
              <SidebarItem
                key={child.path}
                route={child}
                isActive={currentPath === child.path || (child.path !== "/" && currentPath.startsWith(child.path + "/"))} // Recalculate active for child
                themeColors={themeColors}
                onClose={onClose}
                currentPath={currentPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={route.path}
      className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? "shadow-md" : "hover:shadow-sm"
        }`}
      style={{
        color: isActive ? themeColors.primary : themeColors.text,
        backgroundColor: isActive
          ? themeColors.active?.background || `${themeColors.primary}15`
          : "transparent",
        border: isActive ? `1px solid ${themeColors.primary}30` : "1px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor =
            themeColors.hover?.background || `${themeColors.primary}10`;
          e.currentTarget.style.borderColor = `${themeColors.primary}20`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.borderColor = "transparent";
        }
      }}
      onClick={onClose}
      aria-current={isActive ? "page" : undefined}
    >
      <IconComponent
        className="mr-3 text-lg transition-colors duration-200"
        style={{
          color: isActive ? themeColors.primary : themeColors.textSecondary,
        }}
      />
      <span className="font-medium text-sm">{route.name}</span>
    </Link>
  );
});

SidebarItem.displayName = "SidebarItem";

const Sidebar = ({
  isOpen,
  onClose,
  routes,
  currentPath,
  user,
  logout,
  themeColors,
}) => {
  const { isDark, toggleTheme } = useTheme();

  // 🔥 Filter routes based on hide property and user permissions
  const visibleRoutes = routes.filter((r) => {
    if (r.hide) return false;
    if (user?.role === 'superAdmin') return true;
    if (r.superAdminOnly) return false;
    if (!r.permission) return true;
    return user?.permissions?.includes(r.permission);
  });

  // Active check — logic updated to handle parents
  const isRouteActive = (route) => {
    if (route.children) {
      return route.children.some(child => isRouteActive(child));
    }
    if (currentPath === route.path) return true;
    if (route.path !== "/" && currentPath.startsWith(route.path + "/")) {
      return true;
    }
    return false;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${isOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out w-64 flex flex-col border-r`}
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between h-16 px-4 border-b"
          style={{ borderColor: themeColors.border }}
        >
          <div className="flex items-center">

            <h1
              className="text-xl font-bold"
              style={{ color: themeColors.primary }}
            >
             CRM
            </h1>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:scale-110 transition-all duration-200"
            style={{
              color: themeColors.text,
              backgroundColor: themeColors.background,
            }}
            aria-label="Close sidebar"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="px-4 space-y-2" aria-label="Main navigation">
            {visibleRoutes.map((route) => (
              <SidebarItem
                key={route.path || route.name}
                route={route}
                isActive={isRouteActive(route)}
                themeColors={themeColors}
                onClose={onClose}
                currentPath={currentPath}
              />
            ))}
          </nav>
        </div>

        {/* Dark Mode Quick Switch */}
        <div className="px-4 py-3 border-t" style={{ borderColor: themeColors.border }}>
          <div
            onClick={toggleTheme}
            className="flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-xs group select-none"
            style={{
              backgroundColor: themeColors.background,
              borderColor: themeColors.border
            }}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: isDark ? "rgba(251, 191, 36, 0.15)" : "rgba(79, 70, 229, 0.1)",
                  color: isDark ? "#fbbf24" : "#4f46e5"
                }}
              >
                {isDark ? <FaSun className="text-sm text-amber-400" /> : <FaMoon className="text-sm text-indigo-600" />}
              </div>
              <span className="text-xs font-bold" style={{ color: themeColors.text }}>
                {isDark ? "Dark Mode" : "Light Mode"}
              </span>
            </div>

            {/* iOS style smooth toggle switch */}
            <div
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 ${
                isDark ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  isDark ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </div>
        </div>

        {/* User Section */}
        <div
          className="p-4 border-t"
          style={{ borderColor: themeColors.border }}
        >
          <div
            className="flex items-center mb-4 p-3 rounded-lg"
            style={{ backgroundColor: themeColors.background }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mr-3 border"
              style={{
                backgroundColor: themeColors.primary,
                color: themeColors.onPrimary,
                borderColor: themeColors.border,
              }}
              aria-hidden="true"
            >
              <FaUserCircle className="text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-medium text-sm truncate"
                style={{ color: themeColors.text }}
              >
                {user?.name || "Auction Manager"}
              </p>
              <p
                className="text-xs opacity-75 truncate"
                style={{ color: themeColors.textSecondary }}
              >
                {user?.role || "Administrator"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-3 px-4 rounded-lg text-center transition-all duration-200 flex items-center justify-center gap-2 border hover:shadow-md"
            style={{
              color: themeColors.danger,
              backgroundColor: "transparent",
              borderColor: themeColors.danger,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.danger;
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = themeColors.danger;
              e.currentTarget.style.transform = "translateY(0)";
            }}
            aria-label="Sign out"
          >
            <FaSignOutAlt className="text-sm" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default memo(Sidebar);
