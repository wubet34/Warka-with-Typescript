import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Post, Community } from "../types/index";
import { communityService } from "../services/communityService";
import CreatePostForm from "../components/ui/CreatePostForm";

const CreatePostPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/home", { replace: true });
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    communityService.getCommunities().then(setCommunities).catch(console.error);
  }, []);

  const handlePostCreated = (post: Post) => navigate(`/post/${post.id}`);

  if (loading || !isAuthenticated) return null;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-lg font-bold px-1" style={{ color: "var(--text)" }}>Create a Post</h1>

      <CreatePostForm onPostCreated={handlePostCreated} />

      {communities.length > 0 && (
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>
            Post to a community
          </p>
          <div className="space-y-1">
            {communities.slice(0, 8).map(c => (
              <button key={c.id} onClick={() => navigate(`/w/${c.slug}`)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--surface2)] transition-colors text-left">
                {c.logo
                  ? <img src={c.logo} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                  : <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
                      style={{ backgroundColor: "var(--accent)" }}>
                      {c.name[0].toUpperCase()}
                    </div>}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>w/{c.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{c.member_count.toLocaleString()} members</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostPage;
