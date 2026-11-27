import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Zap, MessageCircle, BookOpen } from 'lucide-react'
import api from '../utils/api'
import { reportError } from '../utils/reportError'
import { getSocket } from '../utils/socket'
import useAuthStore from '../store/authStore'
import StoryViewer from '../components/ui/StoryViewer'
import LazyImage from '../components/ui/LazyImage'
import Seo from '../components/Seo'
import { SkeletonGrid } from '../components/ui/Skeleton'
import PullToRefresh from '../components/ui/PullToRefresh'
import { SITE } from '../utils/site'
import StoriesRow from '../components/home/StoriesRow'
import AnnouncementBar from '../components/home/AnnouncementBar'
import HomeSearch from '../components/home/HomeSearch'
import FeaturedRail from '../components/home/FeaturedRail'
import SponsoredRail from '../components/home/SponsoredRail'
import { buildFeed } from '../components/home/FeedCards'

const PAGE = 20
const arr = (x) => (Array.isArray(x) ? x : [])
const GRID = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'

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

// Only for first-time visitors: short, so profiles are still on the first screen.
function GuestHero() {
  return (
    <section className="max-w-7xl mx-auto px-4 pt-3">
      <div className="rounded-2xl bg-gradient-to-br from-brand-600/25 via-dark-800 to-dark-800 border border-brand-500/20 p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-lg sm:text-2xl leading-tight text-white">Verified escorts across Kenya</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Chat directly. Discreet, classy, premium.</p>
        </div>
        <div className="flex flex-col items-stretch gap-1.5 flex-shrink-0">
          <Link to="/register" className="btn-primary text-xs sm:text-sm py-2 px-4 text-center">Join free</Link>
          <Link to="/login" className="text-xs text-center text-gray-300 hover:text-white">Sign in</Link>
        </div>
      </div>
    </section>
  )
}

function WhyUs() {
  const items = [
    { icon: Shield,        title: 'Verified profiles', text: 'Real people, checked by our team.' },
    { icon: MessageCircle, title: 'Chat directly',     text: 'Message escorts privately, no middlemen.' },
    { icon: Zap,           title: 'Fast & discreet',   text: 'Simple, private, mobile-first.' },
  ]
  return (
    <section className="max-w-7xl mx-auto px-4 mt-10">
      <h2 className="text-base font-bold text-white mb-3">Why RedRoom254</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex sm:block items-center gap-3 rounded-2xl bg-dark-800 border border-dark-700 p-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0 sm:mb-3"><Icon size={18} className="text-brand-400" /></div>
            <div><p className="text-sm font-semibold text-white">{title}</p><p className="text-xs text-gray-400 mt-0.5">{text}</p></div>
          </div>
        ))}
      </div>
    </section>
  )
}

function HomeContent() {
  const { user } = useAuthStore()
  const [first, setFirst]               = useState([])
  const [extra, setExtra]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [hasMore, setHasMore]           = useState(true)
  const [online, setOnline]             = useState([])
  const [ads, setAds]                   = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [stories, setStories]           = useState([])
  const [activeStory, setActiveStory]   = useState(null)
  const [blog, setBlog]                 = useState([])
  const [sponsored, setSponsored]       = useState([])
  const seedRef = useRef(Math.random())   // new random order on every visit → every sponsor gets a fair turn at the front
  const pageRef = useRef(1), moreRef = useRef(true), busyRef = useRef(false), sentinel = useRef(null)

  // feed = true reloads the profile list from page 1 (pull-to-refresh / first load).
  // The 60-second background refresh skips it so the list never jumps while you scroll.
  const fetchAll = useCallback(({ feed = true } = {}) => {
    if (feed) {
      api.get(`/search?limit=${PAGE}`).then(r => {
        const d = arr(r.data)
        setFirst(d); setExtra([]); pageRef.current = 1
        moreRef.current = d.length >= PAGE; setHasMore(moreRef.current); setLoading(false)
      }).catch(e => { setLoading(false); reportError(e, 'Could not load escorts') })
    }
    api.get('/search/online').then(r => setOnline(arr(r.data))).catch(() => {})
    api.get('/search/ads').then(r => setAds(arr(r.data))).catch(() => {})
    api.get('/stories').then(r => setStories(arr(r.data))).catch(() => {})
    api.get('/admin/announcements').then(r => setAnnouncements(arr(r.data))).catch(() => {})
    api.get('/blog?limit=8').then(r => setBlog(r.data?.posts || r.data || [])).catch(() => {})
    api.get('/admin/sponsored').then(r => setSponsored(arr(r.data).filter(s => s.is_active))).catch(() => {})
  }, [])

  useEffect(() => {
    fetchAll({ feed: true })
    const t = setInterval(() => fetchAll({ feed: false }), 60000)
    return () => clearInterval(t)
  }, [fetchAll])

  // Live update when admin posts new content
  useEffect(() => {
    try {
      const socket = getSocket()
      if (!socket) return
      const onUpdate = ({ type }) => {
        if (type === 'announcement') api.get('/admin/announcements').then(r => setAnnouncements(arr(r.data))).catch(() => {})
        if (type === 'ads')          api.get('/search/ads').then(r => setAds(arr(r.data))).catch(() => {})
        if (type === 'sponsored')    api.get('/admin/sponsored').then(r => setSponsored(arr(r.data).filter(s => s.is_active))).catch(() => {})
      }
      socket.on('content_updated', onUpdate)
      return () => socket.off('content_updated', onUpdate)
    } catch (e) { console.warn('[Home] socket not available:', e.message) }
  }, [])

  // Endless feed: load the next page shortly before the bottom
  const loadMore = useCallback(async () => {
    if (busyRef.current || !moreRef.current) return
    busyRef.current = true; setLoadingMore(true)
    try {
      const next = pageRef.current + 1
      const r = await api.get(`/search?limit=${PAGE}&page=${next}`)
      const d = arr(r.data)
      setExtra(prev => [...prev, ...d]); pageRef.current = next
      moreRef.current = d.length >= PAGE; setHasMore(moreRef.current)
    } catch (e) { reportError(e, 'Could not load more profiles') }
    busyRef.current = false; setLoadingMore(false)
  }, [])

  useEffect(() => {
    const el = sentinel.current
    if (!el || loading || !hasMore || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && loadMore(), { rootMargin: '700px' })
    io.observe(el)
    return () => io.disconnect()
  }, [loading, hasMore, loadMore, first.length, extra.length])

  const all = useMemo(() => {
    const seen = new Set()
    return [...first, ...extra].filter(e => !seen.has(e.uuid) && seen.add(e.uuid))
  }, [first, extra])

  // VIP (featured-tier) profiles → the "Featured" row, as soon as there is one
  const tierFeatured = all.filter(e => e.position === 'featured')
  const rail = tierFeatured.slice(0, 10)
  // Big catalog: profiles in the Featured row are not repeated in Discover.
  // Small catalog: Discover shows EVERYONE (otherwise it would be left almost empty).
  const railIds = new Set(rail.map(e => e.uuid))
  const rest = all.length >= 12 ? all.filter(e => !railIds.has(e.uuid)) : all
  const shuffled = useMemo(() => {
    const h = (id) => { const x = Math.sin((Number(id) || 0) * 12.9898 + seedRef.current * 78.233) * 43758.5453; return x - Math.floor(x) }
    return [...sponsored].sort((a, b) => h(a.id) - h(b.id))
  }, [sponsored])
  const sponsoredRail = shuffled.slice(0, 15)                                        // everyone, swipeable
  const sponsoredFeed = shuffled.length > 3 ? shuffled.slice(3) : shuffled            // in-feed cards lead with different ones
  const feed = useMemo(() => buildFeed(rest, sponsoredFeed, ads), [rest.length, sponsoredFeed, ads]) // eslint-disable-line

  return (
    <PullToRefresh onRefresh={() => fetchAll({ feed: true })}>
      <div className="page-enter pb-6">
        <Seo
          title="RedRoom254 — Find Escorts in Nairobi, Mombasa, Kisumu & More"
          description="Browse escort profiles across Kenya. Filter by city, chat directly and find your match."
          path="/"
          jsonLd={{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'RedRoom254', url: SITE }}
        />

        {user ? <h1 className="sr-only">Escorts in Kenya</h1> : <GuestHero />}

        <StoriesRow stories={stories} online={online} onOpenStory={setActiveStory} />
        <AnnouncementBar announcements={announcements} />
        <HomeSearch />
        {user?.role === 'admin' && (
          <p className="max-w-7xl mx-auto px-4 mt-3 text-[11px] text-gray-500" data-testid="admin-feed-info">
            Admin view · profiles {all.length} · VIP in Featured row {rail.length}{rail.length === 0 ? ' (needs a VIP-tier escort with an active membership)' : ''} · boosted {all.filter(e => e.is_boosted).length} · active sponsored {sponsored.length} (all in the Sponsored row) · ads {ads.length} · announcements {announcements.length}
          </p>
        )}
        <FeaturedRail items={rail} />
        <SponsoredRail items={sponsoredRail} />

        {/* Discover: the main feed. Boosted profiles lead it; Sponsored cards and Ads sit between profiles */}
        <section className="max-w-7xl mx-auto px-4 mt-5">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-base font-bold text-white">Discover</h2>
            <Link to="/escorts" className="text-xs text-brand-400">See all</Link>
          </div>

          {loading ? (
            <SkeletonGrid count={8} className={GRID} />
          ) : feed.length === 0 ? (
            <div className="text-center py-14 text-gray-500">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">No profiles yet. Check back soon.</p>
            </div>
          ) : (
            <div className={GRID}>{feed}</div>
          )}

          <div ref={sentinel} className="h-8" />
          {loadingMore && <SkeletonGrid count={4} className={`${GRID} mt-1`} />}
          {!loading && !hasMore && rest.length > 0 && (
            <p className="text-center text-xs text-gray-600 py-6">You're all caught up · <Link to="/escorts" className="text-brand-400">Search with filters</Link></p>
          )}
        </section>

        {blog.length > 0 && (
          <section className="mt-8">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2"><BookOpen size={16} className="text-brand-400" /> From the blog</h2>
              <Link to="/blog" className="text-xs text-brand-400">All posts</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto snap-x no-scrollbar px-4 pb-1">
              {blog.map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="w-44 flex-shrink-0 snap-start bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden hover:border-brand-600/40 transition-all group">
                  {post.cover_url
                    ? <LazyImage src={post.cover_url} alt={post.title} className="w-full h-24" />
                    : <div className="w-full h-24 bg-dark-700 flex items-center justify-center"><BookOpen size={22} className="text-gray-600" /></div>}
                  <div className="p-3">
                    <p className="text-xs font-semibold text-white line-clamp-2 group-hover:text-brand-300 transition-colors">{post.title}</p>
                    <p className="text-[10px] text-gray-500 mt-1.5">❤️ {post.like_count || 0} · 💬 {post.comment_count || 0}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {!user && <WhyUs />}

        {activeStory !== null && stories.length > 0 && (
          <StoryViewer groups={stories} startGroupIndex={activeStory} onClose={() => setActiveStory(null)} />
        )}
      </div>
    </PullToRefresh>
  )
}

export default function Home() {
  return <HomeErrorBoundary><HomeContent /></HomeErrorBoundary>
}
