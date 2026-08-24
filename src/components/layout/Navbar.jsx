import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, User, LogOut, Wallet, Crown, MessageCircle,
  Shield, LayoutDashboard, Bell, Star, CheckCheck,
  Heart, FileText, Circle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'
import { useNotifications } from '../../hooks/useNotifications.jsx'

const ICON_MAP = {
  message:         <MessageCircle size={14} className="text-blue-400" />,
  new_message:     <MessageCircle size={14} className="text-blue-400" />,
  stars_purchased: <Star size={14} className="text-amber-400" />,
  stars_redeemed:  <Star size={14} className="text-purple-400" />,
  welcome_stars:   <Star size={14} className="text-amber-400" />,
  referral_bonus:  <Star size={14} className="text-pink-400" />,
  earned:          <Star size={14} className="text-green-400" />,
  cashout_initiated: <Wallet size={14} className="text-orange-400" />,
  cashout_approved:  <Wallet size={14} className="text-blue-400" />,
  cashout_paid:      <Wallet size={14} className="text-green-400" />,
  cashout_rejected:  <Wallet size={14} className="text-red-400" />,
  membership_activated: <Crown size={14} className="text-amber-400" />,
  default:         <Bell size={14} className="text-gray-400" />,
}

export default function Navbar() {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [bellOpen, setBellOpen]   = useState(false)
  const { user, wallet, stars, unread_notifications, logout, setUnreadNotifications, decrementUnread } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const bellRef   = useRef(null)

  // Real-time notifications (popups + sound) — hook handles socket listening
  const {
    notifications, setNotifications,
    unreadMessages,
    markRead: markNotifRead,
    markAllRead: markAllNotifsRead,
  } = useNotifications()

  const publicLinks = [
    { to: '/escorts',     label: 'Escorts' },
    { to: '/match',       label: '💞 Find Your Match' },
    { to: '/classifieds', label: 'Classifieds' },
    { to: '/blog',        label: 'Blog' },
  ]

  const userLinks = user ? [
    ...(user.role !== 'admin' ? [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { to: '/chat',       label: 'Messages',   icon: MessageCircle },
    { to: '/wallet',     label: 'Wallet',     icon: Wallet },
    ...(user.role === 'escort' ? [{ to: '/membership', label: 'Membership', icon: Crown }] : []),
    ...(user.role === 'admin' ? [{ to: '/admin', label: 'Admin Panel', icon: Shield, admin: true }] : []),
  ] : []

  // Close bell on outside click
  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleNotifClick = (notif) => {
    if (!notif.is_read) markNotifRead(notif.id)
    if (notif.ref_type === 'thread') navigate(`/chat/${notif.ref_id}`)
    else if (notif.ref_type === 'blog') navigate(`/blog`)
    else if (notif.ref_type === 'cashout') navigate('/wallet')
    setBellOpen(false)
  }

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }

  return (
    <header className="sticky top-0 z-50 bg-dark-900/90 backdrop-blur-xl border-b border-dark-600">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="https://files.catbox.moe/1yhxuh.jpg"
            alt="KenyanEscorts"
            className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-brand-900/30"
          />
          <span className="font-display font-bold text-white text-lg hidden sm:block">
            Kenya<span className="text-brand-500">Escorts</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {publicLinks.map(l => (
            <Link key={l.to} to={l.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.startsWith(l.to)
                  ? 'text-brand-400 bg-brand-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              {/* Wallet balance */}
              {wallet && (
                <Link to="/wallet" className="hidden sm:flex items-center gap-1.5 text-sm text-gray-300 hover:text-white bg-dark-700 hover:bg-dark-600 px-3 py-1.5 rounded-lg transition-colors">
                  <Wallet size={13} className="text-brand-400" />
                  <span className="font-mono font-medium">KSh {wallet.available?.toLocaleString()}</span>
                </Link>
              )}

              {/* Stars balance */}
              {stars && (
                <Link to="/wallet" className="hidden sm:flex items-center gap-1 text-sm text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-lg transition-colors border border-amber-500/20">
                  <Star size={12} />
                  <span className="font-mono font-medium">{stars.balance?.toLocaleString()}</span>
                </Link>
              )}

              {/* Chat with unread message badge */}
              <Link to="/chat" className="relative p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
                <MessageCircle size={18} />
                {unreadMessages > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-0.5 leading-none">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </motion.span>
                )}
              </Link>

              {/* Notification Bell */}
              <div className="relative" ref={bellRef}>
                <button onClick={() => setBellOpen(!bellOpen)}
                  className="relative p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
                  <Bell size={18} />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-0.5 leading-none">
                      {notifications.filter(n => !n.is_read).length > 9 ? '9+' : notifications.filter(n => !n.is_read).length}
                    </motion.span>
                  )}
                </button>
                <AnimatePresence>
                  {bellOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl overflow-hidden z-50">

                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
                        <h3 className="font-semibold text-white text-sm">Notifications</h3>
                        {unread_notifications > 0 && (
                          <button onClick={markAllNotifsRead} className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                            <CheckCheck size={13} /> Mark all read
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="text-center py-8">
                            <Bell size={28} className="mx-auto mb-2 text-gray-700" />
                            <p className="text-xs text-gray-600">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id}
                              className={`flex items-start gap-3 px-4 py-3 border-b border-dark-700/50 hover:bg-dark-700/50 transition-colors cursor-pointer group ${!n.is_read ? 'bg-brand-500/5' : ''}`}
                              onClick={() => handleNotifClick(n)}>
                              {/* Icon */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.is_read ? 'bg-brand-500/15' : 'bg-dark-700'}`}>
                                {ICON_MAP[n.type] || ICON_MAP.default}
                              </div>
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium ${!n.is_read ? 'text-white' : 'text-gray-300'}`}>{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                                <p className="text-xs text-gray-700 mt-1">
                                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                </p>
                              </div>
                              {/* Unread dot + actions */}
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                {!n.is_read && <span className="w-2 h-2 bg-brand-500 rounded-full mt-1" />}
                                {n.is_read && (
                                  <button onClick={e => { e.stopPropagation(); markUnread(n.id) }}
                                    className="opacity-0 group-hover:opacity-100 text-xs text-gray-600 hover:text-gray-400 transition-all">
                                    <Circle size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Admin badge */}
              {user.role === 'admin' && (
                <Link to="/admin" className="p-2 text-amber-400 hover:text-amber-300 hover:bg-dark-700 rounded-lg transition-colors hidden md:flex">
                  <Shield size={18} />
                </Link>
              )}

              {/* Profile dropdown desktop */}
              <div className="relative group hidden md:block">
                <button className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 px-3 py-1.5 rounded-lg transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                    <User size={12} className="text-white" />
                  </div>
                  <span className="text-sm text-gray-300 max-w-[80px] truncate">{user.email?.split('@')[0]}</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-500 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
                  {user.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-3 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors font-medium">
                      <Shield size={14} /> Admin Panel
                    </Link>
                  )}
                  {user.role !== 'admin' && (
                    <Link to="/dashboard" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-dark-700 transition-colors">
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                  )}
                  <Link to="/wallet" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-dark-700 transition-colors">
                    <Wallet size={14} /> Wallet
                  </Link>
                  {user.role === 'escort' && (
                    <Link to="/membership" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-dark-700 transition-colors">
                      <Crown size={14} /> Membership
                    </Link>
                  )}
                  <div className="border-t border-dark-600" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-dark-700 transition-colors">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm py-2 px-4">Sign In</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Join Free</Link>
            </div>
          )}

          {/* Hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-dark-600 bg-dark-900 overflow-hidden">
            <div className="p-4 space-y-1">

              {publicLinks.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname.startsWith(l.to) ? 'text-brand-400 bg-brand-500/10' : 'text-gray-300 hover:text-white hover:bg-dark-700'
                  }`}>
                  {l.label}
                </Link>
              ))}

              {user ? (
                <>
                  {/* Balances */}
                  <div className="flex gap-2 px-1 py-2">
                    {wallet && (
                      <div className="flex-1 bg-dark-800 rounded-xl p-3 border border-dark-600">
                        <p className="text-xs text-gray-500 mb-0.5">Wallet</p>
                        <p className="font-mono font-bold text-white text-sm">KSh {wallet.available?.toLocaleString()}</p>
                      </div>
                    )}
                    {stars && (
                      <div className="flex-1 bg-dark-800 rounded-xl p-3 border border-amber-500/20">
                        <p className="text-xs text-gray-500 mb-0.5">Stars</p>
                        <p className="font-mono font-bold text-amber-400 text-sm">⭐ {stars.balance?.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-dark-700 my-1" />

                  {userLinks.map(l => {
                    const Icon = l.icon
                    return (
                      <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          l.admin
                            ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                            : location.pathname.startsWith(l.to) ? 'text-brand-400 bg-brand-500/10' : 'text-gray-300 hover:text-white hover:bg-dark-700'
                        }`}>
                        <Icon size={16} className={l.admin ? 'text-amber-400' : 'text-gray-500'} />
                        {l.label}
                      </Link>
                    )
                  })}

                  <div className="border-t border-dark-700 my-1" />

                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-dark-700 my-2" />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-ghost text-sm py-2.5 justify-center">Sign In</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm py-2.5 justify-center">Join Free</Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
