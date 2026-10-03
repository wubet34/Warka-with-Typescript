import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Users, FileText } from "lucide-react";
import type { Community, Post } from "../types/index";
import { communityService } from "../services/communityService";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import PostCard from "../components/ui/PostCard";
import CreatePostForm from "../components/ui/CreatePostForm";
import RealtimePostNotice from "../components/ui/RealtimePostNotice";
import api from "../api/client";
import { CommunityPageSkeleton } from "../components/ui/LoadingSkeleton";

const CommunityPage = () => {
  const { communitySlug } = useParams<{ communitySlug: string }>();
  const { isAuthenticated, user } = useAuth();
  const { socket, joinCommunity, leaveCommunity } = useSocket();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts]         = useState<Post[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [joined, setJoined]       = useState(false);
  const [joining, setJoining]     = useState(false);
  const [livePostNotice, setLivePostNotice] = useState<Post | null>(null);
  const knownPostIds = useRef(new Set<number>());

  useEffect(() => {
    if (!communitySlug) return;
    setLoading(true); setError("");
    setCommunity(null);
    setPosts([]);
    setLivePostNotice(null);
    knownPostIds.current.clear();
    communityService.getCommunityBySlug(communitySlug)
      .then(async c => {
        setCommunity(c);
        const loadedPosts = await communityService.getCommunityPosts(c.id);
        setPosts(current => {
          const byId = new Map([...loadedPosts, ...current].map(post => [post.id, post]));
          const merged = [...byId.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          knownPostIds.current = new Set(merged.map(post => post.id));
          return merged;
        });
        // Check if user is already a member
        if (isAuthenticated) {
          try {
            const isMember = await communityService.checkMembership(c.id);
            setJoined(isMember);
          } catch { /* ignore */ }
        }
      })
      .catch(() => setError("Community not found."))
      .finally(() => setLoading(false));
  }, [communitySlug, isAuthenticated]);

  useEffect(() => {
    if (!community?.id) return;
    joinCommunity(community.id);
    const h = (post: Post) => {
      if (Number(post.community_id) !== community.id || knownPostIds.current.has(post.id)) return;
      knownPostIds.current.add(post.id);
      setPosts(current => [post, ...current.filter(existing => existing.id !== post.id)]);
      setCommunity(current => current ? { ...current, post_count: current.post_count + 1 } : current);
      if (post.user_id !== user?.id) setLivePostNotice(post);
    };
    socket.on("new_post", h);
    return () => { leaveCommunity(community.id); socket.off("new_post", h); };
  }, [community?.id, socket, joinCommunity, leaveCommunity, user?.id]);

  useEffect(() => {
    if (!livePostNotice) return;
    const timer = window.setTimeout(() => setLivePostNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [livePostNotice]);

  const handleJoin = async () => {
    if (!community) return;
    setJoining(true);
    try {
      if (joined) {
        await communityService.leaveCommunity(community.id);
        setCommunity(c => c ? { ...c, member_count: c.member_count - 1 } : c);
        setJoined(false);
      } else {
        await communityService.joinCommunity(community.id);
        setCommunity(c => c ? { ...c, member_count: c.member_count + 1 } : c);
        setJoined(true);
      }
    } catch (e) { console.error(e); }
    finally { setJoining(false); }
  };

  if (loading) return (
    <CommunityPageSkeleton />
  );
  if (error || !community) return (
    <p className="text-center py-16 text-sm text-red-500">{error || "Community not found."}</p>
  );

  return (
    <div className="space-y-4">
      {livePostNotice && <RealtimePostNotice post={livePostNotice} onClose={() => setLivePostNotice(null)} />}
      {/* Community header */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        {community.banner
          ? <img src={community.banner} className="w-full h-28 object-cover" alt="" />
          : <div className="w-full h-28 bg-gradient-to-r from-[#1A4329] to-green-500" />}

        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-7 mb-3">
            {community.logo
              ? <img src={community.logo} className="w-14 h-14 rounded-full border-4 object-cover" style={{ borderColor: "var(--surface)" }} alt="" />
              : <div className="w-14 h-14 rounded-full border-4 flex items-center justify-center text-white text-2xl font-bold"
                  style={{ borderColor: "var(--surface)", backgroundColor: "var(--accent)" }}>
                  {community.name[0].toUpperCase()}
                </div>}

            {isAuthenticated && (
              <button onClick={handleJoin} disabled={joining}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all disabled:opacity-60 hover:opacity-90 ${joined ? "" : "text-white"}`}
                style={joined
                  ? { border: "1px solid var(--border)", color: "var(--text)" }
                  : { backgroundColor: "var(--accent)", color: "#fff" }}>
                {joining ? "..." : joined ? "Leave" : "Join"}
              </button>
            )}
          </div>

          <h1 className="text-base font-bold" style={{ color: "var(--text)" }}>w/{community.name}</h1>
          {community.description && <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{community.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: "var(--muted)" }}>
            <span className="flex items-center gap-1"><Users size={12} /> {community.member_count.toLocaleString()} members</span>
            <span className="flex items-center gap-1"><FileText size={12} /> {community.post_count.toLocaleString()} posts</span>
          </div>
        </div>
      </div>

      {isAuthenticated && (
        <CreatePostForm onPostCreated={p => {
          knownPostIds.current.add(p.id);
          setPosts(prev => [p, ...prev.filter(existing => existing.id !== p.id)]);
          setCommunity(current => current ? { ...current, post_count: current.post_count + 1 } : current);
        }} defaultCommunityId={community.id} />
      )}

      {posts.length === 0
        ? <p className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>No posts yet. Be the first!</p>
        : posts.map(post => (
            <PostCard key={post.id} post={post}
              onDelete={async id => { try { await api.delete(`/posts/${id}`); setPosts(p => p.filter(x => x.id !== id)); } catch (e) { console.error(e); } }} />
          ))}
    </div>
  );
};
export default CommunityPage;
