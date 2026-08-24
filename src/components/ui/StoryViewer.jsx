import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Heart, Flame, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import useAuthStore from '../../store/authStore'

const STORY_DURATION = 5000 // 5 seconds per story
const EMOJIS = ['❤️', '🔥', '😍']

// ================================================================
// STORY RING — the circle avatar with colored ring
// ================================================================
export function StoryRing({ user, stories = [], size = 'md', onClick }) {
  const { user: currentUser } = useAuthStore()
  const hasUnseenStories = stories.some(s => !s.viewed)
  const hasStories = stories.length > 0

  const sizes = {
    sm: { outer: 'w-12 h-12', inner: 'w-10 h-10', ring: 2 },
    md: { outer: 'w-16 h-16', inner: 'w-14 h-14', ring: 2 },
    lg: { outer: 'w-20 h-20', inner: 'w-18 h-18', ring: 3 },
  }
  const s = sizes[size] || sizes.md

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group">
      <div className={`${s.outer} relative flex items-center justify-center`}>
        {/* Ring */}
        {hasStories && (
          <div className={`absolute inset-0 rounded-full ${
            hasUnseenStories
              ? 'bg-gradient-to-br from-brand-400 via-purple-500 to-pink-500'
              : 'bg-gray-600'
          }`} />
        )}
        {/* Avatar */}
        <div className={`${s.inner} rounded-full overflow-hidden border-2 border-dark-900 relative z-10`}>
          {user.avatar
            ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-dark-600 flex items-center justify-center text-gray-400 text-xs font-bold">
                {(user.name || 'U')[0]}
              </div>
          }
        </div>
        {/* Online dot */}
        {user.is_online && (
          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 border-2 border-dark-900 rounded-full z-20" />
        )}
      </div>
      <span className="text-xs text-gray-400 group-hover:text-white transition-colors text-center max-w-[60px] truncate">
        {user.name || 'Escort'}
      </span>
    </button>
  )
}

// ================================================================
// STORY VIEWER — fullscreen viewer
// ================================================================
export default function StoryViewer({ groups, startGroupIndex = 0, onClose }) {
  // groups: [{ user_id, name, avatar, stories: [...] }]
  const [groupIdx, setGroupIdx]   = useState(startGroupIndex)
  const [storyIdx, setStoryIdx]   = useState(0)
  const [paused, setPaused]       = useState(false)
  const [muted, setMuted]         = useState(true)
  const [progress, setProgress]   = useState(0)
  const [reacted, setReacted]     = useState(null)
  const progressRef               = useRef(null)
  const videoRef                  = useRef(null)
  const { user }                  = useAuthStore()

  const group  = groups[groupIdx]
  const story  = group?.stories[storyIdx]
  const isVideo = story?.type === 'video'
  const isYoutube = story?.url?.includes('youtube.com') || story?.url?.includes('youtu.be')

  // Record view
  useEffect(() => {
    if (story?.id && user) {
      api.post(`/stories/${story.id}/view`).catch(() => {})
    }
  }, [story?.id])

  // Progress bar timer
  useEffect(() => {
    if (paused || isVideo) return
    setProgress(0)
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) { clearInterval(interval); goNext() }
    }, 50)
    return () => clearInterval(interval)
  }, [storyIdx, groupIdx, paused])

  const goNext = () => {
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(s => s + 1)
      setProgress(0)
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(g => g + 1)
      setStoryIdx(0)
      setProgress(0)
    } else {
      onClose()
    }
  }

  const goPrev = () => {
    if (storyIdx > 0) {
      setStoryIdx(s => s - 1)
    } else if (groupIdx > 0) {
      setGroupIdx(g => g - 1)
      setStoryIdx(groups[groupIdx - 1].stories.length - 1)
    }
    setProgress(0)
  }

  const handleReact = async (emoji) => {
    if (!story) return
    setReacted(emoji)
    await api.post(`/stories/${story.id}/react`, { emoji }).catch(() => {})
    setTimeout(() => setReacted(null), 2000)
  }

  const handleVideoEnd = () => goNext()

  if (!group || !story) return null

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[100] flex items-center justify-center overflow-hidden" style={{ height: '100dvh' }}
    >
      <div className="relative w-full max-w-sm mx-auto flex flex-col" style={{ height: '100dvh' }}>

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                style={{
                  width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%'
                }}
                transition={{ duration: 0 }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-4 pt-2">
          <Link to={`/escort/${group.uuid}`} onClick={onClose} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/50">
              {group.avatar
                ? <img src={group.avatar} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-dark-600" />
              }
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{group.name}</p>
              <p className="text-white/60 text-xs">
                {story.created_at && formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {isVideo && (
              <button onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted }}
                className="p-1.5 bg-black/40 rounded-full">
                {muted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 bg-black/40 rounded-full">
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Story content */}
        <div
          className="flex-1 relative cursor-pointer"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {story.type === 'image' ? (
            <img src={story.url} alt="" className="w-full h-full object-cover" />
          ) : isYoutube ? (
            <iframe
              src={`https://www.youtube.com/embed/${story.url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]}?autoplay=1&mute=1&controls=0`}
              className="w-full h-full"
              allow="autoplay"
            />
          ) : (
            <video
              ref={videoRef}
              src={story.url}
              className="w-full h-full object-cover"
              autoPlay
              muted={muted}
              playsInline
              onEnded={handleVideoEnd}
              poster={story.thumbnail}
            />
          )}

          {/* Tap zones */}
          <div className="absolute inset-0 flex">
            <div className="w-1/3 h-full" onClick={goPrev} />
            <div className="w-1/3 h-full" />
            <div className="w-1/3 h-full" onClick={goNext} />
          </div>

          {/* Caption */}
          {story.caption && (
            <div className="absolute bottom-20 left-4 right-4">
              <p className="text-white text-sm bg-black/40 px-3 py-2 rounded-xl backdrop-blur-sm">
                {story.caption}
              </p>
            </div>
          )}
        </div>

        {/* Footer — reactions */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
          <div className="flex items-center justify-between">
            {/* Emoji reactions */}
            <div className="flex gap-3">
              {EMOJIS.map(emoji => (
                <motion.button
                  key={emoji}
                  whileTap={{ scale: 1.4 }}
                  onClick={() => handleReact(emoji)}
                  className="text-2xl hover:scale-125 transition-transform filter drop-shadow-lg"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
            {/* View count (escort's own stories) */}
            {user?.id === group.user_id && story.view_count > 0 && (
              <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full">
                <Eye size={13} className="text-white/70" />
                <span className="text-white text-xs">{story.view_count}</span>
              </div>
            )}
          </div>

          {/* Reaction animation */}
          <AnimatePresence>
            {reacted && (
              <motion.div
                initial={{ y: 0, opacity: 1, scale: 1 }}
                animate={{ y: -80, opacity: 0, scale: 2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute bottom-16 left-1/2 -translate-x-1/2 text-4xl pointer-events-none"
              >
                {reacted}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Group nav arrows */}
        {groupIdx > 0 && (
          <button onClick={() => { setGroupIdx(g => g - 1); setStoryIdx(0) }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/40 rounded-full">
            <ChevronLeft size={20} className="text-white" />
          </button>
        )}
        {groupIdx < groups.length - 1 && (
          <button onClick={() => { setGroupIdx(g => g + 1); setStoryIdx(0) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/40 rounded-full">
            <ChevronRight size={20} className="text-white" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
