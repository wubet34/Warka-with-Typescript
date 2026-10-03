import { useEffect, useState } from "react";
import { CalendarDays, Users } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Stats {
  total_users: number;
  new_users_30_days: number;
}

const AdminDashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL?.trim() || "wubet453@gmail.com").toLowerCase();
  const isAdmin = user?.email.trim().toLowerCase() === adminEmail;

  useEffect(() => {
    if (authLoading || !isAuthenticated || !isAdmin) return;

    api.get<{ success: boolean; stats: Stats }>("/admin/stats")
      .then(response => setStats(response.data.stats))
      .catch((err: { response?: { status?: number; data?: { message?: string } }; message?: string }) => {
        const status = err.response?.status;
        const serverMessage = err.response?.data?.message;
        if (status === 401) setError("Your session expired. Sign in again with the admin account.");
        else if (status === 403) setError(`Admin access is limited to ${adminEmail}.`);
        else if (!status) setError(`Could not reach the API. ${err.message || "Check your connection and try again."}`);
        else setError(serverMessage || `The admin API returned an error (${status}).`);
      });
  }, [adminEmail, authLoading, isAdmin, isAuthenticated]);

  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Administration</p>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--text)" }}>Platform users</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Registered account totals for Warka.</p>
      </div>

      {authLoading && <p className="text-sm" style={{ color: "var(--muted)" }}>Checking your sign-in…</p>}
      {!authLoading && !isAuthenticated && <p className="rounded-xl p-4 text-sm" style={{ color: "var(--muted)", backgroundColor: "var(--surface)" }}>Sign in with the admin account ({adminEmail}) to view statistics.</p>}
      {!authLoading && isAuthenticated && !isAdmin && <p className="rounded-xl p-4 text-sm" style={{ color: "var(--muted)", backgroundColor: "var(--surface)" }}>This page is available to {adminEmail}. You are signed in as {user?.email}.</p>}
      {error && <p className="rounded-xl p-4 text-sm" style={{ color: "#f85149", backgroundColor: "rgba(248,81,73,0.1)" }}>{error}</p>}
      {!authLoading && isAuthenticated && isAdmin && !error && !stats && <p className="text-sm" style={{ color: "var(--muted)" }}>Loading user statistics…</p>}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}><Users size={17} /> Total registered users</div>
            <p className="mt-3 text-4xl font-bold tabular-nums" style={{ color: "var(--text)" }}>{Number(stats.total_users).toLocaleString()}</p>
          </article>
          <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}><CalendarDays size={17} /> Joined in the last 30 days</div>
            <p className="mt-3 text-4xl font-bold tabular-nums" style={{ color: "var(--text)" }}>{Number(stats.new_users_30_days).toLocaleString()}</p>
          </article>
        </div>
      )}
    </section>
  );
};

export default AdminDashboard;
