import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Post } from "../types/index";
import { postService } from "../services/postService";
import PostCard from "../components/ui/PostCard";

const NewFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    postService.getPosts()
      .then(setPosts)
      .catch(() => setError("Failed to load posts."))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await postService.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 size={28} className="animate-spin text-[#1A4329]" />
    </div>
  );

  if (error) return (
    <div className="text-center py-12 text-sm text-red-500">{error}</div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800 px-1">New Posts</h2>
      {posts.length === 0 ? (
        <p className="text-center py-12 text-sm text-gray-500">No posts yet.</p>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onDelete={handleDelete} />
        ))
      )}
    </div>
  );
};

export default NewFeed;
