import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import HomeFeed from './pages/HomeFeed'
import NewFeed from './pages/NewFeed'
import PopularFeed from './pages/PopularFeed'
import CommunityPage from './pages/CommunityPage'
import UserProfile from './pages/UserProfile'
import PostDetail from './pages/PostDetail'
import SearchPage from './pages/SearchPage'
import CreatePostPage from './pages/CreatePostPage'
import Sidebar from './components/layout/Sidebar'
import RightSidebar from './pages/RightSidebar'
import SettingsPage from './pages/SettingsPage'

function App() {
  const isSearchPage = useLocation().pathname === '/search'

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 lg:py-6">
        <div className="flex gap-4 lg:gap-6">

          {/* Left Sidebar — desktop only */}
          {!isSearchPage && <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
            <div className="sticky top-[76px]">
              <Sidebar />
            </div>
          </aside>}

          {/* Main content — full width on mobile */}
          <main className="flex-1 min-w-0 pb-24 lg:pb-8">
            <Routes>
              <Route path="/"                 element={<Navigate to="/home" replace />} />
              <Route path="/home"             element={<HomeFeed />} />
              <Route path="/new"              element={<NewFeed />} />
              <Route path="/popular"          element={<PopularFeed />} />
              <Route path="/create"           element={<CreatePostPage />} />
              <Route path="/search"           element={<SearchPage />} />
              <Route path="/settings"         element={<SettingsPage />} />
              <Route path="/w/:communitySlug" element={<CommunityPage />} />
              <Route path="/post/:id"         element={<PostDetail />} />
              <Route path="/user/:id"         element={<UserProfile />} />
            </Routes>
          </main>

          {/* Right Sidebar — desktop only */}
          {!isSearchPage && <aside className="hidden xl:block w-64 shrink-0">
            <div className="sticky top-[76px]">
              <RightSidebar />
            </div>
          </aside>}

        </div>
      </div>
    </div>
  )
}

export default App
