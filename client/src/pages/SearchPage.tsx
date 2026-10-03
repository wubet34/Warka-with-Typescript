import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, NavLink } from "react-router-dom";
import { Loader2, Search, Users, FileText, Hash } from "lucide-react";
import type { Post, User, Community } from "../types/index";
import { searchService } from "../services/searchService";
import { imgUrl } from "../utils/imageUrl";
import PostCard from "../components/ui/PostCard";

type Tab = "all" | "posts" | "people" | "communities";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [tab, setTab]               = useState<Tab>("all");
  const [posts, setPosts]           = useState<Post[]>([]);
  const [users, setUsers]           = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState("");
  const requestRef = useRef(0);

  const doSearch = useCallback(async (query: string) => {
    const requestId = ++requestRef.current;
    setLoading(true);
    try {
      const r = await searchService.searchAll(query.trim());
      if (requestId !== requestRef.current) return;
      setPosts(r.posts); setUsers(r.users); setCommunities(r.communities);
      setSearched(query.trim());
    } catch (e) {
      if (requestId === requestRef.current) console.error(e);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const query = q.trim();
    if (query) {
      doSearch(query);
      return;
    }
    requestRef.current += 1;
    setPosts([]);
    setUsers([]);
    setCommunities([]);
    setSearched("");
    setLoading(false);
  }, [q, doSearch]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "all",         label: "All",         icon: <Search size={14} />,   count: posts.length + users.length + communities.length },
    { key: "posts",       label: "Posts",       icon: <FileText size={14} />, count: posts.length },
    { key: "people",      label: "People",      icon: <Users size={14} />,    count: users.length },
    { key: "communities", label: "Communities", icon: <Hash size={14} />,     count: communities.length },
  ];

  const showPosts = tab === "all" || tab === "posts";
  const showUsers = tab === "all" || tab === "people";
  const showComm  = tab === "all" || tab === "communities";

  const card = { backgroundColor: "var(--surface)", border: "1px solid var(--border)" };

  return (
    <div className="space-y-4">
      {/* Header */}
      {q.trim() && <div className="rounded-2xl px-4 py-4" style={card}>
        <div className="flex items-center gap-2 mb-1">
          <Search size={16} style={{ color: "var(--accent)" }} />
          <span className="text-xs" style={{ color: "var(--muted)" }}>Search results for</span>
        </div>
        <h1 className="text-lg font-bold truncate" style={{ color: "var(--text)" }}>"{q}"</h1>
      </div>}

      {/* Tabs */}
      {(q.trim() || searched) && <div className="flex gap-1 rounded-2xl p-1.5" style={card}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-colors"
            style={tab === t.key
              ? { backgroundColor: "var(--accent)", color: "#fff" }
              : { color: "var(--muted)" }}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {searched && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={tab === t.key
                  ? { backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }
                  : { backgroundColor: "var(--surface2)", color: "var(--muted)" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} /></div>
      ) : !searched ? null : posts.length + users.length + communities.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--muted)" }}>
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No results for "{searched}"</p>
          <p className="text-xs mt-1">Try different keywords</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Communities */}
          {showComm && communities.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <Hash size={15} style={{ color: "var(--accent)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Communities</h2>
                <span className="ml-auto text-xs" style={{ color: "var(--muted)" }}>{communities.length} found</span>
              </div>
              {communities.map(c => (
                <NavLink key={c.id} to={`/w/${c.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface2)] transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  {c.logo
                    ? <img src={c.logo} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                    : <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                        style={{ backgroundColor: "var(--surface2)", color: "var(--accent)" }}>
                        {c.name[0].toUpperCase()}
                      </div>}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>w/{c.name}</p>
                    {c.description && <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{c.description}</p>}
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{c.member_count?.toLocaleString()} members</p>
                  </div>
                </NavLink>
              ))}
            </div>
          )}

          {/* People */}
          {showUsers && users.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <Users size={15} style={{ color: "var(--accent)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>People</h2>
                <span className="ml-auto text-xs" style={{ color: "var(--muted)" }}>{users.length} found</span>
              </div>
              {users.map(u => (
                <NavLink key={u.id} to={`/user/${u.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface2)] transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  {u.profile_image
                    ? <img src={imgUrl(u.profile_image)} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                    : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                        style={{ backgroundColor: "var(--accent)" }}>
                        {u.username[0].toUpperCase()}
                      </div>}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{u.username}</p>
                    {u.bio && <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{u.bio}</p>}
                  </div>
                </NavLink>
              ))}
            </div>
          )}

          {/* Posts */}
          {showPosts && posts.length > 0 && (
            <div className="space-y-3">
              {tab === "all" && (
                <div className="flex items-center gap-2 px-1">
                  <FileText size={15} style={{ color: "var(--accent)" }} />
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Posts</h2>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{posts.length} found</span>
                </div>
              )}
              {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default SearchPage;
