import { useState, useEffect } from "react";
import { Users, TrendingUp, Search, Loader2, Plus, LogIn } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import type { Community } from "../types/index";
import { communityService } from "../services/communityService";
import { useAuth } from "../context/AuthContext";
import CreateCommunityModal from "../components/ui/CreateCommunityModal";

interface CommunityWithMembership extends Community {
  isMember: boolean;
  toggling: boolean;
}

const RightSidebar = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [q, setQ]               = useState("");
  const [items, setItems]       = useState<CommunityWithMembership[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    communityService.getCommunities()
      .then(async data => {
        const slice = data.slice(0, 5);
        // Check membership for each community if logged in
        const enriched = await Promise.all(
          slice.map(async c => {
            let isMember = false;
            if (isAuthenticated) {
              try { isMember = await communityService.checkMembership(c.id); } catch { /* ignore */ }
            }
            return { ...c, isMember, toggling: false };
          })
        );
        setItems(enriched);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const handleToggle = async (id: number, isMember: boolean) => {
    if (!isAuthenticated) return;
    // Optimistic update
    setItems(prev => prev.map(c => c.id === id ? { ...c, toggling: true } : c));
    try {
      if (isMember) {
        await communityService.leaveCommunity(id);
        setItems(prev => prev.map(c =>
          c.id === id ? { ...c, isMember: false, toggling: false, member_count: c.member_count - 1 } : c
        ));
      } else {
        await communityService.joinCommunity(id);
        setItems(prev => prev.map(c =>
          c.id === id ? { ...c, isMember: true, toggling: false, member_count: c.member_count + 1 } : c
        ));
      }
    } catch (err) {
      console.error(err);
      setItems(prev => prev.map(c => c.id === id ? { ...c, toggling: false } : c));
    }
  };

  const card = { backgroundColor: "var(--surface)", border: "1px solid var(--border)" };

  return (
    <>
      {showCreate && <CreateCommunityModal onClose={() => setShowCreate(false)} />}
      <div className="space-y-3 py-2">

        {/* Search */}
        <div className="rounded-2xl p-3" style={card}>
          <form onSubmit={handleSearch} className="flex items-center rounded-full gap-2 px-4 py-2.5"
            style={{ backgroundColor: "var(--input-bg)" }}>
            <Search size={16} style={{ color: "var(--muted)" }} className="shrink-0" />
            <input type="text" placeholder="Search Warka..." value={q}
              onChange={e => setQ(e.target.value)}
              className="bg-transparent outline-none text-sm w-full" style={{ color: "var(--text)" }} />
          </form>
        </div>

        {/* Communities */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "var(--text)" }}>
              <Users size={15} style={{ color: "var(--accent)" }} /> Communities
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--accent)" }} />
            </div>
          ) : items.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: "var(--muted)" }}>No communities yet.</p>
          ) : (
            <div>
              {items.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface2)] transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  {/* Logo */}
                  {c.logo
                    ? <img src={c.logo} className="w-9 h-9 rounded-full object-cover shrink-0" alt={c.name} />
                    : <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
                        style={{ backgroundColor: "var(--accent)" }}>
                        {c.name[0].toUpperCase()}
                      </div>}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <NavLink to={`/w/${c.slug}`} className="text-sm font-medium truncate hover:underline block"
                      style={{ color: "var(--text)" }}>
                      w/{c.name}
                    </NavLink>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {c.member_count.toLocaleString()} members
                      {c.isMember && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: "var(--accent)", color: "#fff", opacity: 0.8 }}>joined</span>}
                    </p>
                  </div>

                  {/* Join / Leave button */}
                  {isAuthenticated ? (
                    <button
                      onClick={() => handleToggle(c.id, c.isMember)}
                      disabled={c.toggling}
                      className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-50 hover:opacity-90"
                      style={c.isMember
                        ? { border: "1px solid var(--border)", color: "var(--muted)" }
                        : { backgroundColor: "var(--accent)", color: "#fff" }}>
                      {c.toggling ? "..." : c.isMember ? "Leave" : "Join"}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate("/home")}
                      className="shrink-0 p-1.5 rounded-full hover:bg-[var(--surface2)] transition-colors"
                      style={{ color: "var(--muted)" }}
                      title="Sign in to join">
                      <LogIn size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {isAuthenticated && (
            <div className="px-4 py-3">
              <button onClick={() => setShowCreate(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs transition-colors hover:opacity-80"
                style={{ border: "1px dashed var(--border)", color: "var(--muted)" }}>
                <Plus size={13} /> Create Community
              </button>
            </div>
          )}
        </div>

        {/* Trending */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <div className="flex items-center gap-1.5 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <TrendingUp size={15} style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Trending</h3>
          </div>
          <p className="text-xs text-center py-4" style={{ color: "var(--muted)" }}>Coming soon.</p>
        </div>
      </div>
    </>
  );
};

export default RightSidebar;
