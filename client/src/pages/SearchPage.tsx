import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, NavLink } from "react-router-dom";
import { Search, Users, FileText, Hash, UserRoundPlus, MessageCircle } from "lucide-react";
import type { Post, User, Community } from "../types/index";
import { searchService } from "../services/searchService";
import { imgUrl } from "../utils/imageUrl";
import PostCard from "../components/ui/PostCard";
import { PostListSkeleton } from "../components/ui/LoadingSkeleton";
import { followService } from "../services/followService";
import { useAuth } from "../context/AuthContext";

type Tab = "all" | "posts" | "people" | "communities" | "comments";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const { isAuthenticated } = useAuth();
  const [tab, setTab]               = useState<Tab>("all");
  const [posts, setPosts]           = useState<Post[]>([]);
  const [users, setUsers]           = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [comments, setComments] = useState<Awaited<ReturnType<typeof searchService.searchAll>>["comments"]>([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState("");
  const [searchError, setSearchError] = useState(false);
  const [postFilter, setPostFilter] = useState("relevance");
  const [tagFollowing, setTagFollowing] = useState(false);
  const requestRef = useRef(0);

  const doSearch = useCallback(async (query: string) => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setSearchError(false);
    try {
      const r = await searchService.searchAll(query.trim());
      if (requestId !== requestRef.current) return;
      setPosts(r.posts); setUsers(r.users); setCommunities(r.communities); setComments(r.comments);
      setSearched(query.trim());
    } catch (e) {
      if (requestId === requestRef.current) {
        console.error(e);
        setSearchError(true);
      }
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
    setComments([]);
    setSearched("");
    setLoading(false);
  }, [q, doSearch]);

  useEffect(() => {
    const tag = q.trim().replace(/^#/, "").toLowerCase();
    if (isAuthenticated && q.trim().startsWith("#") && tag) followService.tagState(tag).then(setTagFollowing).catch(() => setTagFollowing(false));
    else setTagFollowing(false);
  }, [q, isAuthenticated]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "all",         label: "All",         icon: <Search size={14} />,   count: posts.length + users.length + communities.length + comments.length },
    { key: "posts",       label: "Posts",       icon: <FileText size={14} />, count: posts.length },
    { key: "people",      label: "People",      icon: <Users size={14} />,    count: users.length },
    { key: "communities", label: "Communities", icon: <Hash size={14} />,     count: communities.length },
    { key: "comments", label: "Comments", icon: <MessageCircle size={14} />, count: comments.length },
  ];

  const showPosts = tab === "all" || tab === "posts";
  const showUsers = tab === "all" || tab === "people";
  const showComm  = tab === "all" || tab === "communities";
  const showComments = tab === "all" || tab === "comments";
  const sortedPosts = [...posts].sort((a, b) => {
    if (postFilter === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (postFilter === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (postFilter === "votes") return Number(b.vote_score) - Number(a.vote_score);
    if (postFilter === "views") return Number(b.views ?? 0) - Number(a.views ?? 0);
    if (postFilter === "answered") return Number(b.comment_count > 0) - Number(a.comment_count > 0);
    if (postFilter === "unanswered") return Number(a.comment_count > 0) - Number(b.comment_count > 0);
    return 0;
  });

  const card = { backgroundColor: "var(--surface)", border: "1px solid var(--border)" };

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-4">
      {/* Header */}
      {q.trim() && <div className="min-w-0 rounded-2xl px-4 py-4" style={card}>
        <div className="flex items-center gap-2 mb-1">
          <Search size={16} style={{ color: "var(--accent)" }} />
          <span className="text-xs" style={{ color: "var(--muted)" }}>Search results for</span>
        </div>
        <div className="flex items-center justify-between gap-3"><h1 className="text-lg font-bold truncate" style={{ color: "var(--text)" }}>{`"${q}"`}</h1>
          {isAuthenticated && q.trim().startsWith("#") && <button type="button" onClick={() => { const tag = q.trim().slice(1).toLowerCase(); followService.setTag(tag, !tagFollowing).then(() => setTagFollowing(!tagFollowing)).catch(() => {}); }} className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ color: tagFollowing ? "var(--text)" : "white", backgroundColor: tagFollowing ? "var(--surface2)" : "var(--accent)" }}>{!tagFollowing && <UserRoundPlus size={13} />}{tagFollowing ? "Following tag" : "Follow tag"}</button>}
        </div>
      </div>}

      {/* Tabs */}
      {(q.trim() || searched) && <div className="grid min-w-0 grid-cols-2 gap-1.5 rounded-2xl p-2 sm:grid-cols-5 sm:gap-1.5" style={card}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors sm:px-2"
            style={tab === t.key
              ? { backgroundColor: "var(--accent)", color: "#fff" }
              : { color: "var(--muted)" }}>
            {t.icon}
            <span className="truncate">{t.label}</span>
            {searched && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full"
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
        <PostListSkeleton count={2} />
      ) : searchError ? (
        <div className="mx-auto max-w-md rounded-2xl px-4 py-8 text-center" style={card}>
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Search is temporarily unavailable.</p>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>Please try again in a moment.</p>
          <button onClick={() => doSearch(q)} className="mt-4 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>Try again</button>
        </div>
      ) : !searched ? null : posts.length + users.length + communities.length + comments.length === 0 ? (
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
              {tab === "posts" && <div className="flex justify-end"><select aria-label="Filter posts" value={postFilter} onChange={event => setPostFilter(event.target.value)} className="rounded-lg px-3 py-2 text-xs outline-none" style={{ color: "var(--text)", backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                <option value="relevance">Relevance</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="views">Most viewed</option><option value="votes">Most upvoted</option><option value="answered">Answered</option><option value="unanswered">Unanswered</option>
              </select></div>}
              {tab === "all" && (
                <div className="flex items-center gap-2 px-1">
                  <FileText size={15} style={{ color: "var(--accent)" }} />
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Posts</h2>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{posts.length} found</span>
                </div>
              )}
              {sortedPosts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          )}
          {showComments && comments.length > 0 && <section className="space-y-2">
            <h2 className="flex items-center gap-2 px-1 text-sm font-semibold" style={{ color: "var(--text)" }}><MessageCircle size={15} style={{ color: "var(--accent)" }} /> Comments</h2>
            {comments.map(comment => <NavLink key={comment.id} to={`/post/${comment.post_id}#comment-${comment.id}`} className="block rounded-xl p-3 transition-colors hover:bg-[var(--surface2)]" style={card}>
              <p className="mb-1 text-xs" style={{ color: "var(--muted)" }}>u/{comment.username} on: <strong style={{ color: "var(--text)" }}>{comment.post_title}</strong></p>
              <p className="line-clamp-3 whitespace-pre-wrap text-sm" style={{ color: "var(--text)" }}>{comment.content}</p>
            </NavLink>)}
          </section>}
        </div>
      )}
    </div>
  );
};
export default SearchPage;
