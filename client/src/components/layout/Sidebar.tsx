import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Users, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { communityService } from "../../services/communityService";
import type { Community } from "../../types/index";
import Avatar from "../commen/Avatar";
import CreateCommunityModal from "../ui/CreateCommunityModal";
import { imgUrl } from "../../utils/imageUrl";

const Sidebar = () => {
  const { user, isAuthenticated } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = () => communityService.getCommunities().then(d => setCommunities(d.slice(0,6))).catch(console.error);
  useEffect(() => { refresh(); }, []);

  return (
    <>
      {showCreate && <CreateCommunityModal onClose={() => { setShowCreate(false); refresh(); }} />}
      <div className="space-y-3 py-2">
        {/* Profile card */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor:"var(--surface)", border:"1px solid var(--border)" }}>
          {user?.cover_image
            ? <img src={imgUrl(user.cover_image)} className="h-20 w-full object-cover" alt="" />
            : <div className="h-20 bg-gradient-to-r from-[#1A4329] to-green-500" />}
          <div className="flex flex-col items-center -mt-8 pb-4 px-4">
            <Avatar username={user?.username} src={imgUrl(user?.profile_image)} size="lg"
              className="border-4 shadow" style={{ borderColor:"var(--surface)" } as React.CSSProperties} />
            {isAuthenticated && user ? (
              <div className="text-center mt-2">
                <h3 className="text-sm font-bold" style={{ color:"var(--text)" }}>{user.username}</h3>
                <p className="text-xs" style={{ color:"var(--muted)" }}>{user.email}</p>
                {user.bio && <p className="text-xs mt-1 line-clamp-2" style={{ color:"var(--muted)" }}>{user.bio}</p>}
              </div>
            ) : (
              <div className="text-center mt-2">
                <h3 className="text-sm font-semibold" style={{ color:"var(--text)" }}>Welcome to Warka</h3>
                <p className="text-xs" style={{ color:"var(--muted)" }}>Sign in to see your profile</p>
              </div>
            )}
            {isAuthenticated && user && (
              <NavLink to={`/user/${user.id}`} className="mt-3 w-full flex items-center justify-center py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all"
                style={{ backgroundColor:"var(--accent)" }}>
                My Profile
              </NavLink>
            )}
          </div>
        </div>

        {/* Communities */}
        <div className="rounded-2xl p-4" style={{ backgroundColor:"var(--surface)", border:"1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold flex items-center gap-2" style={{ color:"var(--text)" }}>
              <Users size={15} style={{ color:"var(--accent)" }} /> Communities
            </p>
          </div>
          {communities.length === 0
            ? <p className="text-xs text-center py-3" style={{ color:"var(--muted)" }}>Loading...</p>
            : <div className="space-y-1">
                {communities.map(c => (
                  <NavLink key={c.id} to={`/w/${c.slug}`}
                    className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-[var(--surface2)]">
                    {c.logo
                      ? <img src={c.logo} className="w-8 h-8 rounded-full object-cover shrink-0" alt={c.name} />
                      : <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ backgroundColor:"var(--surface2)", color:"var(--accent)" }}>
                          {c.name[0].toUpperCase()}
                        </div>}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color:"var(--text)" }}>w/{c.name}</p>
                      <p className="text-xs" style={{ color:"var(--muted)" }}>{c.member_count.toLocaleString()} members</p>
                    </div>
                  </NavLink>
                ))}
              </div>}
          {isAuthenticated && (
            <button onClick={() => setShowCreate(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs transition-colors hover:opacity-80"
              style={{ border:"1px dashed var(--border)", color:"var(--muted)" }}>
              <Plus size={14} /> Create Community
            </button>
          )}
        </div>
      </div>
    </>
  );
};
export default Sidebar;
