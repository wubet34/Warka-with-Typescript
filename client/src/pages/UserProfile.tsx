import { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { FileText, BadgeCheck, CalendarDays, Pencil, Users, ArrowBigUp, Trophy, Plus, UserRoundPlus, UserRoundCheck } from "lucide-react";
import type { User, Post, Community } from "../types/index";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/ui/PostCard";
import EditProfileModal from "../components/ui/EditProfileModal";
import api from "../api/client";
import { formatDate } from "../utils/formatDate";
import { imgUrl } from "../utils/imageUrl";
import { ProfilePageSkeleton } from "../components/ui/LoadingSkeleton";
import { followService } from "../services/followService";

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
  follower_count?: number | string;
  following_count?: number | string;
};

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user: me, isAuthenticated } = useAuth();
  const [profile, setProfile]   = useState<ProfileUser | null>(null);
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true); setError("");
    Promise.all([
      api.get<{ success: boolean; user: ProfileUser }>(`/users/${id}`).then(r => r.data.user),
      api.get<{ success: boolean; posts: Post[] }>(`/users/${id}/posts`).then(r => r.data.posts),
    ]).then(([u, p]) => {
      setProfile(u); setPosts(p); setIsFollowing(false);
      if (isAuthenticated && me?.id !== u.id) followService.state("users", u.id).then(setIsFollowing).catch(() => setFollowError("Could not load follow status. Check your connection and retry."));
    })
      .catch(() => setError("User not found."))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated, me?.id]);

  if (loading) return (
    <ProfilePageSkeleton />
  );
  if (error || !profile) return (
    <p className="text-center py-16 text-sm text-red-500">{error || "User not found."}</p>
  );

  const isOwn    = me?.id === profile.id;
  const coverSrc = imgUrl(profile.cover_image);
  const avatarSrc = imgUrl(profile.profile_image);

  const toggleFollow = async () => {
    const next = !isFollowing;
    setFollowError("");
    setIsFollowing(next); setFollowBusy(true);
    setProfile(current => current ? { ...current, follower_count: Number(current.follower_count ?? 0) + (next ? 1 : -1) } : current);
    try { await followService.set("users", profile.id, next); }
    catch (err) {
      setIsFollowing(!next);
      setProfile(current => current ? { ...current, follower_count: Number(current.follower_count ?? 0) + (next ? -1 : 1) } : current);
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFollowError(message || "Could not update follow status. Check your connection and try again.");
    }
    finally { setFollowBusy(false); }
  };

  return (
    <>
      {followError && <p role="alert" className="mb-3 rounded-xl p-3 text-sm text-red-500" style={{ backgroundColor: "var(--surface)" }}>{followError}</p>}
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
                ? <img src={avatarSrc} className="h-18 w-18 rounded-full border-4 object-cover sm:h-20 sm:w-20" style={{ borderColor: "var(--surface)" }} alt={`${profile.username}'s avatar`} />
                : <div className="flex h-18 w-18 items-center justify-center rounded-full border-4 text-2xl font-bold sm:h-20 sm:w-20 sm:text-3xl"
                    style={{ borderColor: "var(--surface)", backgroundColor: "var(--accent)" }}>
                    {profile.username[0].toUpperCase()}
                  </div>}

              {isOwn && (
                <button onClick={() => setShowEdit(true)}
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-(--surface2)"
                  style={{ border: "1px solid var(--border)", color: "var(--text)" }}>
                  <Pencil size={13} /> Edit Profile
                </button>
              )}
              {!isOwn && isAuthenticated && <div className="flex gap-2">
                <NavLink to={`/messages?user=${profile.id}`} className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold" style={{ border: "1px solid var(--border)", color: "var(--text)" }}>Message</NavLink>
                <button type="button" disabled={followBusy} onClick={() => void toggleFollow()}
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-(--surface2) disabled:opacity-50"
                  style={isFollowing ? { border: "1px solid var(--border)", color: "var(--text)" } : { backgroundColor: "var(--accent)", color: "#fff" }}>
                  {isFollowing ? <><UserRoundCheck size={14} /> Following</> : <><UserRoundPlus size={14} /> Follow</>}
                </button>
              </div>}
            </div>

            <div className="mb-1 flex items-center gap-1.5">
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text)" }}>u/{profile.username}</h1>
              {profile.is_verified && <BadgeCheck size={17} style={{ color: "var(--accent)" }} />}
            </div>
            {profile.bio && <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>{profile.bio}</p>}
            {(profile.country || profile.city || profile.website || Object.values(profile.social_links ?? {}).some(Boolean)) && <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "var(--muted)" }}>
              {(profile.city || profile.country) && <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>}
              {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "var(--accent)" }}>Website</a>}
              {Object.entries(profile.social_links ?? {}).filter(([, url]) => Boolean(url)).map(([network, url]) => <a key={network} href={url} target="_blank" rel="noopener noreferrer" className="capitalize hover:underline" style={{ color: "var(--accent)" }}>{network}</a>)}
            </div>}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3 text-xs" style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
              <span className="flex items-center gap-1.5"><FileText size={14} /> <strong style={{ color: "var(--text)" }}>{profile.post_count ?? posts.length}</strong> posts</span>
              <span className="flex items-center gap-1.5"><ArrowBigUp size={14} /> <strong style={{ color: "var(--text)" }}>{Number(profile.votes_received ?? 0).toLocaleString()}</strong> votes received</span>
              <span className="flex items-center gap-1.5"><Trophy size={14} /> <strong style={{ color: "var(--text)" }}>{Number(profile.karma ?? 0).toLocaleString()}</strong> post score</span>
              <span><strong style={{ color: "var(--text)" }}>{Number(profile.follower_count ?? 0).toLocaleString()}</strong> followers</span>
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
                      className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-(--surface2)"
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
                      className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-(--surface2)"
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
