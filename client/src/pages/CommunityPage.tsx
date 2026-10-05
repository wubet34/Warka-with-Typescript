import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Users, FileText, BellPlus, BellOff, Share2 } from "lucide-react";
import type { Community, Post } from "../types/index";
import { communityService } from "../services/communityService";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import PostCard from "../components/ui/PostCard";
import CreatePostForm from "../components/ui/CreatePostForm";
import RealtimePostNotice from "../components/ui/RealtimePostNotice";
import api from "../api/client";
import { CommunityPageSkeleton } from "../components/ui/LoadingSkeleton";
import { followService } from "../services/followService";
import { useWarkaDialog } from "../context/WarkaDialogContext";

const CommunityPage = () => {
  const { communitySlug } = useParams<{ communitySlug: string }>();
  const { isAuthenticated, user } = useAuth();
  const warkaDialog = useWarkaDialog();
  const { socket, joinCommunity, leaveCommunity } = useSocket();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts]         = useState<Post[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [moderationError, setModerationError] = useState("");
  const [joined, setJoined]       = useState(false);
  const [joining, setJoining]     = useState(false);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState("");
  const [canModerate, setCanModerate] = useState(false);
  const [livePostNotice, setLivePostNotice] = useState<Post | null>(null);
  const knownPostIds = useRef(new Set<number>());

  useEffect(() => {
    if (!communitySlug) return;
    setLoading(true); setError("");
    setCommunity(null);
    setFollowing(false);
    setCanModerate(false);
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
          followService.state("communities", c.id).then(setFollowing).catch(() => {});
          communityService.canModerate(c.id).then(setCanModerate).catch(() => {});
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

  const handleFollow = async () => {
    if (!community) return;
    const next = !following;
    setFollowError("");
    setFollowing(next); setFollowBusy(true);
    try { await followService.set("communities", community.id, next); }
    catch (err) {
      setFollowing(!next);
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFollowError(message || "Could not update follow status. Check your connection and try again.");
    }
    finally { setFollowBusy(false); }
  };

  const handleModeration = async (post: Post, action: "lock" | "unlock" | "pin" | "unpin" | "remove") => {
    setModerationError("");
    try {
      await communityService.moderatePost(community!.id, post.id, action);
      if (action === "remove") {
        setPosts(current => current.filter(item => item.id !== post.id));
        setCommunity(current => current ? { ...current, post_count: Math.max(0, current.post_count - 1) } : current);
      } else {
        setPosts(current => current.map(item => item.id !== post.id ? item : {
          ...item, is_locked: action === "lock" ? true : action === "unlock" ? false : item.is_locked,
          is_pinned: action === "pin" ? true : action === "unpin" ? false : item.is_pinned,
        }));
      }
    } catch { setModerationError("Could not apply that moderation action."); }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/w/${community?.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: `w/${community?.name}`, url });
      else { await navigator.clipboard.writeText(url); await warkaDialog.alert("Community link copied.", "Link copied"); }
    } catch (error) { if ((error as DOMException).name !== "AbortError") console.error(error); }
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
      {followError && <p role="alert" className="rounded-xl p-3 text-sm text-red-500" style={{ backgroundColor: "var(--surface)" }}>{followError}</p>}
      {moderationError && <p role="alert" className="rounded-xl p-3 text-sm text-red-500" style={{ backgroundColor: "var(--surface)" }}>{moderationError}</p>}
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

            {isAuthenticated && <div className="flex gap-2">
              <button onClick={() => void handleFollow()} disabled={followBusy} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all disabled:opacity-60"
                style={following ? { border: "1px solid var(--border)", color: "var(--text)" } : { backgroundColor: "var(--surface2)", color: "var(--text)" }}>
                {following ? <BellOff size={14} /> : <BellPlus size={14} />}{following ? "Following" : "Follow"}
              </button>
              <button onClick={handleJoin} disabled={joining}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all disabled:opacity-60 hover:opacity-90 ${joined ? "" : "text-white"}`}
                style={joined ? { border: "1px solid var(--border)", color: "var(--text)" } : { backgroundColor: "var(--accent)", color: "#fff" }}>
                {joining ? "..." : joined ? "Leave" : "Join"}
              </button>
            </div>}
          </div>

          <h1 className="text-base font-bold" style={{ color: "var(--text)" }}>w/{community.name}</h1>
          {community.description && <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{community.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: "var(--muted)" }}>
            <span className="flex items-center gap-1"><Users size={12} /> {community.member_count.toLocaleString()} members</span>
            <span className="flex items-center gap-1"><FileText size={12} /> {community.post_count.toLocaleString()} posts</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {community.tags?.map(tag => <span key={tag} className="rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ color: "var(--accent)", backgroundColor: "var(--surface2)" }}>#{tag}</span>)}
            <button type="button" onClick={() => void handleShare()} className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs" style={{ color: "var(--muted)" }}><Share2 size={13} /> Share</button>
          </div>
        </div>
      </div>

      {(community.rules || community.wiki) && <section className="grid gap-3 sm:grid-cols-2">
        {community.rules && <article className="rounded-2xl p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}><h2 className="mb-2 text-sm font-bold" style={{ color: "var(--text)" }}>Community rules</h2><p className="whitespace-pre-wrap text-sm" style={{ color: "var(--muted)" }}>{community.rules}</p></article>}
        {community.wiki && <article className="rounded-2xl p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}><h2 className="mb-2 text-sm font-bold" style={{ color: "var(--text)" }}>Community wiki</h2><p className="whitespace-pre-wrap text-sm" style={{ color: "var(--muted)" }}>{community.wiki}</p></article>}
      </section>}

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
            <div key={post.id} className="space-y-1">
            {canModerate && <div className="flex justify-end gap-2">
              <button type="button" onClick={() => void handleModeration(post, post.is_pinned ? "unpin" : "pin")} className="rounded-lg px-2.5 py-1 text-xs" style={{ color: "var(--muted)", backgroundColor: "var(--surface)" }}>{post.is_pinned ? "Unpin" : "Pin"}</button>
              <button type="button" onClick={() => void handleModeration(post, post.is_locked ? "unlock" : "lock")} className="rounded-lg px-2.5 py-1 text-xs" style={{ color: "var(--muted)", backgroundColor: "var(--surface)" }}>{post.is_locked ? "Unlock" : "Lock"}</button>
              <button type="button" onClick={async () => { if (await warkaDialog.confirm("Remove this post from the community?", "Remove post", "Remove")) void handleModeration(post, "remove"); }} className="rounded-lg px-2.5 py-1 text-xs text-red-500" style={{ backgroundColor: "var(--surface)" }}>Remove</button>
            </div>}
            <PostCard post={post}
              onDelete={async id => { try { await api.delete(`/posts/${id}`); setPosts(p => p.filter(x => x.id !== id)); } catch (e) { console.error(e); } }} />
            </div>
          ))}
    </div>
  );
};
export default CommunityPage;
