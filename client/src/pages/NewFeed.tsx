import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { Post } from "../types/index";
import { postService } from "../services/postService";
import PostCard from "../components/ui/PostCard";

const NewFeed = () => {
  const [posts, setPosts]     = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    postService.getPosts().then(setPosts).catch(() => setError("Failed to load posts.")).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    try { await postService.deletePost(id); setPosts(p => p.filter(x => x.id !== id)); } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Sparkles size={18} style={{ color: "var(--accent)" }} />
        <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>New Posts</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} /></div>
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
