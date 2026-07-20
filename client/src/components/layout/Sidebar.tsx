import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { communityService } from "../../services/communityService";
import type { Community } from "../../types/index";

const Sidebar = () => {
  const { user, isAuthenticated } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    communityService.getCommunities()
      .then((data) => setCommunities(data.slice(0, 5)))
      .catch(console.error);
  }, []);

  return (
    <div className="px-2 py-4 space-y-4">
      {/* Profile Card */}
      <aside className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col items-center">
          <div className="w-full h-24 bg-gradient-to-r from-[#1A4329] to-green-400" />

          {user?.profile_image ? (
            <img
              src={user.profile_image}
              className="w-20 h-20 rounded-full -mt-10 border-4 border-white shadow object-cover"
              alt={user.username}
            />
          ) : (
            <div className="w-20 h-20 rounded-full -mt-10 border-4 border-white shadow bg-gray-200 flex items-center justify-center text-2xl font-bold text-[#1A4329]">
              {user?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}

          {isAuthenticated && user ? (
            <div className="text-center mt-3 pb-2 px-4">
              <h3 className="text-base font-bold text-gray-900">{user.username}</h3>
              <p className="text-xs text-gray-500">{user.email}</p>
              {user.bio && <p className="text-xs text-gray-500 mt-1">{user.bio}</p>}
            </div>
          ) : (
            <div className="text-center mt-3 pb-2 px-4">
              <h3 className="text-sm font-semibold text-gray-700">Welcome to Warka</h3>
              <p className="text-xs text-gray-500">Sign in to see your profile</p>
            </div>
          )}

          {isAuthenticated && user && (
            <div className="px-4 pb-4 w-full">
              <NavLink
                to={`/user/${user.id}`}
                className="flex items-center justify-center w-full px-4 py-2 bg-[#1A4329] text-white rounded-full text-sm font-semibold hover:bg-opacity-90 transition-all"
              >
                My Profile
              </NavLink>
            </div>
          )}
        </div>
      </aside>

      {/* Communities */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Users size={16} className="text-[#1A4329]" />
            Communities
          </p>
          <NavLink to="/communities" className="text-xs text-[#1A4329] hover:underline">
            See all
          </NavLink>
        </div>

        {communities.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">Loading...</p>
        ) : (
          <div className="space-y-2">
            {communities.map((c) => (
              <NavLink
                key={c.id}
                to={`/w/${c.slug}`}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                {c.logo ? (
                  <img src={c.logo} className="w-8 h-8 rounded-full object-cover" alt={c.name} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-[#1A4329]">
                    {c.name[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 font-medium truncate">w/{c.name}</p>
                  <p className="text-xs text-gray-400">{c.member_count.toLocaleString()} members</p>
                </div>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
