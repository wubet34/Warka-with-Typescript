import { useEffect, useState } from "react";
import { Flame, TrendingUp } from "lucide-react";
import type { Post } from "../types/index";
import { postService } from "../services/postService";
import PostCard from "../components/ui/PostCard";
import { PostListSkeleton } from "../components/ui/LoadingSkeleton";

const PopularFeed = () => {
  const [posts, setPosts]     = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    postService.getPopular().then(setPosts).catch(() => setError("Failed to load.")).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    try { await postService.deletePost(id); setPosts(p => p.filter(x => x.id !== id)); } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(249,115,22,0.15)" }}>
          <Flame size={18} className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-base font-bold" style={{ color: "var(--text)" }}>Popular</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Top posts by votes and comments</p>
        </div>
      </div>

      {loading ? (
        <PostListSkeleton />
      ) : error ? (
        <p className="text-center py-12 text-sm text-red-500">{error}</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>
          <TrendingUp size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No popular posts yet.</p>
        </div>
      ) : (
        posts.map((post, i) => (
          <div key={post.id} className="relative">
            {i < 3 && (
              <div className={`absolute -top-1.5 -left-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow ${i===0?"bg-yellow-400":i===1?"bg-gray-400":"bg-orange-400"}`}>
                {i + 1}
              </div>
            )}
            <PostCard post={post} onDelete={handleDelete} />
          </div>
        ))
      )}
    </div>
  );
};
export default PopularFeed;
