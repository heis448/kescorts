import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { Loader2, Grid3X3, List } from 'lucide-react'
import api from '../utils/api'
import EscortCard from '../components/escort/EscortCard'
import SearchFilters from '../components/escort/SearchFilters'
import ErrorState from '../components/ui/ErrorState'
import { SkeletonGrid } from '../components/ui/Skeleton'
import PullToRefresh from '../components/ui/PullToRefresh'
import Seo from '../components/Seo'
import { cityFromSlug, cityPath, COUNTIES } from '../utils/cities'
import { Link } from 'react-router-dom'
import { reportError } from '../utils/reportError'
import AdBanner from '../components/ads/AdBanner'

const AD_EVERY_PHONE = 6   // banner after every 6 profiles on phones (3 rows of 2)
const AD_EVERY_DESKTOP = 9 // …and after every 9 on desktop (3 rows of 3)

export default function Escorts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { city } = useParams()
  const navigate = useNavigate()
  const cityName = city ? cityFromSlug(city) : ''
  const [escorts, setEscorts]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [page, setPage]         = useState(1)
  const [hasMore, setHasMore]   = useState(true)
  const [view, setView]         = useState('grid')
  const [sidebarAds, setSidebarAds]   = useState([])
  const [listingAds, setListingAds]   = useState([])
  const [isLg, setIsLg] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const h = (e) => setIsLg(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  const adEvery = isLg ? AD_EVERY_DESKTOP : AD_EVERY_PHONE
  // On phones the sidebar ads are not shown in the sidebar, so they join the banners between profiles
  const inlineAds = isLg ? listingAds : [...listingAds, ...sidebarAds]

  const [filters, setFilters] = useState({
    county:      searchParams.get('county') || cityName,
    q:           searchParams.get('q') || '',
    gender:      '',
    nationality: '',
    min_rate:    '',
    max_rate:    '',
    online:      false,
    services:    '',
  })

  useEffect(() => {
    api.get('/search/ads?placement=sidebar').then(r => setSidebarAds(Array.isArray(r.data) ? r.data : [])).catch(() => {})
    api.get('/search/ads?placement=listing').then(r => setListingAds(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [])

  const fetchEscorts = useCallback(async (f = filters, p = 1) => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams()
      Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v) })
      params.set('page', p)
      params.set('limit', 20)
      const { data } = await api.get(`/search?${params}`)
      if (p === 1) setEscorts(data)
      else setEscorts(prev => [...prev, ...data])
      setHasMore(data.length === 20)
    } catch (e) {
      setError(true)
      reportError(e, 'Could not load escorts')
    }
    setLoading(false)
  }, [])

  // Sync filters from URL params when navigating from outside (e.g. browse by location)
  useEffect(() => {
    const newFilters = {
      county: searchParams.get('county') || cityName,
      q:      searchParams.get('q') || '',
    }
    setFilters(prev => {
      const changed = Object.keys(newFilters).some(k => newFilters[k] !== prev[k])
      return changed ? { ...prev, ...newFilters } : prev
    })
  }, [searchParams.toString(), cityName])

  useEffect(() => {
    setPage(1)
    fetchEscorts(filters, 1)
  }, [filters])

  const handleFiltersChange = (f) => {
    setFilters(f)
    const params = new URLSearchParams()
    Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v) })
    // Leaving a city landing page → continue on the general listing with the chosen filters
    if (city) navigate(`/escorts?${params}`)
    else setSearchParams(params)
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchEscorts(filters, next)
  }

  return (
    <PullToRefresh onRefresh={() => fetchEscorts(filters, 1)}>
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      <Seo
        title={cityName ? `Escorts in ${cityName} | RedRoom254` : 'Browse Escorts in Kenya | RedRoom254'}
        description={cityName
          ? `Browse verified escort profiles in ${cityName}, Kenya. See photos, rates and availability, and chat directly.`
          : 'Browse escort profiles across Kenya — Nairobi, Mombasa, Kisumu, Nakuru and more.'}
        path={cityName ? cityPath(cityName) : '/escorts'}
      />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">{cityName ? `Escorts in ${cityName}` : 'Escorts'}</h1>
          <p className="text-gray-500 text-sm mt-1">{escorts.length} profiles found</p>
        </div>
        <div className="flex gap-1 bg-dark-800 border border-dark-600 rounded-lg p-1">
          <button onClick={() => setView('grid')} className={`p-2 rounded-md transition-colors ${view==='grid' ? 'bg-dark-600 text-white' : 'text-gray-500 hover:text-white'}`}>
            <Grid3X3 size={16} />
          </button>
          <button onClick={() => setView('list')} className={`p-2 rounded-md transition-colors ${view==='list' ? 'bg-dark-600 text-white' : 'text-gray-500 hover:text-white'}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar — filters + sidebar ads */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <SearchFilters filters={filters} onChange={handleFiltersChange} />

            {/* Sidebar ads — desktop only (on phones they used to push the results ~400px down; phones get them between profiles instead) */}
            {sidebarAds.length > 0 && (
              <div className="hidden lg:block space-y-4">
                {sidebarAds.map(ad => <AdBanner key={ad.id} ad={ad} placement="sidebar" />)}
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="lg:col-span-3">
          {loading && escorts.length === 0 ? (
            <SkeletonGrid count={8} />
          ) : error && escorts.length === 0 ? (
            <ErrorState message="We couldn't load escorts." onRetry={() => fetchEscorts(filters, 1)} />
          ) : escorts.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">No escorts found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className={view === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 gap-4'
                : 'space-y-3'
              }>
                {escorts.map((e, i) => {
                  const items = [<EscortCard key={e.uuid} escort={e} index={i} />]
                  // A full-width, clearly labelled banner after every `adEvery` profiles (or at the end of a short list).
                  // Full width keeps the card rows aligned and makes it obvious it is an ad, not a profile.
                  const inject = inlineAds.length > 0 && ((i + 1) % adEvery === 0 || (i === escorts.length - 1 && escorts.length < adEvery))
                  if (inject) {
                    const ad = inlineAds[Math.max(0, Math.floor((i + 1) / adEvery) - 1) % inlineAds.length]
                    items.push(<AdBanner key={`ad-${i}`} ad={ad} placement="listing" className="col-span-2 sm:col-span-3" />)
                  }
                  return items
                })}
              </div>
              {hasMore && (
                <div className="text-center mt-10">
                  <button onClick={loadMore} disabled={loading} className="btn-ghost">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </PullToRefresh>
  )
}
