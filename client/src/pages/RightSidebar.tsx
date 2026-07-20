import { useState, useEffect } from "react";
import { Users, TrendingUp, Search, Loader2 } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import type { Community } from "../types/index";
import { communityService } from "../services/communityService";
import { useAuth } from "../context/AuthContext";

const RightSidebar = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    communityService.getCommunities()
      .then((data) => setCommunities(data.slice(0, 5)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleJoin = async (communityId: number) => {
    if (!isAuthenticated) return;
    setJoining(communityId);
    try {
      await communityService.joinCommunity(communityId);
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId ? { ...c, member_count: c.member_count + 1 } : c
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(null);
    }
  };

  return (
    <div className="sticky top-4 space-y-4">
      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <form onSubmit={handleSearch} className="flex items-center bg-gray-100 rounded-full px-4 py-2.5 gap-2">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search Warka..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm w-full"
          />
        </form>
      </div>

      {/* Suggested Communities */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-[#1A4329]" />
              Communities
            </h3>
            <NavLink to="/communities" className="text-xs text-[#1A4329] hover:underline font-medium">
              View all
            </NavLink>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-[#1A4329]" />
          </div>
        ) : communities.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No communities yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {communities.map((community) => (
              <div key={community.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {community.logo ? (
                    <img src={community.logo} className="w-10 h-10 rounded-full object-cover shrink-0" alt={community.name} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-[#1A4329] font-bold text-base shrink-0">
                      {community.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <NavLink
                      to={`/w/${community.slug}`}
                      className="text-sm font-medium text-gray-900 truncate hover:underline block"
                    >
                      w/{community.name}
                    </NavLink>
                    {community.description && (
                      <p className="text-xs text-gray-500 truncate">{community.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {community.member_count.toLocaleString()} members
                    </p>
                  </div>
                  {isAuthenticated && (
                    <button
                      onClick={() => handleJoin(community.id)}
                      disabled={joining === community.id}
                      className="px-3 py-1.5 bg-[#1A4329] text-white rounded-full text-xs font-semibold hover:bg-opacity-90 transition-all shrink-0 disabled:opacity-50"
                    >
                      {joining === community.id ? "..." : "Join"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trending placeholder */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#1A4329]" />
            Trending
          </h3>
        </div>
        <div className="px-4 py-3 text-xs text-gray-400 text-center">
          Trending topics coming soon.
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
