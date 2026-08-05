import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { Post } from "../types/index";
import { postService } from "../services/postService";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import PostCard from "../components/ui/PostCard";
import CreatePostForm from "../components/ui/CreatePostForm";

const HomeFeed = () => {
  const { isAuthenticated } = useAuth();
  const { socket, joinFeed, leaveFeed } = useSocket();
  const [posts, setPosts]     = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    postService.getFeed().then(setPosts).catch(() => setError("Failed to load posts.")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    joinFeed();
    const onNew = (_p: Post) => setNewCount(n => n + 1);
    const onVote = ({ postId, voteScore }: { postId: number; voteScore: number }) =>
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, vote_score: voteScore } : p));
    socket.on("new_post", onNew);
    socket.on("vote_update", onVote);
    return () => { leaveFeed(); socket.off("new_post", onNew); socket.off("vote_update", onVote); };
  }, [socket, joinFeed, leaveFeed]);

  const handleLoadNew = () => {
    setLoading(true); setNewCount(0);
    postService.getFeed().then(setPosts).catch(() => setError("Failed to reload.")).finally(() => setLoading(false));
  };

  return (
    <div className="space-y-4">
      {isAuthenticated && <CreatePostForm onPostCreated={p => setPosts(prev => [p, ...prev])} />}

      {newCount > 0 && (
        <button onClick={handleLoadNew}
          className="w-full py-2.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--accent)" }}>
          ↑ {newCount} new post{newCount !== 1 ? "s" : ""} — click to refresh
        </button>
      )}

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
