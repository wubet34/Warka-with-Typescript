import { useEffect, useState } from "react";
import { CalendarDays, Users } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useWarkaDialog } from "../context/WarkaDialogContext";

interface Stats {
  total_users: number;
  new_users_30_days: number;
  total_communities: number;
  total_posts: number;
  pending_reports: number;
}

interface Report {
  id: number; reason: string; details?: string; created_at: string; reporter_username: string;
  post_id?: number; post_title?: string; post_content?: string; comment_id?: number; comment_content?: string;
}

const AdminDashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const warkaDialog = useWarkaDialog();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [reportError, setReportError] = useState("");
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL?.trim() || "wubet453@gmail.com").toLowerCase();
  const isAdmin = user?.email.trim().toLowerCase() === adminEmail;

  useEffect(() => {
    if (authLoading || !isAuthenticated || !isAdmin) return;

    Promise.all([
      api.get<{ success: boolean; stats: Stats }>("/admin/stats"),
      api.get<{ success: boolean; reports: Report[] }>("/reports"),
    ])
      .then(([statsResponse, reportsResponse]) => { setStats(statsResponse.data.stats); setReports(reportsResponse.data.reports); })
      .catch((err: { response?: { status?: number; data?: { message?: string } }; message?: string }) => {
        const status = err.response?.status;
        const serverMessage = err.response?.data?.message;
        if (status === 401) setError("Your session expired. Sign in again with the admin account.");
        else if (status === 403) setError(`Admin access is limited to ${adminEmail}.`);
        else if (!status) setError(`Could not reach the API. ${err.message || "Check your connection and try again."}`);
        else setError(serverMessage || `The admin API returned an error (${status}).`);
      });
  }, [adminEmail, authLoading, isAdmin, isAuthenticated]);

  const reviewReport = async (id: number, action: "resolve" | "dismiss" | "remove") => {
    try {
      await api.patch(`/reports/${id}`, { action });
      setReports(current => current.filter(report => report.id !== id));
    } catch {
      setReportError("Could not update this report. Please refresh and try again.");
    }
  };

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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}><Users size={17} /> Total registered users</div>
            <p className="mt-3 text-4xl font-bold tabular-nums" style={{ color: "var(--text)" }}>{Number(stats.total_users).toLocaleString()}</p>
          </article>
          <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}><Users size={17} /> Communities</div>
            <p className="mt-3 text-4xl font-bold tabular-nums" style={{ color: "var(--text)" }}>{Number(stats.total_communities).toLocaleString()}</p>
          </article>
          <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}><CalendarDays size={17} /> Posts</div>
            <p className="mt-3 text-4xl font-bold tabular-nums" style={{ color: "var(--text)" }}>{Number(stats.total_posts).toLocaleString()}</p>
          </article>
          <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}><CalendarDays size={17} /> Pending reports</div>
            <p className="mt-3 text-4xl font-bold tabular-nums" style={{ color: "var(--text)" }}>{Number(stats.pending_reports).toLocaleString()}</p>
          </article>
          <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}><CalendarDays size={17} /> Joined in the last 30 days</div>
            <p className="mt-3 text-4xl font-bold tabular-nums" style={{ color: "var(--text)" }}>{Number(stats.new_users_30_days).toLocaleString()}</p>
          </article>
        </div>
      )}
      {isAuthenticated && isAdmin && <section className="mt-8 space-y-3">
        <div><h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Content reports</h2><p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Review user reports and remove content that violates the community rules.</p></div>
        {reportError && <p role="alert" className="rounded-xl p-3 text-sm text-red-500" style={{ backgroundColor: "var(--surface)" }}>{reportError}</p>}
        {reports.length === 0 && !error && <p className="rounded-xl p-4 text-sm" style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}>No pending reports.</p>}
        {reports.map(report => <article key={report.id} className="rounded-2xl border p-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs" style={{ color: "var(--muted)" }}>Reported by u/{report.reporter_username} · {new Date(report.created_at).toLocaleString()}</p><strong className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-500">{report.reason}</strong></div>
          <p className="mt-3 text-sm font-semibold" style={{ color: "var(--text)" }}>{report.post_title || "Reported comment"}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm" style={{ color: "var(--muted)" }}>{report.post_content || report.comment_content || "Content unavailable"}</p>
          {report.details && <p className="mt-2 rounded-lg p-2 text-sm" style={{ backgroundColor: "var(--surface2)", color: "var(--text)" }}>Report details: {report.details}</p>}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button onClick={() => void reviewReport(report.id, "dismiss")} className="rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Dismiss</button>
            <button onClick={() => void reviewReport(report.id, "resolve")} className="rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--text)" }}>Resolve</button>
            <button onClick={async () => { if (await warkaDialog.confirm("Permanently remove this reported content?", "Remove reported content", "Remove")) void reviewReport(report.id, "remove"); }} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">Remove content</button>
          </div>
        </article>)}
      </section>}
    </section>
  );
};

export default AdminDashboard;
