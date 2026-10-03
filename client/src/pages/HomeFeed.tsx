import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { Post } from "../types/index";
import { postService } from "../services/postService";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import PostCard from "../components/ui/PostCard";
import CreatePostForm from "../components/ui/CreatePostForm";
import RealtimePostNotice from "../components/ui/RealtimePostNotice";
import warkaLogo from "../assets/warka-logo-web.png";

const HomeFeed = () => {
  const { isAuthenticated, user } = useAuth();
  const { socket, joinFeed, leaveFeed } = useSocket();
  const [posts, setPosts]     = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [livePostNotice, setLivePostNotice] = useState<Post | null>(null);

  useEffect(() => {
    postService.getFeed().then(loaded => setPosts(current => {
      const byId = new Map([...loaded, ...current].map(post => [post.id, post]));
      return [...byId.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    })).catch(() => setError("Failed to load posts.")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    joinFeed();
    const onNew = (post: Post) => {
      setPosts(current => {
        if (current.some(existing => existing.id === post.id)) return current;
        return [post, ...current];
      });
      if (post.user_id !== user?.id) setLivePostNotice(post);
    };
    const onVote = ({ postId, voteScore }: { postId: number; voteScore: number }) =>
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, vote_score: voteScore } : p));
    socket.on("new_post", onNew);
    socket.on("vote_update", onVote);
    return () => { leaveFeed(); socket.off("new_post", onNew); socket.off("vote_update", onVote); };
  }, [socket, joinFeed, leaveFeed, user?.id]);

  useEffect(() => {
    if (!livePostNotice) return;
    const timer = window.setTimeout(() => setLivePostNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [livePostNotice]);

  return (
    <div className="space-y-4">
      {livePostNotice && <RealtimePostNotice post={livePostNotice} onClose={() => setLivePostNotice(null)} />}
      {!isAuthenticated && (
        <section className="flex items-center gap-4 rounded-2xl border p-4 sm:gap-6 sm:p-5"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <img src={warkaLogo} alt="Warka — Where Ethiopia Connects"
            className="h-20 w-20 shrink-0 rounded-xl bg-white object-contain p-1 sm:h-24 sm:w-24" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--accent)" }}>Where Ethiopia Connects</p>
            <h1 className="mt-1 text-lg font-bold sm:text-xl" style={{ color: "var(--text)" }}>Welcome to Warka</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Explore conversations and communities from across Ethiopia.</p>
          </div>
        </section>
      )}
      {isAuthenticated && <CreatePostForm onPostCreated={p => setPosts(prev => prev.some(existing => existing.id === p.id) ? prev : [p, ...prev])} />}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} /></div>
      ) : error ? (
        <p className="text-center py-12 text-sm text-red-500">{error}</p>
      ) : posts.length === 0 ? (
        <p className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>No posts yet. Be the first!</p>
      ) : (
        posts.map(post => <PostCard key={post.id} post={post} onDelete={async id => { try { await postService.deletePost(id); setPosts(p => p.filter(x => x.id !== id)); } catch (e) { console.error(e); } }} />)
      )}
    </div>
  );
};
export default HomeFeed;
