import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, FileText, MessageCircle, BadgeCheck, CalendarDays, Pencil } from "lucide-react";
import type { User, Post } from "../types/index";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/ui/PostCard";
import EditProfileModal from "../components/ui/EditProfileModal";
import api from "../api/client";
import { formatDate } from "../utils/formatDate";
import { imgUrl } from "../utils/imageUrl";

type ProfileUser = User & { post_count?: number; comment_count?: number };

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const [profile, setProfile]   = useState<ProfileUser | null>(null);
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true); setError("");
    Promise.all([
      api.get<{ success: boolean; user: ProfileUser }>(`/users/${id}`).then(r => r.data.user),
      api.get<{ success: boolean; posts: Post[] }>(`/users/${id}/posts`).then(r => r.data.posts),
    ]).then(([u, p]) => { setProfile(u); setPosts(p); })
      .catch(() => setError("User not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} /></div>
  );
  if (error || !profile) return (
    <p className="text-center py-16 text-sm text-red-500">{error || "User not found."}</p>
  );

  const isOwn    = me?.id === profile.id;
  const coverSrc = imgUrl(profile.cover_image);
  const avatarSrc = imgUrl(profile.profile_image);

  return (
    <>
      {showEdit && (
        <EditProfileModal user={profile} onClose={() => setShowEdit(false)}
          onSaved={u => setProfile(p => p ? { ...p, ...u } : null)} />
      )}

      <div className="space-y-4">
        {/* Profile card */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          {coverSrc
            ? <img src={coverSrc} alt="cover" className="w-full h-28 object-cover" />
            : <div className="h-28 bg-gradient-to-r from-[#1A4329] to-green-500" />}

          <div className="px-4 pb-4">
            <div className="flex items-end justify-between -mt-10 mb-3">
              {/* Avatar */}
              {avatarSrc
                ? <img src={avatarSrc} className="w-20 h-20 rounded-full border-4 object-cover shadow" style={{ borderColor: "var(--surface)" }} alt="" />
                : <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-white text-3xl font-bold shadow"
                    style={{ borderColor: "var(--surface)", backgroundColor: "var(--accent)" }}>
                    {profile.username[0].toUpperCase()}
                  </div>}

              {isOwn && (
                <button onClick={() => setShowEdit(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-[var(--surface2)] transition-all"
                  style={{ border: "1px solid var(--border)", color: "var(--text)" }}>
                  <Pencil size={13} /> Edit Profile
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>{profile.username}</h1>
              {profile.is_verified && <BadgeCheck size={17} style={{ color: "var(--accent)" }} />}
            </div>
            {profile.bio && <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>{profile.bio}</p>}

            <div className="flex items-center flex-wrap gap-4 text-xs" style={{ color: "var(--muted)" }}>
              <span className="flex items-center gap-1"><FileText size={13} /> {profile.post_count ?? posts.length} posts</span>
              <span className="flex items-center gap-1"><MessageCircle size={13} /> {profile.comment_count ?? 0} comments</span>
              {profile.created_at && (
                <span className="flex items-center gap-1"><CalendarDays size={13} /> Joined {formatDate(profile.created_at)}</span>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-sm font-semibold px-1" style={{ color: "var(--muted)" }}>
          {isOwn ? "Your Posts" : `Posts by ${profile.username}`}
        </h2>

        {posts.length === 0
          ? <p className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>No posts yet.</p>
          : posts.map(post => (
              <PostCard key={post.id} post={post}
                onDelete={isOwn ? async pid => { try { await api.delete(`/posts/${pid}`); setPosts(p => p.filter(x => x.id !== pid)); } catch (e) { console.error(e); } } : undefined} />
            ))}
      </div>
    </>
  );
};
export default UserProfile;
