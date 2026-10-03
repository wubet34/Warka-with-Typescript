import { useEffect, useState } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { Post } from "../types/index";
import { postService } from "../services/postService";
import PostCard from "../components/ui/PostCard";
import { DetailPageSkeleton } from "../components/ui/LoadingSkeleton";

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost]       = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!id) return;
    postService.getPostById(Number(id)).then(setPost).catch(() => setError("Post not found.")).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <DetailPageSkeleton />
  );

  if (error || !post) return (
    <div className="text-center py-16">
      <p className="text-sm text-red-500 mb-4">{error || "Post not found."}</p>
      <button onClick={() => navigate(-1)} className="text-sm hover:underline" style={{ color: "var(--accent)" }}>Go back</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--accent)]"
        style={{ color: "var(--muted)" }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="text-xs" style={{ color: "var(--muted)" }}>
        <NavLink to={`/w/${post.community_slug}`} className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
          w/{post.community_name}
        </NavLink>
        <span className="mx-1">•</span>
        <span>posted by </span>
        <NavLink to={`/user/${post.user_id}`} className="hover:underline" style={{ color: "var(--muted)" }}>
          u/{post.username}
        </NavLink>
      </div>

      <PostCard post={post} onDelete={async pid => { try { await postService.deletePost(pid); navigate(-1); } catch (e) { console.error(e); } }} showComments={true} showFullContent />
    </div>
  );
};
export default PostDetail;
