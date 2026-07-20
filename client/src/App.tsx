import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import HomeFeed from './pages/HomeFeed'
import NewFeed from './pages/NewFeed'
import CommunityPage from './pages/CommunityPage'
import UserProfile from './pages/UserProfile'
import Sidebar from './components/layout/Sidebar'
import RightSidebar from './pages/RightSidebar'

function App() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] text-gray-800 font-sans">
      <Navbar />

      {/* On mobile: full width, scrollable. On desktop: 3-col fixed layout */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 lg:py-6">
        <div className="flex gap-4 lg:gap-6">

          {/* Left Sidebar — desktop only */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
            <div className="sticky top-6">
              <Sidebar />
            </div>
          </aside>

          {/* Main feed — full width on mobile, center col on desktop */}
          <main className="flex-1 min-w-0 pb-20 lg:pb-6">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomeFeed />} />
              <Route path="/new" element={<NewFeed />} />
              <Route path="/w/:communitySlug" element={<CommunityPage />} />
              <Route path="/user/:id" element={<UserProfile />} />
            </Routes>
          </main>

          {/* Right Sidebar — desktop only */}
          <aside className="hidden xl:block w-64 shrink-0">
            <div className="sticky top-6">
              <RightSidebar />
            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}

export default App
