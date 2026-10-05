import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, Check, LoaderCircle, LockKeyhole, Monitor, Trash2, Type, X } from "lucide-react";
import { useSettings, type FontFamily, type FontSize } from "../context/SettingsContext";
import { useTheme, type Theme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

const cardStyle = { backgroundColor: "var(--surface)", border: "1px solid var(--border)" };

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
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

  const deleteAccount = async () => {
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await authService.deleteAccount();
      logout();
      navigate("/", { replace: true });
    } catch (error) {
      setDeleteError((error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not delete your account. Please try again.");
      setDeleteBusy(false);
    }
  };

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setPasswordBusy(true); setPasswordMessage(""); setPasswordError("");
    try {
      await authService.changePassword({ current_password: currentPassword || undefined, new_password: newPassword });
      setCurrentPassword(""); setNewPassword(""); setPasswordMessage("Your password was updated.");
    } catch (error) {
      setPasswordError((error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not update password.");
    } finally { setPasswordBusy(false); }
  };

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

      {isAuthenticated && <section className="overflow-hidden rounded-2xl" style={cardStyle}>
        <div className="flex items-center gap-3 border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <LockKeyhole size={19} style={{ color: "var(--accent)" }} />
          <div><h2 className="font-semibold" style={{ color: "var(--text)" }}>Change password</h2><p className="text-xs" style={{ color: "var(--muted)" }}>Use at least 8 characters for your new password.</p></div>
        </div>
        <form onSubmit={changePassword} className="space-y-3 p-5">
          <input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} placeholder="Current password (if set)" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none sm:max-w-md" style={{ color: "var(--text)", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)" }} />
          <input type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={event => setNewPassword(event.target.value)} placeholder="New password" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none sm:max-w-md" style={{ color: "var(--text)", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)" }} />
          {passwordError && <p role="alert" className="text-sm text-red-500">{passwordError}</p>}
          {passwordMessage && <p role="status" className="text-sm text-green-600">{passwordMessage}</p>}
          <button type="submit" disabled={passwordBusy || newPassword.length < 8} className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--accent)" }}>{passwordBusy ? "Updating…" : "Update password"}</button>
        </form>
      </section>}

      {isAuthenticated && <section className="overflow-hidden rounded-2xl" style={{ ...cardStyle, borderColor: "#ef444455" }}>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-start gap-3">
            <Trash2 size={19} className="mt-0.5 text-red-500" />
            <div>
              <h2 className="font-semibold text-red-500">Delete account</h2>
              <p className="mt-1 max-w-md text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                Permanently delete your account, owned communities, posts, comments, votes, and profile. This cannot be recovered.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => { setDeleteError(""); setDeleteOpen(true); }}
            className="shrink-0 rounded-xl border border-red-500/40 px-3 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10">
            Delete account
          </button>
        </div>
      </section>}

      {deleteOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !deleteBusy) setDeleteOpen(false); }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" aria-describedby="delete-account-description"
          className="w-full max-w-md rounded-2xl p-5 shadow-2xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-red-500"><AlertTriangle size={20} /><h2 id="delete-account-title" className="text-lg font-bold">Delete your account?</h2></div>
            <button type="button" aria-label="Close confirmation" disabled={deleteBusy} onClick={() => setDeleteOpen(false)} className="rounded-lg p-1 hover:bg-[var(--surface2)]" style={{ color: "var(--muted)" }}><X size={18} /></button>
          </div>
          <p id="delete-account-description" className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            This action is permanent and cannot be recovered. Your profile, owned communities, posts, comments, votes, and account data will be deleted. Are you sure you want to continue?
          </p>
          {deleteError && <p role="alert" className="mt-3 text-sm text-red-500">{deleteError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" disabled={deleteBusy} onClick={() => setDeleteOpen(false)} className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-[var(--surface2)]" style={{ color: "var(--text)" }}>Cancel</button>
            <button type="button" disabled={deleteBusy} onClick={deleteAccount} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
              {deleteBusy ? <><LoaderCircle size={15} className="animate-spin" /> Deleting…</> : "Confirm delete account"}
            </button>
          </div>
        </section>
      </div>}

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
