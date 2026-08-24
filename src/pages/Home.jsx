import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, ArrowRight, Star, Shield, Zap, BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react'
import api from "../utils/api"
import { getSocket } from '../utils/socket'
import StoryViewer, { StoryRing } from "../components/ui/StoryViewer"
import LazyImage from '../components/ui/LazyImage'
import CardSlider from '../components/ui/CardSlider'
import EscortCard from '../components/escort/EscortCard'

const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Machakos','Nyeri','Meru','Kisii','Malindi','Lamu']

// ── Announcements Grid (3-col square cards, page through sets of 3) ─
function AnnouncementsSection({ announcements }) {
  const [page, setPage] = useState(0)
  const [dir, setDir]   = useState(1)
  const timerRef        = useRef(null)

  const perPage   = 3
  const totalPages = Math.ceil(announcements.length / perPage)

  const go = (next) => {
    const np = (next + totalPages) % totalPages
    setDir(next > page ? 1 : -1)
    setPage(np)
  }

  useEffect(() => {
    if (totalPages <= 1) return
    timerRef.current = setInterval(() => {
      setDir(1)
      setPage(p => (p + 1) % totalPages)
    }, 10000)
    return () => clearInterval(timerRef.current)
  }, [totalPages])

  if (!announcements.length) return null

  const pageItems = announcements.slice(page * perPage, page * perPage + perPage)

  const variants = {
    enter:  (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  return (
    <section className="max-w-7xl mx-auto px-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Announcements</h2>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button onClick={() => go(page - 1)}
              className="w-6 h-6 rounded-full bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ChevronLeft size={13} />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => go(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === page ? 'w-5 bg-brand-500' : 'w-1.5 bg-dark-600'}`} />
              ))}
            </div>
            <button onClick={() => go(page + 1)}
              className="w-6 h-6 rounded-full bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={page}
            custom={dir}
            variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="grid grid-cols-3 gap-3"
          >
            {pageItems.map((a) => {
              const media = Array.isArray(a.media) && a.media.length > 0 ? a.media[0] : null
              return (
                <div key={a.id}
                  className="relative rounded-2xl overflow-hidden border border-brand-600/30 bg-brand-600/5 flex flex-col"
                  style={{ aspectRatio: '1/1' }}>
                  {/* Square media */}
                  {media ? (
                    <div className="absolute inset-0">
                      {media.type === 'video'
                        ? <video src={media.url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                        : <LazyImage src={media.url} alt={a.title} className="w-full h-full" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 to-dark-800" />
                  )}
                  {/* Text overlay */}
                  <div className="relative mt-auto p-3">
                    <span className="text-[10px] font-bold text-brand-300 uppercase tracking-widest">{a.type || 'Notice'}</span>
                    <p className="text-sm font-bold text-white leading-snug line-clamp-2 mt-0.5">{a.title}</p>
                    {!media && <p className="text-xs text-gray-300 mt-1 line-clamp-2">{a.body}</p>}
                  </div>
                </div>
              )
            })}
            {/* Fill empty slots to keep grid shape */}
            {pageItems.length < perPage && Array.from({ length: perPage - pageItems.length }).map((_, i) => (
              <div key={`empty-${i}`} className="rounded-2xl bg-dark-800/30 border border-dark-700/30" style={{ aspectRatio: '1/1' }} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}


// ── Ads Grid (3-col square cards, page through sets of 3) ──────
function LeaderboardAds({ ads }) {
  const [page, setPage] = useState(0)
  const [dir, setDir]   = useState(1)
  const timerRef        = useRef(null)

  const perPage    = 3
  const totalPages = Math.ceil(ads.length / perPage)

  const goAd = (next) => {
    const np = (next + totalPages) % totalPages
    setDir(next > page ? 1 : -1)
    setPage(np)
  }

  useEffect(() => {
    if (totalPages <= 1) return
    timerRef.current = setInterval(() => {
      setDir(1)
      setPage(p => (p + 1) % totalPages)
    }, 10000)
    return () => clearInterval(timerRef.current)
  }, [totalPages])

  if (!ads.length) return null

  const pageItems = ads.slice(page * perPage, page * perPage + perPage)

  const variants = {
    enter:  (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  return (
    <section className="max-w-7xl mx-auto px-4 mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sponsored</h2>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button onClick={() => goAd(page - 1)}
              className="w-6 h-6 rounded-full bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ChevronLeft size={13} />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => goAd(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === page ? 'w-5 bg-white' : 'w-1.5 bg-dark-600'}`} />
              ))}
            </div>
            <button onClick={() => goAd(page + 1)}
              className="w-6 h-6 rounded-full bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={page}
            custom={dir}
            variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="grid grid-cols-3 gap-3"
          >
            {pageItems.map((ad) => {
              const media = Array.isArray(ad.media) && ad.media.length > 0 ? ad.media[0] : null
              return (
                <div key={ad.id}
                  onClick={() => {
                    api.post(`/admin/ads/${ad.id}/click`).catch(() => {})
                    if (ad.link_url) window.open(ad.link_url, '_blank')
                  }}
                  className={`relative rounded-2xl overflow-hidden border border-dark-600 bg-dark-800 block group ${ad.link_url ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{ aspectRatio: '1/1' }}>
                  {Array.isArray(ad.media) && ad.media.filter(m=>m?.url).length > 0 ? (
                    <div className="absolute inset-0">
                      <CardSlider
                        items={ad.media.filter(m=>m?.url).map(m=>({url:m.url,type:m.type||'image'}))}
                        className="w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
                      <p className="text-white font-semibold text-sm text-center px-3">{ad.title}</p>
                    </div>
                  )}
                  <div className="relative mt-auto p-3 absolute bottom-0 left-0 right-0">
                    <p className="text-sm font-bold text-white line-clamp-2 leading-snug drop-shadow">{ad.title}</p>
                    <span className="text-[10px] text-gray-300 mt-0.5 block">Sponsored</span>
                  </div>
                </div>
              )
            })}
            {pageItems.length < perPage && Array.from({ length: perPage - pageItems.length }).map((_, i) => (
              <div key={`empty-${i}`} className="rounded-2xl bg-dark-800/30 border border-dark-700/30" style={{ aspectRatio: '1/1' }} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}


// ── Main Component ──────────────────────────────────────────────
class HomeErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: false } }
  static getDerivedStateFromError() { return { error: true } }
  render() {
    if (this.state.error) return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Something went wrong loading the page</p>
          <button onClick={() => window.location.reload()} className="btn-primary text-sm">Reload</button>
        </div>
      </div>
    )
    return this.props.children
  }
}

function HomeContent() {
  const [featured, setFeatured]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [online, setOnline]               = useState([])
  const [ads, setAds]                     = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [stories, setStories]             = useState([])
  const [activeStory, setActiveStory]     = useState(null)
  const [homeBlogPosts, setHomeBlogPosts] = useState([])
  const [search, setSearch]               = useState('')
  const [sponsored, setSponsored]         = useState([])
  const navigate = useNavigate()

  const fetchAll = () => {
    api.get('/search?limit=20').then(r => { setFeatured(Array.isArray(r.data) ? r.data : []); setLoading(false) }).catch(() => setLoading(false))
    api.get('/search/online').then(r => setOnline(Array.isArray(r.data) ? r.data : [])).catch(() => {})
    api.get('/search/ads').then(r => setAds(Array.isArray(r.data) ? r.data : [])).catch(() => {})
    api.get('/stories').then(r => setStories(Array.isArray(r.data) ? r.data : [])).catch(() => {})
    api.get('/admin/announcements').then(r => setAnnouncements(Array.isArray(r.data) ? r.data : [])).catch(() => {})
    api.get('/blog?limit=8').then(r => setHomeBlogPosts(r.data?.posts || r.data || [])).catch(() => {})
    api.get('/admin/sponsored').then(r => {
      const active = Array.isArray(r.data) ? r.data.filter(s => s.is_active) : []
      setSponsored(active)
      // Track impressions
      active.forEach(s => api.post(`/admin/sponsored/${s.id}/impression`).catch(() => {}))
    }).catch(() => {})
  }

  useEffect(() => {
    fetchAll()
    // Auto-refresh every 60s
    const interval = setInterval(fetchAll, 60000)
    return () => clearInterval(interval)
  }, [])

  // Live update when admin posts new content
  useEffect(() => {
    try {
      const socket = getSocket()
      if (!socket) return
      const onUpdate = ({ type }) => {
        if (type === 'announcement') api.get('/admin/announcements').then(r => setAnnouncements(Array.isArray(r.data) ? r.data : [])).catch(() => {})
        if (type === 'ads')          api.get('/search/ads').then(r => setAds(Array.isArray(r.data) ? r.data : [])).catch(() => {})
        if (type === 'sponsored')    api.get('/admin/sponsored').then(r => setSponsored(Array.isArray(r.data) ? r.data.filter(s => s.is_active) : [])).catch(() => {})
      }
      socket.on('content_updated', onUpdate)
      return () => socket.off('content_updated', onUpdate)
    } catch (e) {
      console.warn('[Home] socket not available:', e.message)
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/escorts?q=${search}`)
  }

  return (
    <div className="page-enter">

      {/* Announcements shown after hero */}

      {/* 2. Hero */}
      <section className="relative flex items-center overflow-hidden py-6 sm:py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-brand-950" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-64 h-64 bg-brand-900/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-brand-800/15 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-2 text-center w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-block badge bg-brand-600/20 text-brand-400 border border-brand-600/30 mb-4 text-xs px-3 py-1">
              🇰🇪 Kenya's #1
            </span>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white mb-2 leading-tight">
              Find Premium <span className="text-brand-500">Escorts</span> in Kenya
            </h1>
            <p className="text-gray-400 text-xs max-w-sm mx-auto mb-4">
              Verified profiles across Nairobi, Mombasa, Kisumu and beyond.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" placeholder="Search escorts, location..."
                  className="input pl-9 h-10 text-sm rounded-xl" value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary h-10 px-5 rounded-xl text-sm">Search</button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* 3. Stories Row */}
      {stories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Stories</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {stories.map((group, i) => (
              <StoryRing key={group.user_id}
                user={{ name: group.name, avatar: group.avatar, is_online: group.is_online }}
                stories={group.stories} size="md"
                onClick={() => setActiveStory(i)} />
            ))}
          </div>
        </div>
      )}

      {/* 3b. Announcements */}
      <AnnouncementsSection announcements={announcements} />

      {/* 4. Browse by Location */}
      <section className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Browse by Location</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {COUNTIES.map((c, i) => (
            <motion.div key={c} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/escorts?county=${c}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-dark-800 hover:bg-brand-600 border border-dark-600 hover:border-brand-500 rounded-full text-sm text-gray-400 hover:text-white transition-all duration-200">
                <MapPin size={12} />{c}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. Online Now */}
      {online.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <h2 className="section-title">Online Now</h2>
              <span className="text-xs text-green-400 font-medium">({online.length})</span>
            </div>
            <Link to="/escorts?online=true" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {online.map(e => (
              <Link key={e.uuid} to={`/escort/${e.uuid}`}
                className="flex-shrink-0 flex flex-col items-center gap-2 group">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-green-500">
                  {e.primary_photo
                    ? <img src={e.primary_photo} alt={e.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-dark-600" />}
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-dark-900 rounded-full" />
                </div>
                <span className="text-xs text-white font-medium group-hover:text-brand-300 transition-colors text-center max-w-[60px] truncate">
                  {e.name || ''}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. Homepage Ads */}
      <LeaderboardAds ads={ads} />

      {/* Sponsored Escorts */}
      {sponsored.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 rounded-full">Sponsored</span>
            <h2 className="text-sm font-semibold text-white">Featured Profiles</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sponsored.map(s => {
              const media = Array.isArray(s.media) && s.media.length > 0 ? s.media[0] : null
              return (
                <div key={s.id}
                  onClick={() => { api.post(`/admin/sponsored/${s.id}/click`).catch(() => {}); if (s.link_url) window.open(s.link_url, '_blank') }}
                  className={`bg-dark-800 border border-dark-700 hover:border-amber-500/40 rounded-2xl overflow-hidden transition-all group ${s.link_url ? 'cursor-pointer' : ''}`}>
                  <div className="aspect-[3/4] overflow-hidden relative">
                    {Array.isArray(s.media) && s.media.filter(m => m?.url).length > 0
                      ? <CardSlider
                          items={s.media.filter(m => m?.url).map(m => ({ url: m.url, type: m.type || 'image' }))}
                          className="w-full h-full"
                        />
                      : <div className="w-full h-full bg-gradient-to-br from-amber-900/30 to-dark-800 flex items-center justify-center">
                          <span className="text-amber-400 text-3xl">👤</span>
                        </div>
                    }
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="text-[9px] font-bold text-amber-400 bg-black/60 px-1.5 py-0.5 rounded-full">AD</span>
                      {s.link_url?.includes('wa.me') && (
                        <span className="text-[9px] font-bold text-green-400 bg-black/60 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.555 4.103 1.523 5.824L.057 23.882l6.227-1.635A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.9 9.9 0 01-5.031-1.372l-.361-.214-3.742.982.999-3.648-.236-.374A9.866 9.866 0 012.105 12C2.105 6.533 6.533 2.105 12 2.105S21.895 6.533 21.895 12 17.467 21.894 12 21.894z"/></svg>
                          WhatsApp
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-white text-sm">{s.name}</p>
                    {s.location && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin size={10} />{s.location}</p>}
                    {s.description && <p className="text-xs text-gray-300 mt-1 line-clamp-2">{s.description}</p>}
                    {s.phone && (
                      <a href={`tel:${s.phone}`} onClick={e => e.stopPropagation()}
                        className="mt-2 flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300">
                        📞 {s.phone}
                      </a>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
                      <span>👁 {s.impressions || 0} views</span>
                      <span>🖱 {s.clicks || 0} clicks</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 6b. Featured Escorts */}
      <section className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Featured Escorts</h2>
          <Link to="/escorts" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_,i) => (
              <div key={i} className="rounded-2xl bg-dark-800 border border-dark-700 overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-dark-700" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-dark-600 rounded w-2/3" />
                  <div className="h-3 bg-dark-600 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <p className="text-sm">No escorts listed yet</p>
            <Link to="/register" className="btn-primary mt-4 inline-flex mx-auto text-sm">Join as Escort</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((e, i) => <EscortCard key={e.uuid} escort={e} index={i} />)}
          </div>
        )}
      </section>


      {/* 8. Latest Blog Posts */}
      {homeBlogPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Latest Posts</h2>
              <p className="text-xs text-gray-500 mt-0.5">Stories, tips & updates from our escorts</p>
            </div>
            <Link to="/blog" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {homeBlogPosts.map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`}
                className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden hover:border-brand-600/40 transition-all group">
                {post.cover_url ? (
                  <img src={post.cover_url} alt={post.title} className="w-full h-36 object-cover group-hover:opacity-90 transition-opacity" />
                ) : (
                  <div className="w-full h-36 bg-dark-700 flex items-center justify-center">
                    <BookOpen size={24} className="text-gray-600" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-semibold text-white line-clamp-2 group-hover:text-brand-300 transition-colors">{post.title}</p>
                  {post.author_name && <p className="text-[10px] text-gray-600 mt-0.5">by {post.author_name}</p>}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-600">
                    <span>❤️ {post.like_count || 0}</span>
                    <span>💬 {post.comment_count || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 9. Why Kenya Escorts */}
      <section className="bg-dark-800/50 border-y border-dark-700 py-12 mt-10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="section-title text-center mb-8">Why Kenya Escorts?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Verified Profiles',  desc: 'All VIP profiles are photo-verified for your safety.' },
              { icon: Zap,    title: 'Instant Chat',       desc: 'Message escorts directly via real-time chat.' },
              { icon: Star,   title: 'Premium Listings',   desc: 'VIP escorts get premium placement and more visibility.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-10 h-10 bg-brand-600/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon size={18} className="text-brand-400" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story viewer */}
      {activeStory !== null && stories.length > 0 && (
        <StoryViewer groups={stories} startGroupIndex={activeStory} onClose={() => setActiveStory(null)} />
      )}
    </div>
  )
}

export default function Home() {
  return <HomeErrorBoundary><HomeContent /></HomeErrorBoundary>
}
