import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Theme = "system" | "light" | "dark" | "catppuccin" | "kanagawa";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "light" || saved === "dark" || saved === "catppuccin" || saved === "kanagawa") return saved;
    return "system";
  });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const updatePreference = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  const effectiveTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = effectiveTheme;
    root.classList.toggle("dark", effectiveTheme !== "light");
    localStorage.setItem("theme", theme);
  }, [theme, effectiveTheme]);

  const toggle = () => setTheme(effectiveTheme === "light" ? "dark" : "light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, isDark: effectiveTheme !== "light" }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
