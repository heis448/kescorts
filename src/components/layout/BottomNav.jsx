import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Heart, MessageCircle, User, LogIn } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { useNotifications } from '../../hooks/useNotifications.jsx'

// Native-style bottom tab bar for phones. Hidden on desktop, in admin, on login/register,
// and inside an open conversation (so it never covers the message box).
const hiddenOn = (path) =>
  path.startsWith('/admin') || path === '/login' || path === '/register' || /^\/chat\/[^/]+/.test(path)

export default function BottomNav() {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const { unreadMessages } = useNotifications()
  const visible = !hiddenOn(pathname)

  // Reserve space at the bottom of the page (CSS in index.css) only while the bar is showing
  useEffect(() => {
    document.body.classList.toggle('has-bottom-nav', visible)
    return () => document.body.classList.remove('has-bottom-nav')
  }, [visible])

  if (!visible) return null

  const tabs = [
    { to: '/',        label: 'Home',    icon: Home,          match: (p) => p === '/' },
    { to: '/escorts', label: 'Escorts', icon: Search,        match: (p) => p.startsWith('/escorts') || p.startsWith('/escort/') },
    { to: '/match',   label: 'Match',   icon: Heart,         match: (p) => p.startsWith('/match') },
    ...(user ? [{ to: '/chat', label: 'Chats', icon: MessageCircle, match: (p) => p.startsWith('/chat'), badge: unreadMessages }] : []),
    user
      ? { to: '/dashboard', label: 'Me',      icon: User,  match: (p) => p.startsWith('/dashboard') || p.startsWith('/wallet') || p.startsWith('/membership') }
      : { to: '/login',     label: 'Sign in', icon: LogIn, match: () => false },
  ]

  const tap = () => { try { navigator.vibrate?.(8) } catch {} }   // tiny haptic tick on Android

  return (
    <nav aria-label="Main" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-dark-900/95 backdrop-blur-xl border-t border-white/10"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <ul className="flex items-stretch justify-around h-16">
        {tabs.map(({ to, label, icon: Icon, match, badge }) => {
          const active = match(pathname)
          return (
            <li key={to} className="flex-1">
              <Link to={to} onClick={tap}
                className={`relative h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium select-none active:scale-90 transition-transform ${
                  active ? 'text-brand-400' : 'text-gray-500'}`}>
                <span className="relative">
                  <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-brand-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                {label}
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-500" />}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
