import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type FontSize = "small" | "medium" | "large";
export type FontFamily = "Outfit" | "Poppins" | "Arial" | "Monocraft" | "Monospace";

interface SettingsContextValue {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  fontFamily: FontFamily;
  setFontFamily: (family: FontFamily) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const FONT_SIZE_VALUES: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

const FONT_FAMILY_VALUES: Record<FontFamily, string> = {
  Outfit: '"Outfit", sans-serif',
  Poppins: '"Poppins", sans-serif',
  Arial: "Arial, sans-serif",
  Monocraft: '"Monocraft", monospace',
  Monospace: "monospace",
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const stored = localStorage.getItem("settings.fontSize");
    return stored === "small" || stored === "large" ? stored : "medium";
  });
  const [fontFamily, setFontFamily] = useState<FontFamily>(() => {
    const stored = localStorage.getItem("settings.fontFamily");
    if (stored === "monospace") return "Monospace";
    return stored === "Poppins" || stored === "Arial" || stored === "Monocraft" || stored === "Monospace" ? stored : "Outfit";
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("settings.notificationsEnabled") !== "false"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--app-font-size", FONT_SIZE_VALUES[fontSize]);
    root.style.setProperty("--app-font-family", FONT_FAMILY_VALUES[fontFamily]);
    localStorage.setItem("settings.fontSize", fontSize);
    localStorage.setItem("settings.fontFamily", fontFamily);
    localStorage.setItem("settings.notificationsEnabled", String(notificationsEnabled));
  }, [fontSize, fontFamily, notificationsEnabled]);

  return (
    <SettingsContext.Provider value={{ fontSize, setFontSize, fontFamily, setFontFamily, notificationsEnabled, setNotificationsEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used inside SettingsProvider");
  return context;
};
