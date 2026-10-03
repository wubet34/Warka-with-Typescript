import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { Post } from "../types/index";
import { postService } from "../services/postService";
import PostCard from "../components/ui/PostCard";
import RealtimePostNotice from "../components/ui/RealtimePostNotice";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { PostListSkeleton } from "../components/ui/LoadingSkeleton";

const NewFeed = () => {
  const { user } = useAuth();
  const { socket, joinFeed, leaveFeed } = useSocket();
  const [posts, setPosts]     = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [livePostNotice, setLivePostNotice] = useState<Post | null>(null);

  useEffect(() => {
    postService.getPosts().then(loaded => setPosts(current => {
      const byId = new Map([...loaded, ...current].map(post => [post.id, post]));
      return [...byId.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    })).catch(() => setError("Failed to load posts.")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    joinFeed();
    const onNewPost = (post: Post) => {
      setPosts(current => current.some(existing => existing.id === post.id) ? current : [post, ...current]);
      if (post.user_id !== user?.id) setLivePostNotice(post);
    };
    socket.on("new_post", onNewPost);
    return () => { leaveFeed(); socket.off("new_post", onNewPost); };
  }, [socket, joinFeed, leaveFeed, user?.id]);

  useEffect(() => {
    if (!livePostNotice) return;
    const timer = window.setTimeout(() => setLivePostNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [livePostNotice]);

  const handleDelete = async (id: number) => {
    try { await postService.deletePost(id); setPosts(p => p.filter(x => x.id !== id)); } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-4">
      {livePostNotice && <RealtimePostNotice post={livePostNotice} onClose={() => setLivePostNotice(null)} />}
      <div className="flex items-center gap-2 px-1">
        <Sparkles size={18} style={{ color: "var(--accent)" }} />
        <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>New Posts</h2>
      </div>

      {loading ? (
        <PostListSkeleton />
      ) : error ? (
        <p className="text-center py-12 text-sm text-red-500">{error}</p>
      ) : posts.length === 0 ? (
        <p className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>No posts yet.</p>
      ) : (
        posts.map(post => <PostCard key={post.id} post={post} onDelete={handleDelete} />)
      )}
    </div>
  );
};
export default NewFeed;
