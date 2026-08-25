import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Phone, MessageCircle, Lock, Image, Sliders, Heart } from 'lucide-react'
import api from '../utils/api'
import useAuthStore from '../store/authStore'
import BlueTick from '../components/ui/BlueTick'
import PreferencesModal from '../components/match/PreferencesModal'

const PREF_KEY = 'match_guest_prefs'

const normalizePhone = (phone) => {
  let p = String(phone).replace(/[\s\-\+]/g, '')
  if (p.startsWith('0') && p.length === 10) return '254' + p.slice(1)
  if (p.length === 9 && (p.startsWith('7') || p.startsWith('1'))) return '254' + p
  return p
}

// Guest client-side scoring
const scoreProfile = (p, prefs) => {
  let score = 0
  if (prefs.county && p.county?.toLowerCase().includes(prefs.county.toLowerCase())) score += 40
  if (prefs.min_age && prefs.max_age && p.age >= prefs.min_age && p.age <= prefs.max_age) score += 25
  if (prefs.interests?.length && p.services) {
    prefs.interests.forEach(i => { if (p.services.includes(i)) score += 20 })
  }
  if (prefs.max_budget && p.rate && p.rate <= prefs.max_budget) score += 15
  return score
}

const TABS = [
  { key: 'for_you',  label: '🎯 For You' },
  { key: 'all',      label: 'All'         },
  { key: 'random',   label: 'Random'      },
  { key: 'verified', label: 'Verified'    },
]

function MatchCard({ profile }) {
  const { user } = useAuthStore()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden hover:border-brand-600/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-900/30"
    >
      <Link to={`/match/${profile.uuid}`} className="block relative aspect-[3/4] bg-dark-700 overflow-hidden group">
        {profile.cover_photo ? (
          <img src={profile.cover_photo} alt={profile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-700 to-dark-800">
            <Image size={32} className="text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent" />
        {profile.is_verified && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-dark-900/80 backdrop-blur-sm rounded-full px-2 py-0.5">
            <BlueTick size={13} />
            <span className="text-xs text-blue-400 font-medium">Verified</span>
          </div>
        )}
        {profile.media_count > 1 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-dark-900/70 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-gray-300">
            <Image size={10} /> {profile.media_count}
          </div>
        )}
        {profile.match_score > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-brand-600/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-white font-medium">
            <Heart size={9} fill="white" /> {profile.match_score}%
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display font-semibold text-white text-lg leading-tight">{profile.name}</h3>
            {profile.is_verified && <BlueTick size={16} />}
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
            <MapPin size={10} />
            <span>{profile.city || profile.county || 'Kenya'}</span>
            {profile.age && <span className="ml-1">• {profile.age} yrs</span>}
          </div>
        </div>
      </Link>

      <div className="p-3 space-y-3">
        {profile.about && <p className="text-xs text-gray-300 line-clamp-2">{profile.about}</p>}
        {!profile.is_verified ? (
          <div className="flex gap-2">
            <a
              href={`https://wa.me/${normalizePhone(profile.whatsapp || profile.phone || '')}?text=${encodeURIComponent(`Hi ${profile.name}, I found your profile on KenyanEscorts.`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs font-medium transition-colors border border-green-700/30"
            >
              <MessageCircle size={13} /> WhatsApp
            </a>
            <a href={`tel:${profile.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-300 text-xs font-medium transition-colors border border-dark-600">
              <Phone size={13} /> Call
            </a>
          </div>
        ) : (
          <Link to={`/match/${profile.uuid}`}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-colors border ${
              !user
                ? 'bg-dark-700 border-dark-600 text-gray-400 hover:border-blue-500/50 hover:text-blue-400'
                : 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20'
            }`}>
            <Lock size={12} />
            {!user ? 'Login to Reveal' : `Reveal Contact · ⭐${profile.reveal_price_stars}`}
          </Link>
        )}
      </div>
    </motion.div>
  )
}

export default function MatchPage() {
  const { user } = useAuthStore()
  const [tab, setTab]               = useState('for_you')
  const [q, setQ]                   = useState('')
  const [profiles, setProfiles]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(1)
  const [hasMore, setHasMore]       = useState(false)
  const [showPrefs, setShowPrefs]   = useState(false)
  const [prefs, setPrefs]           = useState(null)
  const searchTimer                 = useRef(null)

  // Load preferences on mount
  useEffect(() => {
    if (user) {
      api.get('/match/preferences').then(r => {
        if (r.data) { setPrefs(r.data); }
        else setShowPrefs(true) // first time — show form
      }).catch(() => {})
    } else {
      const stored = localStorage.getItem(PREF_KEY)
      if (stored) { try { setPrefs(JSON.parse(stored)) } catch {} }
      else setShowPrefs(true)
    }
  }, [user])

  const savePrefs = async (data) => {
    if (user) {
      await api.post('/match/preferences', data)
    } else {
      localStorage.setItem(PREF_KEY, JSON.stringify(data))
    }
    setPrefs(data)
    setPage(1)
    fetchProfiles(tab, q, 1, data)
  }

  const fetchProfiles = useCallback(async (currentTab, query, pg, currentPrefs) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: pg, limit: 20 })
      if (currentTab !== 'all' && currentTab !== 'for_you') params.set('type', currentTab)
      if (query.trim()) params.set('q', query.trim())

      if (currentTab === 'for_you' && user) {
        params.set('for_you', 'true')
      }

      const { data } = await api.get(`/match?${params}`)
      let list = Array.isArray(data) ? data : []

      // Guest For You — sort client-side
      if (currentTab === 'for_you' && !user && currentPrefs) {
        list = list
          .map(p => ({ ...p, match_score: scoreProfile(p, currentPrefs) }))
          .sort((a, b) => b.match_score - a.match_score)
      }

      if (pg === 1) setProfiles(list)
      else setProfiles(prev => [...prev, ...list])
      setHasMore(list.length === 20)
    } catch {}
    setLoading(false)
  }, [user])

  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchProfiles(tab, q, 1, prefs)
    }, q ? 300 : 0)
  }, [tab, q, prefs])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchProfiles(tab, q, next, prefs)
  }

  const hasPrefs = prefs && (prefs.county || prefs.min_age || prefs.interests?.length || prefs.max_budget)

  return (
    <div className="min-h-screen bg-dark-950 pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-b from-dark-800 to-dark-950 border-b border-dark-700 px-4 pt-8 pb-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between mb-1">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">
              Find Your <span className="text-brand-400">Match</span>
            </h1>
            <button
              onClick={() => setShowPrefs(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                hasPrefs
                  ? 'bg-brand-600/10 border-brand-500/30 text-brand-400 hover:bg-brand-600/20'
                  : 'bg-dark-700 border-dark-600 text-gray-400 hover:text-white'
              }`}
            >
              <Sliders size={13} />
              {hasPrefs ? 'My Preferences' : 'Set Preferences'}
            </button>
          </div>
          <p className="text-gray-400 text-sm mb-5">Browse verified and random partners across Kenya</p>

          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text" value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by name, city, county..."
              className="w-full bg-dark-700 border border-dark-600 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  tab === t.key
                    ? 'bg-brand-600 border-brand-500 text-white'
                    : 'bg-dark-700 border-dark-600 text-gray-400 hover:text-white hover:border-dark-500'
                }`}
              >
                {t.label}
                {t.key === 'verified' && <BlueTick size={12} className="ml-1.5 -mt-0.5" />}
              </button>
            ))}
          </div>

          {/* For You label */}
          {tab === 'for_you' && hasPrefs && (
            <p className="text-xs text-gray-500 mt-2">
              Sorted by compatibility · {prefs.county && `📍 ${prefs.county}`} {prefs.interests?.length > 0 && `· ${prefs.interests.slice(0,2).join(', ')}`}
            </p>
          )}
          {tab === 'for_you' && !hasPrefs && (
            <p className="text-xs text-brand-400 mt-2 cursor-pointer" onClick={() => setShowPrefs(true)}>
              ✨ Set your preferences to get personalized matches
            </p>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        {loading && profiles.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[3/4] bg-dark-700 rounded" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-dark-700 rounded w-2/3" />
                  <div className="h-3 bg-dark-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20 text-gray-500 space-y-3">
            <Heart size={32} className="mx-auto opacity-30" />
            <p>No profiles found</p>
            {tab === 'for_you' && (
              <button onClick={() => setShowPrefs(true)} className="btn-ghost text-sm">
                Adjust preferences
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {profiles.map(p => <MatchCard key={p.id} profile={p} />)}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button onClick={loadMore} disabled={loading} className="btn-ghost px-8">
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preferences modal */}
      <AnimatePresence>
        {showPrefs && (
          <PreferencesModal
            initial={prefs}
            onSave={savePrefs}
            onClose={() => setShowPrefs(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
