import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, FileText, MessageCircle, BadgeCheck } from "lucide-react";
import type { User, Post } from "../types/index";
import { postService } from "../services/postService";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/ui/PostCard";
import api from "../api/client";
import { formatDate } from "../utils/formatDate";

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<User & { post_count?: number; comment_count?: number } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/users/${id}`).then((r) => r.data.user),
      postService.getPosts().then((all) => all.filter((p) => p.user_id === Number(id))),
    ])
      .then(([u, p]) => {
        setProfile(u);
        setPosts(p);
      })
      .catch(() => setError("User not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDeletePost = async (postId: number) => {
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 size={28} className="animate-spin text-[#1A4329]" />
    </div>
  );

  if (error || !profile) return (
    <div className="text-center py-12 text-sm text-red-500">{error || "User not found."}</div>
  );

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#1A4329] to-green-400" />
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">
            {profile.profile_image ? (
              <img src={profile.profile_image} className="w-20 h-20 rounded-full border-4 border-white object-cover" alt="" />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white bg-[#1A4329] flex items-center justify-center text-white text-3xl font-bold">
                {profile.username[0].toUpperCase()}
              </div>
            )}
            {isOwnProfile && (
              <button className="px-4 py-1.5 border border-gray-300 text-sm text-gray-700 rounded-full hover:bg-gray-50 transition-all">
                Edit Profile
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">{profile.username}</h1>
            {profile.is_verified && (
              <BadgeCheck size={18} className="text-[#1A4329]" />
            )}
          </div>

          {profile.bio && (
            <p className="text-sm text-gray-500 mt-1">{profile.bio}</p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FileText size={13} /> {profile.post_count ?? posts.length} posts
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={13} /> {profile.comment_count ?? 0} comments
            </span>
            {profile.created_at && (
              <span>Joined {formatDate(profile.created_at)}</span>
            )}
          </div>
        </div>
      </div>

      {/* User Posts */}
      <h2 className="text-sm font-semibold text-gray-700 px-1">Posts by {profile.username}</h2>
      {posts.length === 0 ? (
        <p className="text-center py-8 text-sm text-gray-400">No posts yet.</p>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onDelete={isOwnProfile ? handleDeletePost : undefined} />
        ))
      )}
    </div>
  );
};

export default UserProfile;
