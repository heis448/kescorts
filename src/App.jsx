import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'

// Layout
import Navbar  from './components/layout/Navbar'
import Footer  from './components/layout/Footer'

// Pages
import Home          from './pages/Home'
import Escorts       from './pages/Escorts'
import EscortProfile from './pages/EscortProfile'
import Classifieds   from './pages/Classifieds'
import Login         from './pages/Login'
import Register      from './pages/Register'
import Dashboard     from './pages/Dashboard'
import Membership    from './pages/Membership'
import Wallet        from './pages/Wallet'
import ChatPage      from './pages/ChatPage'
import BlogPage      from './pages/BlogPage'
import BlogPost      from './pages/BlogPost'
import MatchPage     from './pages/MatchPage'
import MatchProfile  from './pages/MatchProfile'

// Admin
import AdminLayout        from './pages/admin/AdminLayout'
import AdminDashboard     from './pages/admin/AdminDashboard'
import AdminUsers         from './pages/admin/AdminUsers'
import AdminTiers         from './pages/admin/AdminTiers'
import AdminAds           from './pages/admin/AdminAds'
import AdminSponsored     from './pages/admin/AdminSponsored'
import AdminVerifications from './pages/admin/AdminVerifications'
import AdminTransactions  from './pages/admin/AdminTransactions'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminStars         from './pages/admin/AdminStars'
import AdminMatch        from './pages/admin/AdminMatch'

// ── Route guards ──────────────────────────────────────────────────
const ProtectedRoute = ({ children, role }) => {
  const { user, token, loading } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  // Only show spinner on initial load when user hasn't loaded yet
  if (!user && loading) return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return children
}

// ── Layouts ───────────────────────────────────────────────────────
// Standard layout — Navbar + Footer (for public pages)
const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
)

// ── App ───────────────────────────────────────────────────────────
export default function App() {
  const { token, fetchMe } = useAuthStore()

  useEffect(() => {
    if (!token) return
    // Only show spinner on very first load (no user yet)
    const isFirstLoad = !useAuthStore.getState().user
    fetchMe(isFirstLoad ? false : true)
    const interval = setInterval(() => fetchMe(true), 30000)
    return () => clearInterval(interval)
  }, [token])

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1a1a24', color: '#e8e8f0', border: '1px solid #2a2a3e' },
          success: { iconTheme: { primary: '#ff2d4e', secondary: '#fff' } }
        }}
      />
      <Routes>

        {/* ── Public pages (with Navbar + Footer) ── */}
        <Route path="/"            element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/escorts"     element={<PublicLayout><Escorts /></PublicLayout>} />
        <Route path="/escort/:uuid"element={<PublicLayout><EscortProfile /></PublicLayout>} />
        <Route path="/classifieds" element={<PublicLayout><Classifieds /></PublicLayout>} />
        <Route path="/blog"        element={<PublicLayout><BlogPage /></PublicLayout>} />
        <Route path="/blog/:slug"  element={<PublicLayout><BlogPost /></PublicLayout>} />
        <Route path="/match"       element={<PublicLayout><MatchPage /></PublicLayout>} />
        <Route path="/match/:uuid" element={<PublicLayout><MatchProfile /></PublicLayout>} />
        <Route path="/login"       element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/register"    element={<PublicLayout><Register /></PublicLayout>} />

        {/* ── Dashboard — full page, NO PublicLayout (has its own sidebar) ── */}
        <Route path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />

        {/* ── Other protected pages (with Navbar + Footer) ── */}
        <Route path="/membership"
          element={<ProtectedRoute><PublicLayout><Membership /></PublicLayout></ProtectedRoute>}
        />
        <Route path="/wallet"
          element={<ProtectedRoute><PublicLayout><Wallet /></PublicLayout></ProtectedRoute>}
        />
        <Route path="/chat"
          element={<ProtectedRoute><PublicLayout><ChatPage /></PublicLayout></ProtectedRoute>}
        />
        <Route path="/chat/:threadId"
          element={<ProtectedRoute><PublicLayout><ChatPage /></PublicLayout></ProtectedRoute>}
        />

        {/* ── Admin (has its own layout) ── */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index                element={<AdminDashboard />} />
          <Route path="users"         element={<AdminUsers />} />
          <Route path="tiers"         element={<AdminTiers />} />
          <Route path="ads"           element={<AdminAds />} />
          <Route path="sponsored"       element={<AdminSponsored />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="transactions"  element={<AdminTransactions />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="stars"         element={<AdminStars />} />
          <Route path="match"         element={<AdminMatch />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
