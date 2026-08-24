import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Crown, Megaphone, ShieldCheck,
  ArrowLeftRight, Newspaper, LogOut, ChevronLeft, Menu, X,
  Bell, Settings, TrendingUp, Star, Heart
} from 'lucide-react'
import useAuthStore from '../../store/authStore'

const NAV = [
  { to: '/admin',               label: 'Dashboard',       icon: LayoutDashboard, end: true },
  { to: '/admin/users',         label: 'Users',           icon: Users },
  { to: '/admin/tiers',         label: 'Membership Tiers',icon: Crown },
  { to: '/admin/stars',         label: 'Stars & Wallet',  icon: Star },
  { to: '/admin/match',         label: 'Find Your Match', icon: Heart },
  { to: '/admin/ads',           label: 'Advertisements',  icon: Megaphone },
  { to: '/admin/sponsored',     label: 'Sponsored',       icon: TrendingUp },
  { to: '/admin/verifications', label: 'Verifications',   icon: ShieldCheck },
  { to: '/admin/transactions',  label: 'Transactions',    icon: ArrowLeftRight },
  { to: '/admin/announcements', label: 'Announcements',   icon: Newspaper },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Close mobile on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setMobileOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const currentPage = NAV.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center border-b border-white/10 ${collapsed && !isMobile ? 'justify-center px-3 py-5' : 'gap-3 px-5 py-5'}`}>
        <img
          src="https://files.catbox.moe/1yhxuh.jpg"
          alt="KenyaEscorts"
          className="w-9 h-9 rounded-xl object-cover flex-shrink-0 shadow-lg shadow-brand-900/40"
        />
        {(!collapsed || isMobile) && (
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Kenya Escorts</p>
            <p className="text-brand-400 text-xs font-medium">Admin Panel</p>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={15} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto p-1.5 text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 group relative
              ${collapsed && !isMobile ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}
              ${isActive
                ? 'bg-brand-600/25 text-brand-300 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/8'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-400 rounded-r-full" />}
                <Icon size={17} className={`flex-shrink-0 ${isActive ? 'text-brand-400' : ''}`} />
                {(!collapsed || isMobile) && <span className="truncate">{label}</span>}
                {/* Tooltip when collapsed */}
                {collapsed && !isMobile && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-dark-700 border border-dark-500 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-2 border-t border-white/10 space-y-0.5">
        <button
          onClick={() => { logout(); navigate('/') }}
          className={`w-full flex items-center gap-3 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors py-2.5 ${collapsed && !isMobile ? 'justify-center px-0' : 'px-3'}`}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-dark-950 text-white">

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-dark-900 border-r border-white/8 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-dark-900 border-r border-white/8 z-50 lg:hidden flex flex-col"
            >
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 bg-dark-900/80 backdrop-blur-xl border-b border-white/8">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Page title */}
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white">
              {currentPage?.label || 'Admin'}
            </h2>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <span className="text-xs text-gray-300 hidden sm:block">{user?.email?.split('@')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
