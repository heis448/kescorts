import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageCircle, ArrowLeft, Star, X, Check, Loader2, Lock, BadgeCheck, Search } from 'lucide-react'
import { format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const KE_TZ = 'Africa/Nairobi'
const fmt = (date, pattern) => format(utcToZonedTime(new Date(date), KE_TZ), pattern)
import api from '../utils/api'
import { getSocket } from '../utils/socket'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

// ── Tick component ────────────────────────────────────────────────
// sent=true → 1 grey tick (delivered to server, receiver offline)
// delivered=true → 2 grey ticks (receiver online but not opened)
// read=true → 2 blue ticks
function Ticks({ sent, delivered, read }) {
  if (!sent) return null
  const blue = 'text-blue-400'
  const grey = 'text-gray-500'

  if (read) {
    return (
      <span className="inline-flex items-center" title="Seen">
        <svg width="16" height="10" viewBox="0 0 16 10" className={blue}>
          <path d="M1 5l3 3L10 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 5l3 3L14 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    )
  }
  if (delivered) {
    return (
      <span className="inline-flex items-center" title="Delivered">
        <svg width="16" height="10" viewBox="0 0 16 10" className={grey}>
          <path d="M1 5l3 3L10 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 5l3 3L14 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    )
  }
  // Single tick
  return (
    <span className="inline-flex items-center" title="Sent">
      <svg width="10" height="10" viewBox="0 0 10 10" className={grey}>
        <path d="M1 5l3 3L9 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}

// ── Online dot ────────────────────────────────────────────────────
function OnlineDot({ online }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full border-2 border-dark-800 ${online ? 'bg-green-400' : 'bg-gray-600'}`} />
  )
}

export default function ChatPage() {
  const { threadId }  = useParams()
  const { user }      = useAuthStore()
  const navigate      = useNavigate()
  const isClient      = user?.role === 'client'

  const [threads, setThreads]       = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [messages, setMessages]     = useState([])
  const [active, setActive]         = useState(threadId || null)
  const [text, setText]             = useState('')
  const [otherTyping, setOtherTyping] = useState(false)
  const [otherOnline, setOtherOnline] = useState(false)
  const [starsInfo, setStarsInfo]   = useState(null)
  const [packages, setPackages]     = useState([])
  const [showBuyStars, setShowBuyStars] = useState(false)
  const [selectedPkg, setSelectedPkg]  = useState(null)
  const [buyMethod, setBuyMethod]   = useState('wallet')
  const [buying, setBuying]         = useState(false)
  const [sending, setSending]       = useState(false)

  const [suggestSearch, setSuggestSearch]   = useState('')
  const [searchResults, setSearchResults]   = useState([])
  const [searching, setSearching]           = useState(false)

  const messagesEndRef  = useRef(null)
  const messagesBoxRef  = useRef(null)
  const typingTimer     = useRef(null)
  const searchTimer     = useRef(null)
  const isTypingRef     = useRef(false)
  const socket          = getSocket()

  const starsBalance  = starsInfo?.wallet?.balance || 0
  const starsPerMsg   = starsInfo?.stars_per_message || 5
  const isLocked      = isClient && starsBalance < starsPerMsg

  // Active thread info
  const activeThread = threads.find(t => String(t.id) === String(active))

  // ── Scroll to bottom ─────────────────────────────────────────
  const scrollDown = useCallback((instant = false) => {
    const box = messagesBoxRef.current
    if (box) {
      box.scrollTop = box.scrollHeight
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' })
    }
  }, [])

  // ── Load threads + stars ──────────────────────────────────────
  useEffect(() => {
    api.get('/chat/threads').then(r => {
      const threads = (r.data || []).map(t => ({
        ...t,
        _online: t.other_online ?? false
      }))
      setThreads(threads)
    }).catch(() => {})
    // Clients see ALL escorts sorted by online first
    if (user?.role === 'client') {
      api.get('/search/online')
        .then(r => setSuggestions(Array.isArray(r.data) ? r.data : []))
        .catch(() => {})
    }
    // Escorts see ALL clients sorted by online first
    if (user?.role === 'escort') {
      api.get('/chat/clients')
        .then(r => setSuggestions(Array.isArray(r.data) ? r.data : []))
        .catch(() => {})
    }
    api.get('/chat/stars').then(r => {
      setStarsInfo(r.data)
      setPackages(r.data.packages || [])
    }).catch(() => {})
  }, [])

  // ── Global socket: online/offline presence ────────────────────
  useEffect(() => {
    const handleOnline  = ({ userId }) => {
      setThreads(prev => prev.map(t =>
        t.other_user_id === userId ? { ...t, _online: true } : t
      ))
      if (activeThread?.other_user_id === userId) setOtherOnline(true)
    }
    const handleOffline = ({ userId }) => {
      setThreads(prev => prev.map(t =>
        t.other_user_id === userId ? { ...t, _online: false } : t
      ))
      if (activeThread?.other_user_id === userId) setOtherOnline(false)
    }

    socket.on('user_online',  handleOnline)
    socket.on('user_offline', handleOffline)
    return () => {
      socket.off('user_online',  handleOnline)
      socket.off('user_offline', handleOffline)
    }
  }, [socket, activeThread])

  // ── Per-thread socket events ──────────────────────────────────
  useEffect(() => {
    if (!active) return

    // Load messages + check other user's online status
    api.get(`/chat/messages/${active}`).then(r => {
      setMessages(r.data)
      setTimeout(() => scrollDown(true), 30) // instant on initial load
    }).catch(() => {})

    // Check if other user is online right now
    if (activeThread?.other_user_id) {
      api.get(`/chat/online/${activeThread.other_user_id}`)
        .then(r => setOtherOnline(r.data.online))
        .catch(() => {})
    }

    socket.emit('join_thread', active)

    const handleNewMessage = (msg) => {
      if (String(msg.thread_id) !== String(active)) return
      // Skip if I sent this message — already added via HTTP response
      if (msg.sender_id === user?.id) return
      setMessages(prev => [...prev, msg])
      scrollDown()

      // If I'm the receiver, immediately mark as read and notify sender
      if (msg.sender_id !== user?.id) {
        socket.emit('mark_read', { threadId: active })
        // Update thread list last message
        setThreads(prev => prev.map(t =>
          String(t.id) === String(active) ? { ...t, last_message: msg.message, unread_count: 0 } : t
        ))
      } else {
        // It's my own message coming back — update thread list
        setThreads(prev => prev.map(t =>
          String(t.id) === String(active) ? { ...t, last_message: msg.message } : t
        ))
      }

      // Stars balance update for escort receiving a reply
      if (!isClient && msg.stars_earned > 0) {
        setStarsInfo(prev => prev ? {
          ...prev,
          wallet: { ...prev.wallet, balance: prev.wallet.balance + msg.stars_earned }
        } : prev)
      }
    }

    const handleTyping = ({ threadId: tid }) => {
      if (String(tid) !== String(active)) return
      setOtherTyping(true)
    }
    const handleStopTyping = ({ threadId: tid }) => {
      if (String(tid) !== String(active)) return
      setOtherTyping(false)
    }

    // When receiver opens/reads — update my sent messages to read=true
    const handleRead = ({ threadId: tid }) => {
      if (String(tid) !== String(active)) return
      setMessages(prev => prev.map(m =>
        m.sender_id === user?.id ? { ...m, is_read: true } : m
      ))
    }

    socket.on('new_message',      handleNewMessage)
    socket.on('user_typing',      handleTyping)
    socket.on('user_stop_typing', handleStopTyping)
    socket.on('messages_read',    handleRead)

    // Mark messages as read when opening thread
    socket.emit('mark_read', { threadId: active })

    return () => {
      socket.off('new_message',      handleNewMessage)
      socket.off('user_typing',      handleTyping)
      socket.off('user_stop_typing', handleStopTyping)
      socket.off('messages_read',    handleRead)
    }
  }, [active, user?.id, socket, scrollDown])

  useEffect(() => {
    const box = messagesBoxRef.current
    if (!box) return
    // Only auto-scroll if user is within 150px of bottom
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 150
    if (nearBottom) scrollDown(true)
  }, [messages])

  // ── Send message ──────────────────────────────────────────────
  const sendMessage = async () => {
    if (!text.trim() || !active || sending) return
    if (isLocked) { setShowBuyStars(true); return }

    // Stop typing indicator
    stopTyping()

    setSending(true)
    try {
      const { data: msg } = await api.post(`/chat/messages/${active}`, { message: text })
      setMessages(prev => [...prev, msg])
      setText('')
      scrollDown()

      if (isClient) {
        setStarsInfo(prev => prev ? {
          ...prev,
          wallet: { ...prev.wallet, balance: Math.max(0, prev.wallet.balance - starsPerMsg) }
        } : prev)
      }
    } catch (err) {
      if (err.response?.data?.error === 'insufficient_stars') {
        setShowBuyStars(true)
      } else {
        toast.error(err.response?.data?.message || 'Failed to send')
      }
    }
    setSending(false)
  }

  // ── Typing indicators ─────────────────────────────────────────
  const startTyping = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit('typing', { threadId: active })
    }
    // Reset debounce timer
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(stopTyping, 2000)
  }

  const stopTyping = () => {
    if (isTypingRef.current) {
      isTypingRef.current = false
      socket.emit('stop_typing', { threadId: active })
    }
    clearTimeout(typingTimer.current)
  }


  // ── Suggestion search ─────────────────────────────────────────
  const handleSuggestSearch = (val) => {
    setSuggestSearch(val)
    clearTimeout(searchTimer.current)
    if (!val.trim()) { setSearchResults([]); setSearching(false); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        if (isClient) {
          // client searches ALL escorts via /search
          const { data } = await api.get(`/search?q=${encodeURIComponent(val)}&limit=20`)
          setSearchResults(Array.isArray(data) ? data : [])
        } else {
          // escort searches ALL clients via /chat/clients?q=
          const { data } = await api.get(`/chat/clients?q=${encodeURIComponent(val)}`)
          setSearchResults(Array.isArray(data) ? data : [])
        }
      } catch {}
      setSearching(false)
    }, 300)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    } else {
      startTyping()
    }
  }

  // ── Thread switch ─────────────────────────────────────────────
  const openThread = (id) => {
    setActive(id)
    setMessages([])
    setOtherTyping(false)
    navigate(`/chat/${id}`, { replace: true })
    setThreads(prev => prev.map(t => String(t.id) === String(id) ? { ...t, unread_count: 0 } : t))
  }

  // ── Buy stars ─────────────────────────────────────────────────
  const buyStarsWallet = async () => {
    if (!selectedPkg) return
    setBuying(true)
    try {
      await api.post('/wallet/stars/buy-wallet', { package_id: selectedPkg.id })
      const totalStars = selectedPkg.stars + selectedPkg.bonus_stars
      setStarsInfo(prev => prev ? {
        ...prev,
        wallet: { ...prev.wallet, balance: prev.wallet.balance + totalStars }
      } : prev)
      toast.success(`⭐ ${totalStars} stars added!`)
      setShowBuyStars(false)
      setSelectedPkg(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
    setBuying(false)
  }

  // ── Tick logic per message ─────────────────────────────────────
  // For my own messages:
  //   is_read=true → blue double tick
  //   receiver_online=true (from new_message event) OR is_read=false but delivered → grey double tick
  //   otherwise → single grey tick
  const getTickState = (msg) => {
    if (msg.sender_id !== user?.id) return null // not my message
    if (msg.is_read) return { sent: true, delivered: true, read: true }
    if (otherOnline)  return { sent: true, delivered: true, read: false }
    return { sent: true, delivered: false, read: false }
  }

  // ── Status text under name ─────────────────────────────────────
  const statusText = otherTyping
    ? 'typing...'
    : otherOnline
    ? 'online'
    : activeThread?.other_last_seen
    ? `last seen ${fmt(activeThread.other_last_seen, 'HH:mm')}`
    : 'offline'

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 page-enter">
      <div className="flex gap-4 h-[75vh]">

        {/* ── Thread list ── */}
        <div className={`${active ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 card overflow-hidden`}>

          {/* ── Suggestions row (IG-style) ── */}
          <div className="px-3 pt-3 pb-2 border-b border-dark-700">
            {/* Search input */}
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={suggestSearch}
                onChange={e => handleSuggestSearch(e.target.value)}
                placeholder={isClient ? 'Search escorts...' : 'Search clients...'}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
              />
              {searching && <Loader2 size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />}
            </div>

            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">
              {suggestSearch.trim()
                ? `Results for "${suggestSearch}"`
                : isClient ? 'All Escorts · Online First' : 'Your Clients · Online First'}
            </p>

            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {/* Client: show search results OR all escorts (online first) */}
              {isClient && (suggestSearch.trim() ? searchResults : suggestions).map(e => (
                <button key={e.uuid}
                  onClick={async () => {
                    try {
                      const { data } = await api.post(`/chat/thread/${e.uuid}`)
                      openThread(data.id)
                    } catch (err) {
                      if (err.response?.data?.error === 'insufficient_stars') {
                        setShowBuyStars(true)
                      } else {
                        toast.error(err.response?.data?.message || 'Failed to start chat')
                      }
                    }
                  }}
                  className="flex flex-col items-center gap-1 flex-shrink-0 group">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${e.is_online ? 'border-green-500' : 'border-dark-600'}`}>
                      {e.primary_photo
                        ? <img src={e.primary_photo} className="w-full h-full object-cover" alt={e.name} />
                        : <div className="w-full h-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-bold text-white">{(e.name?.[0] || '?').toUpperCase()}</div>}
                    </div>
                    {e.is_online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-dark-800 rounded-full" />}
                  </div>
                  <p className="text-[10px] text-gray-400 group-hover:text-white transition-colors w-12 truncate text-center flex items-center justify-center gap-0.5">
                    <span className="truncate">{e.name}</span>
                    {e.is_verified && <BadgeCheck size={10} className="text-blue-400 flex-shrink-0" />}
                  </p>
                </button>
              ))}

              {/* Escort: show search results OR all clients (online first) */}
              {!isClient && (suggestSearch.trim()
                ? searchResults
                : suggestions.length > 0
                  ? suggestions
                  : [...threads].sort((a, b) => (b._online ? 1 : 0) - (a._online ? 1 : 0))
              ).map(item => {
                // item is either a client from /chat/clients (has uuid) or a thread (has id + other_*)
                const isClientSuggestion = !!item.uuid && !item.other_name
                if (isClientSuggestion) {
                  return (
                    <button key={item.uuid}
                      onClick={async () => {
                        try {
                          const { data } = await api.post(`/chat/thread-client/${item.uuid}`)
                          openThread(data.id)
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Failed to start chat')
                        }
                      }}
                      className="flex flex-col items-center gap-1 flex-shrink-0 group">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${item.is_online ? 'border-green-500' : 'border-dark-600'}`}>
                          {item.profile_photo
                            ? <img src={item.profile_photo} className="w-full h-full object-cover" alt={item.name} />
                            : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white">{(item.name?.[0] || '?').toUpperCase()}</div>}
                        </div>
                        {item.is_online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-dark-800 rounded-full" />}
                      </div>
                      <p className="text-[10px] text-gray-400 group-hover:text-white transition-colors w-12 truncate text-center">{item.name}</p>
                    </button>
                  )
                }
                // thread fallback
                return (
                  <button key={item.id}
                    onClick={() => openThread(item.id)}
                    className="flex flex-col items-center gap-1 flex-shrink-0 group">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-colors ${
                        String(active) === String(item.id) ? 'border-brand-500' : item._online ? 'border-green-500' : 'border-dark-600'
                      }`}>
                        {item.other_photo
                          ? <img src={item.other_photo} className="w-full h-full object-cover" alt={item.other_name} />
                          : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white">{(item.other_name?.[0] || '?').toUpperCase()}</div>}
                      </div>
                      {item._online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-dark-800 rounded-full" />}
                      {item.unread_count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-600 text-white text-[9px] rounded-full flex items-center justify-center">{item.unread_count}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 group-hover:text-white transition-colors w-12 truncate text-center">{item.other_name}</p>
                  </button>
                )
              })}

              {/* Empty state */}
              {suggestSearch.trim() && !searching && searchResults.length === 0 && (
                <p className="text-xs text-gray-600 py-2">No results found</p>
              )}
            </div>
          </div>
          <div className="p-4 border-b border-dark-600 flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2 text-sm">
              <MessageCircle size={16} className="text-brand-400" /> Messages
            </h2>
            {isClient && starsInfo && (
              <button onClick={() => setShowBuyStars(true)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  isLocked
                    ? 'border-red-500/50 bg-red-500/10 text-red-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                }`}>
                <Star size={11} />
                {starsBalance}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm p-8 text-center">
                <div>
                  <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No conversations yet</p>
                  <p className="text-xs mt-1">Browse escorts to start a chat</p>
                </div>
              </div>
            ) : (
              threads.map(t => (
                <button key={t.id} onClick={() => openThread(t.id)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-dark-700 transition-colors text-left border-b border-dark-700 ${String(active) === String(t.id) ? 'bg-dark-700' : ''}`}>
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-dark-600 overflow-hidden">
                      {t.other_photo
                      ? <img src={t.other_photo} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white">{(t.other_name?.[0] || '?').toUpperCase()}</div>}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <OnlineDot online={t._online} />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-white truncate flex items-center gap-1">
                        <span className="truncate">{t.other_name || 'User'}</span>
                        {t.other_verified && <BadgeCheck size={13} className="text-blue-400 flex-shrink-0" />}
                      </p>
                      {t.unread_count > 0 ? (
                        <span className="flex-shrink-0 w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center ml-1">
                          {t.unread_count > 9 ? '9+' : t.unread_count}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {/* Show ticks for last message if I sent it */}
                      {t.last_sender_id === user?.id && (
                        <Ticks
                          sent={true}
                          delivered={t._online}
                          read={t.last_message_read}
                        />
                      )}
                      <p className="text-xs text-gray-500 truncate">{t.last_message || 'No messages yet'}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Message area ── */}
        {active ? (
          <div className="flex-1 flex flex-col card overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-dark-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => { setActive(null); navigate('/chat') }} className="md:hidden p-1 text-gray-400 hover:text-white">
                  <ArrowLeft size={18} />
                </button>
                <div
                  onClick={() => activeThread?.has_active_story && activeThread?.other_uuid && navigate(`/escort/${activeThread.other_uuid}#stories`)}
                  className={`relative flex-shrink-0 ${activeThread?.has_active_story ? 'cursor-pointer' : 'cursor-default'}`}>
                  {/* Story ring — only shows if escort has active story */}
                  <div className={`w-9 h-9 rounded-full overflow-hidden ${
                    activeThread?.has_active_story
                      ? 'ring-2 ring-offset-1 ring-offset-dark-800 ring-brand-500'
                      : ''
                  }`}>
                    {activeThread?.other_photo
                      ? <img src={activeThread.other_photo} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-bold text-white">{(activeThread?.other_name?.[0] || '?').toUpperCase()}</div>}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <OnlineDot online={otherOnline} />
                  </span>
                </div>
                <button
                  onClick={() => activeThread?.other_uuid && navigate(`/escort/${activeThread.other_uuid}`)}
                  className="text-left hover:opacity-80 transition-opacity">
                  <p className="font-medium text-white text-sm leading-tight flex items-center gap-1">
                    <span>{activeThread?.other_name || 'Conversation'}</span>
                    {activeThread?.other_verified && <BadgeCheck size={14} className="text-blue-400 flex-shrink-0" />}
                  </p>
                  <p className={`text-xs leading-tight transition-colors ${
                    otherTyping ? 'text-green-400' : otherOnline ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {statusText}
                  </p>
                </button>
              </div>
              {isClient && starsInfo && (
                <button onClick={() => setShowBuyStars(true)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    isLocked
                      ? 'border-red-500/50 bg-red-500/10 text-red-400 animate-pulse'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  }`}>
                  {isLocked ? <Lock size={11} /> : <Star size={11} />}
                  {starsBalance} stars
                  {!isLocked && <span className="text-gray-500">· {starsPerMsg}/msg</span>}
                </button>
              )}
            </div>

            {/* Messages */}
<div ref={messagesBoxRef} className="flex-1 overflow-y-auto p-4 space-y-1.5">
              {messages.map((msg, i) => {
                const isMine = msg.sender_id === user?.id
                const ticks  = getTickState(msg)
                const showTime = i === 0 || (
                  new Date(msg.created_at) - new Date(messages[i - 1]?.created_at) > 5 * 60 * 1000
                )
                return (
                  <div key={msg.id}>
                    {showTime && (
                      <div className="text-center my-2">
                        <span className="text-xs text-gray-600 bg-dark-800 px-2 py-0.5 rounded-full">
                          {fmt(msg.created_at, 'MMM d, HH:mm')}
                        </span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-brand-600 text-white rounded-br-md'
                          : 'bg-dark-700 text-gray-200 rounded-bl-md'
                      }`}>
                        <p className="leading-relaxed">{msg.message}</p>
                        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-xs ${isMine ? 'text-brand-300' : 'text-gray-500'}`}>
                            {fmt(msg.created_at, 'HH:mm')}
                          </span>
                          {isMine && isClient && msg.stars_cost > 0 && (
                            <span className="text-xs text-brand-300 opacity-70">· ⭐{msg.stars_cost}</span>
                          )}
                          {isMine && !isClient && msg.stars_earned > 0 && (
                            <span className="text-xs text-amber-400 opacity-70">· +⭐{msg.stars_earned}</span>
                          )}
                          {ticks && <Ticks {...ticks} />}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )
              })}

              {/* Typing animation */}
              <AnimatePresence>
                {otherTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="flex justify-start"
                  >
                    <div className="bg-dark-700 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-dark-600">
              {isLocked ? (
                <div className="flex items-center justify-between bg-dark-700/50 border border-red-500/30 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-red-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Out of stars</p>
                      <p className="text-xs text-gray-500">You need {starsPerMsg} stars to send a message</p>
                    </div>
                  </div>
                  <button onClick={() => setShowBuyStars(true)} className="btn-primary text-xs py-2 px-3 flex-shrink-0">
                    Buy Stars
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <textarea
                    rows={1}
                    className="input flex-1 resize-none py-2.5 text-sm"
                    placeholder={isClient ? `Type a message... (${starsPerMsg} ⭐)` : 'Type a message...'}
                    value={text}
                    onChange={e => { setText(e.target.value); if (active) startTyping() }}
                    onKeyDown={handleKey}
                    onBlur={stopTyping}
                  />
                  <button onClick={sendMessage} disabled={!text.trim() || sending}
                    className="w-10 h-10 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                    {sending ? <Loader2 size={15} className="animate-spin text-white" /> : <Send size={15} className="text-white" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center card text-gray-600">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-3 opacity-20" />
              <p>Select a conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* ===== BUY STARS POPUP ===== */}
      <AnimatePresence>
        {showBuyStars && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowBuyStars(false)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Star size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Buy Stars</h3>
                    <p className="text-xs text-gray-500">Each message costs {starsPerMsg} ⭐</p>
                  </div>
                </div>
                <button onClick={() => setShowBuyStars(false)} className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="bg-dark-700/50 rounded-xl p-3 mb-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">Your balance</span>
                <span className="font-mono font-bold text-white">⭐ {starsBalance}</span>
              </div>

              <div className="space-y-2 mb-4">
                {packages.map(p => (
                  <button key={p.id} onClick={() => setSelectedPkg(p)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      selectedPkg?.id === p.id
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-dark-600 hover:border-dark-400'
                    } ${p.is_popular ? 'border-amber-500/40' : ''}`}>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white text-sm">{p.name}</p>
                        {p.is_popular && <span className="text-xs bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-bold">Hot</span>}
                      </div>
                      <p className="text-amber-400 text-sm">⭐ {p.stars + p.bonus_stars}
                        {p.bonus_stars > 0 && <span className="text-xs text-green-400 ml-1">+{p.bonus_stars}</span>}
                        <span className="text-gray-500 text-xs ml-1">≈ {Math.floor((p.stars + p.bonus_stars) / starsPerMsg)} messages</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-white">KSh {p.price_kes}</p>
                      {selectedPkg?.id === p.id && <Check size={15} className="text-brand-400" />}
                    </div>
                  </button>
                ))}
              </div>

              {selectedPkg && (
                <>
                  <div className="flex gap-2 mb-4">
                    {['wallet', 'mpesa'].map(m => (
                      <button key={m} onClick={() => setBuyMethod(m)}
                        className={`flex-1 py-2 text-sm rounded-xl border transition-all ${
                          buyMethod === m ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-dark-600 text-gray-400'
                        }`}>
                        {m === 'wallet' ? '💳 Wallet' : '📱 M-Pesa'}
                      </button>
                    ))}
                  </div>
                  <button onClick={buyStarsWallet} disabled={buying} className="btn-primary w-full">
                    {buying ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                    {buyMethod === 'wallet' ? `Pay KSh ${selectedPkg.price_kes} from Wallet` : `Pay via M-Pesa`}
                  </button>
                </>
              )}

              {!selectedPkg && (
                <Link to="/wallet" className="btn-ghost w-full text-center text-sm" onClick={() => setShowBuyStars(false)}>
                  Manage Stars in Wallet →
                </Link>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
