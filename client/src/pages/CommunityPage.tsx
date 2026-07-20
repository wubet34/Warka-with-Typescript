import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Users, FileText } from "lucide-react";
import type { Community, Post } from "../types/index";
import { communityService } from "../services/communityService";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/ui/PostCard";

const CommunityPage = () => {
  const { communitySlug } = useParams<{ communitySlug: string }>();
  const { isAuthenticated } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!communitySlug) return;
    setLoading(true);

    communityService.getCommunityBySlug(communitySlug)
      .then(async (c) => {
        setCommunity(c);
        const p = await communityService.getCommunityPosts(c.id);
        setPosts(p);
      })
      .catch(() => setError("Community not found."))
      .finally(() => setLoading(false));
  }, [communitySlug]);

  const handleJoin = async () => {
    if (!community) return;
    setJoining(true);
    try {
      if (joined) {
        await communityService.leaveCommunity(community.id);
        setCommunity((c) => c ? { ...c, member_count: c.member_count - 1 } : c);
        setJoined(false);
      } else {
        await communityService.joinCommunity(community.id);
        setCommunity((c) => c ? { ...c, member_count: c.member_count + 1 } : c);
        setJoined(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    try {
      await import("../services/postService").then(({ postService }) => postService.deletePost(id));
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

  if (error || !community) return (
    <div className="text-center py-12 text-sm text-red-500">{error || "Community not found."}</div>
  );

  return (
    <div className="space-y-4">
      {/* Community Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {community.banner ? (
          <img src={community.banner} className="w-full h-32 object-cover" alt="" />
        ) : (
          <div className="w-full h-32 bg-gradient-to-r from-[#1A4329] to-green-400" />
        )}

        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-6 mb-3">
            {community.logo ? (
              <img src={community.logo} className="w-16 h-16 rounded-full border-4 border-white object-cover" alt="" />
            ) : (
              <div className="w-16 h-16 rounded-full border-4 border-white bg-[#1A4329] flex items-center justify-center text-white text-2xl font-bold">
                {community.name[0].toUpperCase()}
              </div>
            )}

            {isAuthenticated && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  joined
                    ? "border border-[#1A4329] text-[#1A4329] hover:bg-red-50 hover:border-red-400 hover:text-red-500"
                    : "bg-[#1A4329] text-white hover:bg-opacity-90"
                }`}
              >
                {joining ? "..." : joined ? "Leave" : "Join"}
              </button>
            )}
          </div>

          <h1 className="text-lg font-bold text-gray-900">w/{community.name}</h1>
          {community.description && (
            <p className="text-sm text-gray-500 mt-1">{community.description}</p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users size={13} /> {community.member_count.toLocaleString()} members
            </span>
            <span className="flex items-center gap-1">
              <FileText size={13} /> {community.post_count.toLocaleString()} posts
            </span>
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <p className="text-center py-12 text-sm text-gray-500">No posts in this community yet.</p>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
        ))
      )}
    </div>
  );
};

export default CommunityPage;
