import { useState, useEffect, useRef, useCallback } from "react";
import { Flame, Home, LogIn, Search, Sparkles, UserPlus, Menu, X, User, Settings, LogOut, ChevronDown, PlusCircle, Sun, Moon } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { searchService } from "../../services/searchService";
import type { Post, User as UserType, Community } from "../../types/index";
import Login from "../Login";
import { imgUrl } from "../../utils/imageUrl";
import NotificationDropdown from "../ui/NotificationDropdown";
import CreateCommunityModal from "../ui/CreateCommunityModal";
import SearchSuggestions from "../ui/SearchSuggestions";
import warkaLogo from "../../assets/warka-logo-web.png";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogin, setShowLogin]     = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [loginMode, setLoginMode]     = useState<"login"|"register">("login");
  const [q, setQ]                     = useState("");
  const [liveResults, setLiveResults] = useState<{ posts: Post[]; users: UserType[]; communities: Community[] } | null>(null);
  const [searching, setSearching]     = useState(false);
  const [showDrop, setShowDrop]       = useState(false);
  const location = useLocation();
  const profileRef  = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const searchRequestRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/search") {
      setQ(new URLSearchParams(location.search).get("q") ?? "");
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      const inDesktopSearch = desktopSearchRef.current?.contains(e.target as Node);
      const inMobileSearch = mobileSearchRef.current?.contains(e.target as Node);
      if (!inDesktopSearch && !inMobileSearch) setShowDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Debounce live search and ignore responses for older queries.
  const doSearch = useCallback(async (query: string) => {
    const requestId = ++searchRequestRef.current;
    setSearching(true);
    try {
      const r = await searchService.searchAll(query.trim());
      if (requestId !== searchRequestRef.current) return;
      setLiveResults(r);
      setShowDrop(true);
    } catch (e) {
      if (requestId === searchRequestRef.current) {
        console.error(e);
        setLiveResults({ posts: [], users: [], communities: [] });
        setShowDrop(true);
      }
    } finally {
      if (requestId === searchRequestRef.current) setSearching(false);
    }
  }, []);

  useEffect(() => {
    const query = q.trim();
    // Invalidate an in-flight response as soon as the input changes, before
    // the next debounced request starts.
    searchRequestRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query) {
      setLiveResults(null);
      setSearching(false);
      setShowDrop(false);
      return;
    }
    setShowDrop(true);
    debounceRef.current = setTimeout(() => doSearch(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, doSearch]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const openLogin = (mode: "login"|"register") => { setLoginMode(mode); setShowLogin(true); setMenuOpen(false); };
  const handleLogout = () => { logout(); setProfileOpen(false); setMenuOpen(false); navigate("/home"); };
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) { setShowDrop(false); navigate(`/search?q=${encodeURIComponent(q.trim())}`); }
  };
  const handleSearchChange = (value: string) => {
    setQ(value);
    if (location.pathname === "/search" && !value.trim() && location.search) {
      navigate("/search", { replace: true });
    }
  };
  const goToResult = (path: string) => { setShowDrop(false); setQ(""); navigate(path); };

  const avatarSrc = imgUrl(user?.profile_image);

  /* ── style helpers ── */
  const navLink = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 py-1.5 px-3 rounded-full text-sm font-medium transition-all
     ${isActive ? "bg-green-900/20 text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--accent)]"}`;

  const menuLink = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
     ${isActive ? "bg-green-900/20 text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--surface2)]"}`;

  const botLink = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 py-1 px-2 transition-all
     ${isActive ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--accent)]"}`;

  return (
    <>
      {showLogin && <Login onClose={() => setShowLogin(false)} defaultMode={loginMode} />}
      {showCreateCommunity && <CreateCommunityModal onClose={() => setShowCreateCommunity(false)} />}

      {/* ── TOP BAR ── */}
      <header style={{ backgroundColor:"var(--surface)", borderBottom:"1px solid var(--border)" }} className="sticky top-0 z-40">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 lg:px-6">

          {/* Left */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setMenuOpen(true)} className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-[var(--surface2)] transition-colors" style={{ color:"var(--muted)" }}>
              <Menu size={24} />
            </button>
            <NavLink to="/home" className="flex items-center gap-2 text-xl sm:text-2xl font-bold" style={{ color:"var(--accent)" }}>
              <img src={warkaLogo} alt="Warka — Where Ethiopia Connects" className="h-11 w-11 rounded-xl bg-white object-contain p-0.5" />
            </NavLink>
          </div>

          {/* Mobile search */}
          <div className="lg:hidden flex-1 mx-2 sm:mx-3 max-w-sm relative" ref={mobileSearchRef}>
          <form onSubmit={handleSearchSubmit}>
            <div className="flex items-center rounded-full gap-1.5 px-3 py-2" style={{ backgroundColor:"var(--input-bg)" }}>
              <Search size={15} style={{ color:"var(--muted)" }} className="shrink-0" />
              <input type="search" placeholder="Search..." value={q} onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => q.trim() && setShowDrop(true)}
                className="bg-transparent outline-none text-sm w-full" style={{ color:"var(--text)" }} />
              {searching && <span className="text-xs" style={{ color:"var(--muted)" }}>…</span>}
            </div>
          </form>
          {showDrop && <SearchSuggestions query={q} results={liveResults} loading={searching} onSelect={goToResult} />}
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center flex-1 justify-between ml-8">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1">
                <NavLink to="/home"    className={navLink}><Home size={17}/><span>Home</span></NavLink>
                <NavLink to="/new"     className={navLink}><Sparkles size={17}/><span>New</span></NavLink>
                <NavLink to="/popular" className={navLink}><Flame size={17}/><span>Popular</span></NavLink>
              </div>
              <div className="relative" ref={desktopSearchRef}>
                <form onSubmit={handleSearchSubmit} className="flex items-center rounded-full gap-2 px-4 py-2 w-52 xl:w-64" style={{ backgroundColor:"var(--input-bg)" }}>
                  <Search size={16} style={{ color:"var(--muted)" }} className="shrink-0" />
                  <input type="search" placeholder="Search topics, communities..." value={q} onChange={e => handleSearchChange(e.target.value)}
                    onFocus={() => q.trim() && setShowDrop(true)}
                    className="bg-transparent outline-none text-sm w-full" style={{ color:"var(--text)" }} />
                  {searching && <span className="text-xs" style={{ color:"var(--muted)" }}>...</span>}
                </form>

                {showDrop && <SearchSuggestions query={q} results={liveResults} loading={searching} onSelect={goToResult} />}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <NavLink to="/settings" aria-label="Settings" title="Settings" className="p-2 rounded-full hover:bg-[var(--surface2)] transition-colors" style={{ color:"var(--muted)" }}>
                <Settings size={18} />
              </NavLink>
              {/* Theme toggle */}
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-[var(--surface2)] transition-colors" style={{ color:"var(--muted)" }} title="Toggle theme">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {isAuthenticated ? (
                <>
                  <NotificationDropdown />
                  <div className="relative" ref={profileRef}>
                    <button onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-[var(--surface2)] transition-all"
                      style={{ border:"1px solid transparent" }}>
                      {avatarSrc ? <img src={avatarSrc} className="w-8 h-8 rounded-full object-cover" alt="" /> :
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor:"var(--accent)" }}>
                          <User size={16} />
                        </div>}
                      <span className="text-sm font-medium max-w-[100px] truncate" style={{ color:"var(--text)" }}>{user?.username}</span>
                      <ChevronDown size={14} style={{ color:"var(--muted)" }} className={`transition-transform ${profileOpen?"rotate-180":""}`} />
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl py-2 z-50"
                        style={{ backgroundColor:"var(--surface)", border:"1px solid var(--border)" }}>
                        <div className="px-4 py-3" style={{ borderBottom:"1px solid var(--border)" }}>
                          <p className="text-sm font-semibold truncate" style={{ color:"var(--text)" }}>{user?.username}</p>
                          <p className="text-xs truncate" style={{ color:"var(--muted)" }}>{user?.email}</p>
                        </div>
                        <div className="py-1">
                          <NavLink to={`/user/${user?.id}`} onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-[var(--surface2)] transition-colors" style={{ color:"var(--text)" }}>
                            <User size={15} style={{ color:"var(--muted)" }} /> Profile
                          </NavLink>
                          <NavLink to="/settings" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-[var(--surface2)] transition-colors" style={{ color:"var(--text)" }}>
                            <Settings size={15} style={{ color:"var(--muted)" }} /> Settings
                          </NavLink>
                          {/* Theme in dropdown */}
                          <button onClick={toggleTheme}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-[var(--surface2)] transition-colors" style={{ color:"var(--text)" }}>
                            {isDark ? <Sun size={15} style={{ color:"var(--muted)" }} /> : <Moon size={15} style={{ color:"var(--muted)" }} />}
                            {isDark ? "Light Mode" : "Dark Mode"}
                          </button>
                        </div>
                        <div className="pt-1" style={{ borderTop:"1px solid var(--border)" }}>
                          <button onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                            <LogOut size={15} /> Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => openLogin("login")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-900/10 transition-all"
                    style={{ border:"1px solid var(--accent)", color:"var(--accent)" }}>
                    <LogIn size={15} /> Sign In
                  </button>
                  <button onClick={() => openLogin("register")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all"
                    style={{ backgroundColor:"var(--accent)" }}>
                    <UserPlus size={15} /> Register
                  </button>
                </>
              )}
            </div>
          </nav>

          {/* Mobile right */}
          <div className="lg:hidden flex items-center gap-1 shrink-0">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-[var(--surface2)]" style={{ color:"var(--muted)" }}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {isAuthenticated
              ? <NotificationDropdown />
              : <button onClick={() => openLogin("login")} className="p-2 rounded-full hover:bg-[var(--surface2)]" style={{ color:"var(--muted)" }}><LogIn size={22} /></button>}
          </div>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      {menuOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setMenuOpen(false)} />}

      {/* ── Mobile slide menu ── */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${menuOpen?"translate-x-0":"-translate-x-full"}`}
        style={{ backgroundColor:"var(--surface)" }}>
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom:"1px solid var(--border)" }}>
          <NavLink to="/home" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-xl font-bold" style={{ color:"var(--accent)" }}>
            <img src={warkaLogo} alt="Warka — Where Ethiopia Connects" className="h-12 w-12 rounded-xl bg-white object-contain p-0.5" />
          </NavLink>
          <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg hover:bg-[var(--surface2)]" style={{ color:"var(--muted)" }}><X size={22} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor:"var(--surface2)" }}>
              {avatarSrc ? <img src={avatarSrc} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" /> :
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor:"var(--accent)" }}>
                  <User size={20} />
                </div>}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color:"var(--text)" }}>{user.username}</p>
                <p className="text-xs truncate" style={{ color:"var(--muted)" }}>{user.email}</p>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <div className="p-4 rounded-xl" style={{ backgroundColor:"var(--surface2)", border:"1px solid var(--border)" }}>
              <p className="text-sm font-semibold mb-1" style={{ color:"var(--accent)" }}>Join Warka</p>
              <p className="text-xs mb-3" style={{ color:"var(--muted)" }}>Sign in to post, comment and vote.</p>
              <div className="flex gap-2">
                <button onClick={() => openLogin("login")} className="flex-1 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1 hover:opacity-90"
                  style={{ border:"1px solid var(--accent)", color:"var(--accent)" }}>
                  <LogIn size={13} /> Sign In
                </button>
                <button onClick={() => openLogin("register")} className="flex-1 py-2 rounded-full text-xs font-semibold text-white flex items-center justify-center gap-1 hover:opacity-90"
                  style={{ backgroundColor:"var(--accent)" }}>
                  <UserPlus size={13} /> Register
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <NavLink to="/home"    onClick={() => setMenuOpen(false)} className={menuLink}><Home size={19} /> Home</NavLink>
            <NavLink to="/new"     onClick={() => setMenuOpen(false)} className={menuLink}><Sparkles size={19} /> New</NavLink>
            <NavLink to="/popular" onClick={() => setMenuOpen(false)} className={menuLink}><Flame size={19} /> Popular</NavLink>
            {isAuthenticated && (
              <button onClick={() => { setMenuOpen(false); setShowCreateCommunity(true); }}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface2)]">
                <PlusCircle size={19} /> Create Community
              </button>
            )}
          </div>

          <div style={{ borderTop:"1px solid var(--border)" }} className="pt-3">
            <button onClick={toggleTheme} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm hover:bg-[var(--surface2)] transition-colors" style={{ color:"var(--text)" }}>
              {isDark ? <Sun size={18} style={{ color:"var(--muted)" }} /> : <Moon size={18} style={{ color:"var(--muted)" }} />}
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
            <NavLink to="/settings" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm hover:bg-[var(--surface2)] transition-colors" style={{ color:"var(--text)" }}>
              <Settings size={18} style={{ color:"var(--muted)" }} /> Settings
            </NavLink>
          </div>

          {isAuthenticated && (
            <div className="flex flex-col gap-1" style={{ borderTop:"1px solid var(--border)" }}>
              <NavLink to={`/user/${user?.id}`} onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm rounded-xl hover:bg-[var(--surface2)] transition-colors" style={{ color:"var(--text)" }}>
                <User size={18} style={{ color:"var(--muted)" }} /> My Profile
              </NavLink>
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 rounded-xl hover:bg-red-500/10 transition-colors w-full text-left">
                <LogOut size={18} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40" style={{ backgroundColor:"var(--surface)", borderTop:"1px solid var(--border)" }}>
        <div className="flex items-center justify-around py-2 px-1">
          <NavLink to="/home"    className={botLink}><Home size={23}/><span className="text-[10px]">Home</span></NavLink>
          <NavLink to="/new"     className={botLink}><Sparkles size={23}/><span className="text-[10px]">New</span></NavLink>
          {isAuthenticated
            ? <NavLink to="/create" className="flex flex-col items-center gap-0.5">
                <div className="p-2.5 rounded-full text-white -mt-4 shadow-lg" style={{ backgroundColor:"var(--accent)" }}><PlusCircle size={22}/></div>
                <span className="text-[10px]" style={{ color:"var(--muted)" }}>Create</span>
              </NavLink>
            : <button onClick={() => openLogin("login")} className="flex flex-col items-center gap-0.5">
                <div className="p-2.5 rounded-full text-white -mt-4 shadow-lg" style={{ backgroundColor:"var(--accent)" }}><LogIn size={22}/></div>
                <span className="text-[10px]" style={{ color:"var(--muted)" }}>Sign In</span>
              </button>}
          <NavLink to="/popular" className={botLink}><Flame size={23}/><span className="text-[10px]">Popular</span></NavLink>
          {isAuthenticated
            ? <NavLink to={`/user/${user?.id}`} className={botLink}>
                {avatarSrc ? <img src={avatarSrc} className="w-6 h-6 rounded-full object-cover" alt="" /> : <User size={23}/>}
                <span className="text-[10px]">You</span>
              </NavLink>
            : <button onClick={() => openLogin("register")} className="flex flex-col items-center gap-0.5 px-2 hover:text-[var(--accent)]" style={{ color:"var(--muted)" }}>
                <UserPlus size={23}/><span className="text-[10px]">Register</span>
              </button>}
        </div>
      </nav>
    </>
  );
};
export default Navbar;
