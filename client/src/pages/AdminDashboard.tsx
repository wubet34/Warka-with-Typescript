import { useEffect, useState } from "react";
import { CalendarDays, Users } from "lucide-react";
import api from "../api/client";

interface Stats {
  total_users: number;
  new_users_30_days: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ success: boolean; stats: Stats }>("/admin/stats")
      .then(response => setStats(response.data.stats))
      .catch((err: { response?: { data?: { message?: string } } }) => {
        setError(err.response?.data?.message || "Could not load user statistics.");
      });
  }, []);

  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Administration</p>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--text)" }}>Platform users</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Registered account totals for Warka.</p>
      </div>

      {error && <p className="rounded-xl p-4 text-sm" style={{ color: "#f85149", backgroundColor: "rgba(248,81,73,0.1)" }}>{error}</p>}
      {!error && !stats && <p className="text-sm" style={{ color: "var(--muted)" }}>Loading user statistics…</p>}
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
