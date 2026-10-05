import { useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

interface PollOption { id: number; text: string; votes: number; selected: boolean | null }
const PollWidget = ({ postId }: { postId: number }) => {
  const { isAuthenticated } = useAuth();
  const [options, setOptions] = useState<PollOption[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = () => api.get<{ options: PollOption[]; total_votes: number }>(`/posts/${postId}/poll`).then(({ data }) => { setOptions(data.options); setTotal(data.total_votes); }).catch(() => setError("Poll options could not be loaded."));
  useEffect(() => { void load(); }, [postId]);
  const hasVoted = options.some(option => option.selected);
  const castVote = async (optionId: number) => {
    if (!isAuthenticated) { setError("Sign in to vote in this poll."); return; }
    setBusy(true); setError("");
    try { await api.post(`/posts/${postId}/poll/vote`, { option_id: optionId }); await load(); }
    catch { setError("Could not save your poll vote."); }
    finally { setBusy(false); }
  };
  if (!options.length && !error) return <p className="mb-3 text-xs" style={{ color: "var(--muted)" }}>Loading poll…</p>;
  return <div className="mb-3 space-y-2 rounded-xl p-3" style={{ backgroundColor: "var(--surface2)" }}>
    {options.map(option => {
      const percentage = total ? Math.round(Number(option.votes) * 100 / total) : 0;
      return <button key={option.id} type="button" disabled={busy || hasVoted} onClick={() => void castVote(option.id)} className="relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm disabled:cursor-default" style={{ color: "var(--text)", borderColor: option.selected ? "var(--accent)" : "var(--border)" }}>
        {hasVoted && <span className="absolute inset-y-0 left-0 opacity-15" style={{ width: `${percentage}%`, backgroundColor: "var(--accent)" }} />}
        <span className="relative flex justify-between gap-2"><span>{option.text}{option.selected ? " ✓" : ""}</span>{hasVoted && <span className="tabular-nums" style={{ color: "var(--muted)" }}>{percentage}%</span>}</span>
      </button>;
    })}
    <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}><span>{total} votes</span>{hasVoted && <span>Your vote is recorded</span>}</div>
    {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
  </div>;
};
export default PollWidget;
