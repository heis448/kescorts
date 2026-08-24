import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'
import { getSocket } from '../utils/socket'
import { playNotifSound, playMessageSound } from '../utils/notifSound'
import useAuthStore from '../store/authStore'

// Every type the backend can emit
const EMOJI = {
  // Chat
  new_message:          '💬',
  chat_started:         '💬',
  message_notification: '💬',

  // Blog
  blog_like:            '❤️',
  blog_comment:         '💬',
  blog_reply:           '💬',

  // Stories
  story_reaction:       '🔥',
  story_view:           '👁️',

  // Reviews
  new_review:           '⭐',
  review_reply:         '💬',

  // Stars & Wallet
  stars_purchased:      '⭐',
  stars_redeemed:       '💰',
  welcome_stars:        '⭐',
  wallet_topup:         '✅',
  payment_failed:       '❌',

  // Membership
  membership_activated: '👑',

  // Cashouts
  cashout_initiated:    '💸',
  cashout_approved:     '✅',
  cashout_paid:         '💸',
  cashout_rejected:     '❌',

  // Favourites
  new_favourite:        '💖',

  // Phone reveal
  phone_reveal:         '📞',

  // Verification
  verified:             '✅',
  verification_rejected:'❌',

  // Default
  default:              '🔔',
}

// Where to navigate when tapping a notification
const getNavPath = (notif) => {
  const { ref_type, ref_id, ref_slug, type } = notif
  if (['wallet_topup','stars_purchased','stars_redeemed','cashout_initiated',
       'cashout_approved','cashout_paid','cashout_rejected','payment_failed',
       'membership_activated'].includes(type)) return '/dashboard'
  if (!ref_type) return null
  switch (ref_type) {
    case 'thread':  return `/chat/${ref_id}`
    case 'blog':    return ref_slug ? `/blog/${ref_slug}` : null  // use slug not ID
    case 'story':   return ref_slug ? `/escort/${ref_slug}` : '/escorts' // escort UUID → their profile
    case 'review':  return ref_slug ? `/escort/${ref_slug}` : null
    case 'profile': return ref_id ? `/escort/${ref_id}` : null
    case 'cashout': return '/dashboard'
    default:        return null
  }
}

const showToast = (emoji, title, body, onClick, avatar = null) => {
  toast(
    (t) => (
      <div
        onClick={() => { if (onClick) onClick(); toast.dismiss(t.id) }}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          cursor: onClick ? 'pointer' : 'default',
          width: '100%', minWidth: 0
        }}
      >
        {/* Avatar or emoji */}
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          overflow: 'hidden', background: '#2a2a3e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, border: '2px solid #ff2d4e'
        }}>
          {avatar
            ? <img src={avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : emoji}
        </div>
        {/* Text */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 13, lineHeight: 1.3 }}>{title}</div>
          {body && (
            <div style={{
              color: '#aaa', fontSize: 12, marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{body.slice(0, 60)}</div>
          )}
        </div>
        {/* Dismiss */}
        <button
          onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id) }}
          style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
          ✕
        </button>
      </div>
    ),
    {
      duration: 5000,
      position: 'top-center',
      style: {
        background: '#1a1a2e',
        color: '#fff',
        border: '1px solid #2a2a3e',
        borderRadius: '16px',
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        maxWidth: '360px',
        width: '90vw',
      },
    }
  )
}

export function useNotifications() {
  const { user, setUnreadNotifications } = useAuthStore()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await api.get('/notifications')
      const list = data?.notifications || data || []
      setNotifications(list)
      setUnreadNotifications(list.filter(n => !n.is_read).length)
    } catch {}
    setLoading(false)
  }, [user?.id])

  const fetchUnreadMessages = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get('/chat/threads')
      const threads = Array.isArray(data) ? data : (data?.threads || [])
      setUnreadMessages(threads.reduce((s, t) => s + (parseInt(t.unread_count) || 0), 0))
    } catch {}
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    fetchNotifications()
    fetchUnreadMessages()
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    const socket = getSocket()

    // All backend notify() calls emit 'notification' to the user's room
    const onNotification = (notif) => {
      setNotifications(prev => [notif, ...prev])
      setUnreadNotifications(prev => (prev || 0) + 1)
      playNotifSound()

      const emoji = EMOJI[notif.type] || EMOJI.default
      const path  = getNavPath(notif)
      showToast(emoji, notif.title, notif.body, path ? () => navigate(path) : null)
    }

    // Chat: new message — updates message badge only, NOT notifications bell
    const onNewMessage = ({ thread_id, message, sender_id, sender_name, sender_avatar }) => {
      if (sender_id === user.id) return // ignore own messages
      setUnreadMessages(prev => prev + 1)
      // Toast only — does NOT increment notification bell count
      playMessageSound()
      showToast('💬', sender_name || 'New message', message, () => navigate(`/chat/${thread_id}`), sender_avatar || null)
    }

    socket.on('notification',        onNotification)
    socket.on('new_message',         onNewMessage)

    return () => {
      socket.off('notification',      onNotification)
      socket.off('new_message',       onNewMessage)
    }
  }, [user?.id])

  const markRead = useCallback(async (id) => {
    await api.put(`/notifications/${id}/read`).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadNotifications(prev => Math.max(0, (prev || 0) - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await api.put('/notifications/read-all').catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadNotifications(0)
  }, [])

  return {
    notifications, setNotifications,
    unreadMessages, setUnreadMessages,
    loading, fetchNotifications, markRead, markAllRead
  }
}
