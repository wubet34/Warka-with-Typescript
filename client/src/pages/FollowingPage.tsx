import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { UserRound, Users } from "lucide-react";
import { followService, type FollowedCommunity, type FollowedUser } from "../services/followService";
import type { FollowedTag } from "../services/followService";

const FollowingPage = () => {
  const [users, setUsers] = useState<FollowedUser[]>([]);
  const [communities, setCommunities] = useState<FollowedCommunity[]>([]);
  const [tags, setTags] = useState<FollowedTag[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { followService.getFollowing().then(data => { setUsers(data.users); setCommunities(data.communities); setTags(data.tags); }).catch(() => setError("Could not load your following list.")); }, []);
  return <section className="mx-auto max-w-3xl space-y-5">
    <header><h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Following</h1><p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>People and communities you follow.</p></header>
    {error && <p role="alert" className="rounded-xl p-4 text-sm text-red-500" style={{ backgroundColor: "var(--surface)" }}>{error}</p>}
    <section className="rounded-2xl p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <h2 className="mb-3 flex items-center gap-2 font-semibold" style={{ color: "var(--text)" }}><UserRound size={17} /> People</h2>
      {users.length ? users.map(person => <NavLink key={person.id} to={`/user/${person.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--surface2)]" style={{ color: "var(--text)" }}><span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: "var(--accent)" }}>{person.username[0]?.toUpperCase()}</span>u/{person.username}</NavLink>) : <p className="text-sm" style={{ color: "var(--muted)" }}>You are not following anyone yet.</p>}
    </section>
    <section className="rounded-2xl p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <h2 className="mb-3 font-semibold" style={{ color: "var(--text)" }}>Topics and tags</h2>
      {tags.length ? <div className="flex flex-wrap gap-2">{tags.map(item => <div key={item.tag} className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm" style={{ backgroundColor: "var(--surface2)", color: "var(--text)" }}><NavLink to={`/search?q=${encodeURIComponent(`#${item.tag}`)}`}>#{item.tag}</NavLink><button type="button" aria-label={`Unfollow ${item.tag}`} onClick={() => { followService.setTag(item.tag, false).then(() => setTags(current => current.filter(tag => tag.tag !== item.tag))).catch(() => setError("Could not unfollow tag.")); }} className="text-xs" style={{ color: "var(--muted)" }}>×</button></div>)}</div> : <p className="text-sm" style={{ color: "var(--muted)" }}>You are not following any tags yet.</p>}
    </section>
    <section className="rounded-2xl p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <h2 className="mb-3 flex items-center gap-2 font-semibold" style={{ color: "var(--text)" }}><Users size={17} /> Communities</h2>
      {communities.length ? communities.map(community => <NavLink key={community.id} to={`/w/${community.slug}`} className="block rounded-lg px-2 py-2 hover:bg-[var(--surface2)]" style={{ color: "var(--text)" }}>w/{community.name}</NavLink>) : <p className="text-sm" style={{ color: "var(--muted)" }}>You are not following any communities yet.</p>}
    </section>
  </section>;
};
export default FollowingPage;
