import { useState, useEffect, useRef } from "react";
import {
  Flame, Home, LogIn, Search, Sparkles, UserPlus,
  Menu, X, User, Settings, LogOut, ChevronDown,
  PlusCircle, Bell,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Login from "../Login";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    navigate("/home");
  };

  const linkStyles = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-1.5 py-1.5 px-3 rounded-full transition-all text-sm font-medium ${
      isActive
        ? "bg-green-50 text-[#1A4329]"
        : "text-gray-600 hover:bg-gray-50 hover:text-[#1A4329]"
    }`;

  const mobileBottomLinkStyles = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 py-1 px-3 transition-all ${
      isActive ? "text-[#1A4329]" : "text-gray-500 hover:text-[#1A4329]"
    }`;

  return (
    <>
      {/* Login/Register modal */}
      {showLogin && <Login onClose={() => setShowLogin(false)} />}

      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3.5 lg:px-6">

          {/* ── LEFT: Logo (hidden on mobile when logged in) + Menu icon ── */}
          <div className="shrink-0 flex items-center">
            {/* Mobile: show hamburger when logged in, logo when logged out */}
            {isAuthenticated ? (
              <button
                onClick={() => setIsMenuOpen(true)}
                className="lg:hidden p-2 -ml-1 text-gray-600 hover:text-[#1A4329] rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
            ) : (
              <h1 className="lg:hidden text-xl font-bold text-[#1A4329]">Warka</h1>
            )}
            {/* Desktop: always show logo */}
            <h1 className="hidden lg:block text-2xl font-bold text-[#1A4329]">Warka</h1>
          </div>

          {/* ── MIDDLE: Mobile search bar ── */}
          <form
            onSubmit={handleSearch}
            className="lg:hidden flex-1 mx-3 max-w-sm"
          >
            <div className="flex items-center bg-gray-100 rounded-full gap-1.5 px-3 py-2 w-full">
              <Search size={16} className="text-gray-500 shrink-0" />
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
              />
            </div>
          </form>

          {/* ── DESKTOP NAV ── */}
          <nav className="hidden lg:flex items-center flex-1 justify-between ml-8">
            {/* Nav links + search */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <NavLink to="/home" className={linkStyles}>
                  <Home size={18} /><span>Home</span>
                </NavLink>
                <NavLink to="/new" className={linkStyles}>
                  <Sparkles size={18} /><span>New</span>
                </NavLink>
                <NavLink to="/popular" className={linkStyles}>
                  <Flame size={18} /><span>Popular</span>
                </NavLink>
              </div>

              <form
                onSubmit={handleSearch}
                className="flex items-center bg-gray-100 rounded-full gap-2 px-4 py-2 w-52 xl:w-64"
              >
                <button type="submit" className="text-gray-500 shrink-0">
                  <Search size={17} />
                </button>
                <input
                  type="search"
                  placeholder="Search topics, communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm w-full"
                />
              </form>
            </div>

            {/* Desktop right: auth buttons OR user profile */}
            <div className="flex items-center gap-2 shrink-0">
              {isAuthenticated ? (
                <>
                  {/* Bell */}
                  <button className="relative p-2 text-gray-600 hover:text-[#1A4329] hover:bg-gray-50 rounded-full transition-all">
                    <Bell size={20} />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      5
                    </span>
                  </button>

                  {/* Profile dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                    >
                      {user?.profile_image ? (
                        <img
                          src={user.profile_image}
                          className="w-8 h-8 rounded-full object-cover"
                          alt={user.username}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-[#1A4329] rounded-full flex items-center justify-center">
                          <User size={17} className="text-white" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                        {user?.username}
                      </span>
                      <ChevronDown
                        size={15}
                        className={`text-gray-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user?.username}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>

                        <div className="py-1">
                          <NavLink
                            to={`/user/${user?.id}`}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <User size={15} className="text-gray-400" />
                            <span>Profile</span>
                          </NavLink>
                          <button
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings size={15} className="text-gray-400" />
                            <span>Settings</span>
                          </button>
                        </div>

                        <div className="border-t border-gray-100 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={15} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-[#1A4329] text-[#1A4329] rounded-full text-sm font-semibold hover:bg-green-50 transition-all"
                  >
                    <LogIn size={15} /><span>Sign In</span>
                  </button>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1A4329] text-white rounded-full text-sm font-semibold hover:bg-opacity-90 shadow-sm transition-all"
                  >
                    <UserPlus size={15} /><span>Register</span>
                  </button>
                </>
              )}
            </div>
          </nav>

          {/* ── MOBILE RIGHT: Bell (when logged in) ── */}
          {isAuthenticated && (
            <div className="lg:hidden shrink-0">
              <button className="relative p-2 text-gray-600 hover:text-[#1A4329] rounded-full transition-all">
                <Bell size={22} />
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE SLIDE-IN MENU OVERLAY ── */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* ── MOBILE SLIDE-IN MENU PANEL ── */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A4329]">Menu</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 text-gray-500 hover:text-[#1A4329] hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* User card (when logged in) */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              {user.profile_image ? (
                <img src={user.profile_image} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
              ) : (
                <div className="w-10 h-10 bg-[#1A4329] rounded-full flex items-center justify-center shrink-0">
                  <User size={20} className="text-white" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Nav links */}
          <div className="flex flex-col gap-1">
            <NavLink
              to="/home"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "bg-green-50 text-[#1A4329]" : "text-gray-700 hover:bg-gray-50 hover:text-[#1A4329]"
                }`
              }
            >
              <Home size={20} /><span>Home</span>
            </NavLink>
            <NavLink
              to="/new"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "bg-green-50 text-[#1A4329]" : "text-gray-700 hover:bg-gray-50 hover:text-[#1A4329]"
                }`
              }
            >
              <Sparkles size={20} /><span>New</span>
            </NavLink>
            <NavLink
              to="/popular"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "bg-green-50 text-[#1A4329]" : "text-gray-700 hover:bg-gray-50 hover:text-[#1A4329]"
                }`
              }
            >
              <Flame size={20} /><span>Popular</span>
            </NavLink>
          </div>

          <hr className="border-gray-100" />

          {/* Auth section */}
          {isAuthenticated ? (
            <div className="flex flex-col gap-1">
              <NavLink
                to={`/user/${user?.id}`}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <User size={18} className="text-gray-400" /><span>My Profile</span>
              </NavLink>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors w-full text-left"
              >
                <Settings size={18} className="text-gray-400" /><span>Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full text-left"
              >
                <LogOut size={18} /><span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setIsMenuOpen(false); setShowLogin(true); }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-[#1A4329] text-[#1A4329] rounded-full text-sm font-semibold hover:bg-green-50 transition-all"
              >
                <LogIn size={18} /><span>Sign In</span>
              </button>
              <button
                onClick={() => { setIsMenuOpen(false); setShowLogin(true); }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#1A4329] text-white rounded-full text-sm font-semibold hover:bg-opacity-90 shadow-sm transition-all"
              >
                <UserPlus size={18} /><span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV (logged in only) ── */}
      {isAuthenticated && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-inset-bottom">
          <div className="flex items-center justify-around py-2 px-4">
            <NavLink to="/home" className={mobileBottomLinkStyles}>
              <Home size={24} />
              <span className="text-xs">Home</span>
            </NavLink>

            <NavLink to="/new" className={mobileBottomLinkStyles}>
              <Sparkles size={24} />
              <span className="text-xs">New</span>
            </NavLink>

            {/* Create button — raised */}
            <NavLink to="/create" className="flex flex-col items-center gap-1">
              <div className="p-3 bg-[#1A4329] rounded-full text-white -mt-5 shadow-lg">
                <PlusCircle size={22} />
              </div>
              <span className="text-xs text-gray-500 mt-0.5">Create</span>
            </NavLink>

            <NavLink to="/popular" className={mobileBottomLinkStyles}>
              <Flame size={24} />
              <span className="text-xs">Popular</span>
            </NavLink>

            <NavLink to={`/user/${user?.id}`} className={mobileBottomLinkStyles}>
              {user?.profile_image ? (
                <img src={user.profile_image} className="w-6 h-6 rounded-full object-cover" alt="" />
              ) : (
                <User size={24} />
              )}
              <span className="text-xs">You</span>
            </NavLink>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
