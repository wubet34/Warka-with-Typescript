import { Bell, Check, Monitor, Type } from "lucide-react";
import { useSettings, type FontFamily, type FontSize } from "../context/SettingsContext";
import { useTheme, type Theme } from "../context/ThemeContext";

const cardStyle = { backgroundColor: "var(--surface)", border: "1px solid var(--border)" };

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize, fontFamily, setFontFamily, notificationsEnabled, setNotificationsEnabled } = useSettings();
  const fontSizes: { value: FontSize; label: string; sample: string }[] = [
    { value: "small", label: "Small", sample: "Aa" },
    { value: "medium", label: "Medium", sample: "Aa" },
    { value: "large", label: "Large", sample: "Aa" },
  ];
  const fontFamilies: { value: FontFamily; label: string }[] = [
    { value: "Outfit", label: "Outfit" },
    { value: "Poppins", label: "Poppins" },
    { value: "Arial", label: "Arial" },
    { value: "Monocraft", label: "Monocraft" },
    { value: "Monospace", label: "Monospace" },
  ];
  const themes: { value: Theme; label: string; description: string }[] = [
    { value: "system", label: "Device", description: "Follow your device setting" },
    { value: "light", label: "Light", description: "Bright surfaces" },
    { value: "dark", label: "Dark", description: "Warka dark mode" },
    { value: "catppuccin", label: "Catppuccin", description: "Soft lavender colors" },
    { value: "kanagawa", label: "Kanagawa", description: "Muted ink and green colors" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Settings</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Adjust how Warka looks and how it notifies you.</p>
      </header>

      <section className="overflow-hidden rounded-2xl" style={cardStyle}>
        <div className="flex items-center gap-3 border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <Monitor size={19} style={{ color: "var(--accent)" }} />
          <div>
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Appearance</h2>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Choose a theme and reading style.</p>
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          <div className="px-5 py-4">
            <p className="mb-3 text-sm font-medium" style={{ color: "var(--text)" }}>Color theme</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {themes.map(option => (
                <button key={option.value} type="button" aria-pressed={theme === option.value}
                  onClick={() => setTheme(option.value)}
                  className="flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors hover:bg-[var(--surface2)]"
                  style={{ color: "var(--text)", backgroundColor: theme === option.value ? "var(--surface2)" : "transparent", borderColor: theme === option.value ? "var(--accent)" : "var(--border)" }}>
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                    style={{ borderColor: theme === option.value ? "var(--accent)" : "var(--muted)", backgroundColor: theme === option.value ? "var(--accent)" : "transparent" }}>
                    {theme === option.value && <Check size={11} className="text-white" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="mt-0.5 block text-xs" style={{ color: "var(--muted)" }}>{option.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <Type size={16} style={{ color: "var(--muted)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Font size</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {fontSizes.map(option => (
                <button key={option.value} type="button" aria-pressed={fontSize === option.value}
                  onClick={() => setFontSize(option.value)}
                  className="rounded-xl border px-3 py-3 text-left transition-colors hover:bg-[var(--surface2)]"
                  style={{ color: "var(--text)", backgroundColor: fontSize === option.value ? "var(--surface2)" : "transparent", borderColor: fontSize === option.value ? "var(--accent)" : "var(--border)" }}>
                  <span className={`block font-semibold ${option.value === "small" ? "text-xs" : option.value === "large" ? "text-lg" : "text-sm"}`}>{option.sample}</span>
                  <span className="mt-1 block text-xs" style={{ color: "var(--muted)" }}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-4">
            <label htmlFor="settings-font-family" className="mb-2 block text-sm font-medium" style={{ color: "var(--text)" }}>Font family</label>
            <select id="settings-font-family" value={fontFamily} onChange={event => setFontFamily(event.target.value as FontFamily)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none sm:max-w-xs"
              style={{ color: "var(--text)", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)" }}>
              {fontFamilies.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl" style={cardStyle}>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-start gap-3">
            <Bell size={19} className="mt-0.5" style={{ color: "var(--accent)" }} />
            <div>
              <h2 className="font-semibold" style={{ color: "var(--text)" }}>Notifications</h2>
              <p className="mt-1 max-w-md text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                Show in-app notifications on this device. You can still view existing notifications when you turn this back on.
              </p>
            </div>
          </div>
          <button type="button" role="switch" aria-checked={notificationsEnabled}
            aria-label="Enable in-app notifications" onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${notificationsEnabled ? "bg-[var(--accent)]" : "bg-gray-400"}`}>
            <span className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--accent)] shadow transition-transform ${notificationsEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`}>
              {notificationsEnabled && <Check size={12} />}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
