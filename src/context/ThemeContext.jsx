// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

// 🎨 Premium Color Palettes for SuperAdmin Panel
export const colorPalettes = {
  corporate: {
    id: "corporate",
    name: "Corporate Blue",
    description: "Classic enterprise blue with crisp contrast",
    previewColor: "#2563eb",
    primary: "#1e40af",
    primaryLight: "#1e40af",
    primaryDark: "#3b82f6",
    secondary: "#475569",
    secondaryLight: "#475569",
    secondaryDark: "#94a3b8",
    accent: "#f59e0b",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
    backgroundLight: "#f8fafc",
    backgroundDark: "#0b1329",
    surfaceLight: "#ffffff",
    surfaceDark: "#15203b",
    textLight: "#0f172a",
    textDark: "#f8fafc",
    borderLight: "#e2e8f0",
    borderDark: "#263554",
    hoverLight: "#f1f5f9",
    hoverDark: "#1e2c4f",
    activeLight: "#e2e8f0",
    activeDark: "#263554",
  },
  luxury: {
    id: "luxury",
    name: "Luxury Indigo",
    description: "Deep regal indigo with warm gold accents",
    previewColor: "#6366f1",
    primary: "#4338ca",
    primaryLight: "#4338ca",
    primaryDark: "#818cf8",
    secondary: "#4b5563",
    secondaryLight: "#4b5563",
    secondaryDark: "#9ca3af",
    accent: "#d97706",
    success: "#059669",
    warning: "#d97706",
    danger: "#dc2626",
    info: "#0284c7",
    backgroundLight: "#fafafa",
    backgroundDark: "#0f111a",
    surfaceLight: "#ffffff",
    surfaceDark: "#181b29",
    textLight: "#111827",
    textDark: "#f9fafb",
    borderLight: "#e5e7eb",
    borderDark: "#2b3046",
    hoverLight: "#f3f4f6",
    hoverDark: "#222638",
    activeLight: "#e5e7eb",
    activeDark: "#2b3046",
  },
  modern: {
    id: "modern",
    name: "Modern Emerald",
    description: "Vibrant emerald green with dark obsidian",
    previewColor: "#10b981",
    primary: "#059669",
    primaryLight: "#059669",
    primaryDark: "#34d399",
    secondary: "#475569",
    secondaryLight: "#475569",
    secondaryDark: "#94a3b8",
    accent: "#f59e0b",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
    backgroundLight: "#f8fafc",
    backgroundDark: "#0c151d",
    surfaceLight: "#ffffff",
    surfaceDark: "#15232d",
    textLight: "#0f172a",
    textDark: "#f1f5f9",
    borderLight: "#e2e8f0",
    borderDark: "#223543",
    hoverLight: "#f1f5f9",
    hoverDark: "#1b2c3a",
    activeLight: "#e2e8f0",
    activeDark: "#223543",
  },
  minimal: {
    id: "minimal",
    name: "Minimal Monochrome",
    description: "Ultra clean high contrast monochrome",
    previewColor: "#475569",
    primary: "#0f172a",
    primaryLight: "#0f172a",
    primaryDark: "#f8fafc",
    secondary: "#64748b",
    secondaryLight: "#64748b",
    secondaryDark: "#a1a1aa",
    accent: "#71717a",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
    backgroundLight: "#ffffff",
    backgroundDark: "#09090b",
    surfaceLight: "#f4f4f5",
    surfaceDark: "#18181b",
    textLight: "#09090b",
    textDark: "#fafafa",
    borderLight: "#e4e4e7",
    borderDark: "#27272a",
    hoverLight: "#f4f4f5",
    hoverDark: "#27272a",
    activeLight: "#e4e4e7",
    activeDark: "#27272a",
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    return localStorage.getItem("theme") || "light";
  };

  const getInitialPalette = () => {
    return localStorage.getItem("palette") || "corporate";
  };

  const [theme, setThemeState] = useState(getInitialTheme);
  const [palette, setPalette] = useState(getInitialPalette);

  // Compute resolved theme (handles 'system' mode)
  const getResolvedTheme = useCallback((currentTheme) => {
    if (currentTheme === "system") {
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return "light";
    }
    return currentTheme === "dark" ? "dark" : "light";
  }, []);

  const [resolvedTheme, setResolvedTheme] = useState(() => getResolvedTheme(getInitialTheme()));

  // Listen to system dark mode changes if theme is "system"
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e) => {
      if (theme === "system") {
        setResolvedTheme(e.matches ? "dark" : "light");
      }
    };

    setResolvedTheme(getResolvedTheme(theme));

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, [theme, getResolvedTheme]);

  // Set theme explicitly ('light' | 'dark' | 'system')
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  }, []);

  // Quick toggle between light & dark
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const active = getResolvedTheme(prev);
      const next = active === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      return next;
    });
  }, [getResolvedTheme]);

  const changePalette = useCallback((newPalette) => {
    if (colorPalettes[newPalette]) {
      setPalette(newPalette);
      localStorage.setItem("palette", newPalette);
    }
  }, []);

  // Current palette with fallback
  const currentPalette = colorPalettes[palette] || colorPalettes.corporate;
  const isDark = resolvedTheme === "dark";

  // Build active theme colors
  const currentThemeColors = useMemo(() => {
    return {
      mode: isDark ? "dark" : "light",
      isDark,
      primary: isDark ? currentPalette.primaryDark : currentPalette.primaryLight,
      secondary: isDark ? currentPalette.secondaryDark : currentPalette.secondaryLight,
      accent: currentPalette.accent,
      success: currentPalette.success,
      warning: currentPalette.warning,
      danger: currentPalette.danger,
      info: currentPalette.info,
      background: isDark ? currentPalette.backgroundDark : currentPalette.backgroundLight,
      surface: isDark ? currentPalette.surfaceDark : currentPalette.surfaceLight,
      text: isDark ? currentPalette.textDark : currentPalette.textLight,
      textSecondary: isDark ? currentPalette.secondaryDark : currentPalette.secondaryLight,
      border: isDark ? currentPalette.borderDark : currentPalette.borderLight,
      hover: {
        background: isDark ? currentPalette.hoverDark : currentPalette.hoverLight,
        text: isDark ? currentPalette.textDark : currentPalette.textLight,
      },
      active: {
        background: isDark ? currentPalette.activeDark : currentPalette.activeLight,
        text: isDark ? currentPalette.primaryDark : currentPalette.primaryLight,
      },
      onPrimary: isDark && palette === "minimal" ? "#09090b" : "#ffffff",
    };
  }, [isDark, currentPalette, palette]);

  // Apply .dark class, data-theme, color-scheme, and CSS variables to document.documentElement
  useEffect(() => {
    const html = document.documentElement;

    if (resolvedTheme === "dark") {
      html.classList.add("dark");
      html.setAttribute("data-theme", "dark");
      html.style.colorScheme = "dark";
    } else {
      html.classList.remove("dark");
      html.setAttribute("data-theme", "light");
      html.style.colorScheme = "light";
    }

    // Set CSS custom variables
    html.style.setProperty("--color-primary", currentThemeColors.primary);
    html.style.setProperty("--color-background", currentThemeColors.background);
    html.style.setProperty("--color-surface", currentThemeColors.surface);
    html.style.setProperty("--color-text", currentThemeColors.text);
    html.style.setProperty("--color-text-secondary", currentThemeColors.textSecondary);
    html.style.setProperty("--color-border", currentThemeColors.border);

    localStorage.setItem("theme", theme);
    localStorage.setItem("palette", palette);
  }, [resolvedTheme, theme, palette, currentThemeColors]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        isDark,
        setTheme,
        toggleTheme,
        palette,
        changePalette,
        themeColors: currentThemeColors,
        colorPalettes,
        availablePalettes: Object.keys(colorPalettes)
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};