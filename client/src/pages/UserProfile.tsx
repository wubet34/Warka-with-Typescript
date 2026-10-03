import { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { Loader2, FileText, BadgeCheck, CalendarDays, Pencil, Users, ArrowBigUp, Trophy, Plus } from "lucide-react";
import type { User, Post, Community } from "../types/index";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/ui/PostCard";
import EditProfileModal from "../components/ui/EditProfileModal";
import api from "../api/client";
import { formatDate } from "../utils/formatDate";
import { imgUrl } from "../utils/imageUrl";

type ProfileCommunity = Pick<Community, "id" | "name" | "slug">;
type ProfileUser = User & {
  post_count?: number;
  comment_count?: number;
  votes_received?: number | string;
  karma?: number | string;
  joined_community_count?: number | string;
  created_community_count?: number | string;
  joined_communities?: ProfileCommunity[];
  created_communities?: ProfileCommunity[];
};

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

      <div className="mx-auto max-w-4xl space-y-4">
        {/* Profile card */}
        <section className="overflow-hidden rounded-xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          {coverSrc
            ? <img src={coverSrc} alt="" className="h-32 w-full object-cover sm:h-40" />
            : <div className="h-32 sm:h-40" style={{ background: "linear-gradient(120deg, var(--surface2), var(--border))" }} />}

          <div className="px-4 pb-4 sm:px-6">
            <div className="-mt-9 mb-3 flex items-end justify-between sm:-mt-10">
              {/* Avatar */}
              {avatarSrc
                ? <img src={avatarSrc} className="h-[4.5rem] w-[4.5rem] rounded-full border-4 object-cover sm:h-20 sm:w-20" style={{ borderColor: "var(--surface)" }} alt={`${profile.username}'s avatar`} />
                : <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-4 text-2xl font-bold sm:h-20 sm:w-20 sm:text-3xl"
                    style={{ borderColor: "var(--surface)", backgroundColor: "var(--accent)" }}>
                    {profile.username[0].toUpperCase()}
                  </div>}

              {isOwn && (
                <button onClick={() => setShowEdit(true)}
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--surface2)]"
                  style={{ border: "1px solid var(--border)", color: "var(--text)" }}>
                  <Pencil size={13} /> Edit Profile
                </button>
              )}
            </div>

            <div className="mb-1 flex items-center gap-1.5">
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text)" }}>u/{profile.username}</h1>
              {profile.is_verified && <BadgeCheck size={17} style={{ color: "var(--accent)" }} />}
            </div>
            {profile.bio && <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>{profile.bio}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3 text-xs" style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
              <span className="flex items-center gap-1.5"><FileText size={14} /> <strong style={{ color: "var(--text)" }}>{profile.post_count ?? posts.length}</strong> posts</span>
              <span className="flex items-center gap-1.5"><ArrowBigUp size={14} /> <strong style={{ color: "var(--text)" }}>{Number(profile.votes_received ?? 0).toLocaleString()}</strong> votes received</span>
              <span className="flex items-center gap-1.5"><Trophy size={14} /> <strong style={{ color: "var(--text)" }}>{Number(profile.karma ?? 0).toLocaleString()}</strong> post score</span>
              {profile.created_at && (
                <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Joined {formatDate(profile.created_at)}</span>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mb-4 flex items-center gap-2">
            <Users size={17} style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Communities</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Joined ({Number(profile.joined_community_count ?? profile.joined_communities?.length ?? 0).toLocaleString()})
              </h3>
              {profile.joined_communities?.length ? (
                <div className="flex flex-wrap gap-2">
                  {profile.joined_communities.map(community => (
                    <NavLink key={community.id} to={`/w/${community.slug}`}
                      className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface2)]"
                      style={{ borderColor: "var(--border)", color: "var(--text)" }}>w/{community.name}</NavLink>
                  ))}
                </div>
              ) : <p className="text-sm" style={{ color: "var(--muted)" }}>No communities joined yet.</p>}
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Created ({Number(profile.created_community_count ?? profile.created_communities?.length ?? 0).toLocaleString()})
              </h3>
              {profile.created_communities?.length ? (
                <div className="flex flex-wrap gap-2">
                  {profile.created_communities.map(community => (
                    <NavLink key={community.id} to={`/w/${community.slug}`}
                      className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface2)]"
                      style={{ borderColor: "var(--border)", color: "var(--text)" }}><Plus size={12} />w/{community.name}</NavLink>
                  ))}
                </div>
              ) : <p className="text-sm" style={{ color: "var(--muted)" }}>No communities created yet.</p>}
            </div>
          </div>
        </section>

        <h2 className="border-b px-1 pb-3 text-sm font-bold" style={{ color: "var(--text)", borderColor: "var(--border)" }}>
          {isOwn ? "Your Posts" : `Posts by ${profile.username}`}
        </h2>

        {posts.length === 0
          ? <p className="rounded-xl border py-10 text-center text-sm" style={{ color: "var(--muted)", backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>No posts yet.</p>
          : posts.map(post => (
              <PostCard key={post.id} post={post}
                onDelete={isOwn ? async pid => { await api.delete(`/posts/${pid}`); setPosts(p => p.filter(x => x.id !== pid)); } : undefined} />
            ))}
      </div>
    </>
  );
};
export default UserProfile;
