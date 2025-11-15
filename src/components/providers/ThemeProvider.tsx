// src/components/providers/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  generateTheme,
  applyThemeToDocument,
  type GeneratedTheme,
} from "@/lib/theme-generator";

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
}

interface ThemeContextType {
  theme: GeneratedTheme | null;
  themeConfig: ThemeConfig | null;
  isDark: boolean;
  toggleTheme: () => void;
  updateThemeConfig: (config: ThemeConfig) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 🎯 FIX: Load dark mode preference BEFORE rendering
function getInitialDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  
  const saved = localStorage.getItem("theme-mode");
  if (saved) {
    return saved === "dark";
  }
  
  // Check system preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ThemeConfig;
  defaultMode?: "light" | "dark";
}

export function ThemeProvider({
  children,
  initialTheme,
  defaultMode = "light",
}: ThemeProviderProps) {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(
    initialTheme || null
  );
  const [theme, setTheme] = useState<GeneratedTheme | null>(null);
  // 🎯 FIX: Initialize with saved preference immediately
  const [isDark, setIsDark] = useState(() => getInitialDarkMode());

  // Load theme from meta.json or localStorage
  useEffect(() => {
    const loadThemeConfig = async () => {
      try {
        if (!initialTheme) {
          const response = await fetch("/src/content/meta.json");
          const meta = await response.json();

          if (meta.theme) {
            setThemeConfig(meta.theme);
            return;
          }
        }

        const defaultTheme: ThemeConfig = {
          primary: "#2563eb",
          secondary: "#64748b",
          accent: "#7c3aed",
        };
        setThemeConfig(defaultTheme);
      } catch (error) {
        console.warn("Failed to load theme config:", error);
        const defaultTheme: ThemeConfig = {
          primary: "#2563eb",
          secondary: "#64748b",
          accent: "#7c3aed",
        };
        setThemeConfig(defaultTheme);
      }
    };

    if (!themeConfig) {
      loadThemeConfig();
    }
  }, [initialTheme, themeConfig]);

  // Generate and apply theme when config OR mode changes
  useEffect(() => {
    if (themeConfig) {
      const generatedTheme = generateTheme(themeConfig);
      setTheme(generatedTheme);
      applyThemeToDocument(generatedTheme, isDark);
    }
  }, [themeConfig, isDark]);

  // Handle dark mode class toggle
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme-mode", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const updateThemeConfig = (config: ThemeConfig) => {
    setThemeConfig(config);
    localStorage.setItem("theme-config", JSON.stringify(config));
  };

  const contextValue: ThemeContextType = {
    theme,
    themeConfig,
    isDark,
    toggleTheme,
    updateThemeConfig,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Theme Customizer Component (for testing/admin purposes)
export function ThemeCustomizer() {
  const { themeConfig, updateThemeConfig } = useTheme();
  const [localConfig, setLocalConfig] = useState(themeConfig);

  useEffect(() => {
    if (themeConfig) {
      setLocalConfig(themeConfig);
    }
  }, [themeConfig]);

  const handleColorChange = (key: keyof ThemeConfig, value: string) => {
    if (!localConfig) return;

    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    updateThemeConfig(newConfig);
  };

  if (!localConfig) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg">
      <h3 className="font-semibold mb-3 text-sm">Theme Customizer</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Primary Color
          </label>
          <input
            type="color"
            value={localConfig.primary}
            onChange={(e) => handleColorChange("primary", e.target.value)}
            className="w-full h-8 rounded border cursor-pointer"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Secondary Color
          </label>
          <input
            type="color"
            value={localConfig.secondary}
            onChange={(e) => handleColorChange("secondary", e.target.value)}
            className="w-full h-8 rounded border cursor-pointer"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Accent Color
          </label>
          <input
            type="color"
            value={localConfig.accent}
            onChange={(e) => handleColorChange("accent", e.target.value)}
            className="w-full h-8 rounded border cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
