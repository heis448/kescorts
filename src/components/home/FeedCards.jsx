import { MapPin, Phone, ExternalLink } from 'lucide-react'
import api from '../../utils/api'
import CardSlider from '../ui/CardSlider'
import EscortCard from '../escort/EscortCard'

const FULL = 'col-span-2 sm:col-span-3 lg:col-span-4'
const mediaOf = (x) => (Array.isArray(x.media) ? x.media : []).filter(m => m?.url).map(m => ({ url: m.url, type: m.type || 'image' }))
const openUrl = (url) => { if (url) window.open(url, '_blank', 'noopener') }
const WaIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>

// A paid "Sponsored" profile card, shown inside the feed (full width, clearly labelled).
export function SponsoredCard({ s }) {
  const media = mediaOf(s)
  const wa = s.link_url?.includes('wa.me')
  return (
    <div onClick={() => { api.post(`/admin/sponsored/${s.id}/click`).catch(() => {}); openUrl(s.link_url) }}
      className={`${FULL} flex bg-dark-800 border border-amber-400/30 rounded-2xl overflow-hidden ${s.link_url ? 'cursor-pointer active:scale-[.99]' : ''} transition`} data-testid="sponsored-card">
      <div className="w-[42%] sm:w-52 flex-shrink-0 relative aspect-[3/4] sm:aspect-[4/3] overflow-hidden">
        {media.length
          ? <CardSlider items={media} className="w-full h-full" />
          : <div className="w-full h-full bg-gradient-to-br from-amber-900/30 to-dark-800 flex items-center justify-center text-3xl">👤</div>}
      </div>
      <div className="flex-1 min-w-0 p-3.5 flex flex-col">
        <span className="self-start text-[10px] font-bold uppercase tracking-wide bg-amber-400 text-black px-2 py-0.5 rounded-full mb-2">Sponsored</span>
        <p className="font-bold text-white leading-tight truncate">{s.name}</p>
        {s.location && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin size={11} />{s.location}</p>}
        {s.description && <p className="text-xs text-gray-300 mt-1.5 line-clamp-3">{s.description}</p>}
        <div className="mt-auto pt-3 flex flex-wrap gap-2">
          {s.link_url && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl ${wa ? 'bg-green-500 text-white' : 'bg-brand-600 text-white'}`}>
              {wa ? <><WaIcon /> WhatsApp</> : <>Visit <ExternalLink size={12} /></>}
            </span>
          )}
          {s.phone && (
            <a href={`tel:${s.phone}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-dark-600 text-white"><Phone size={12} /> Call</a>
          )}
        </div>
      </div>
    </div>
  )
}

// A banner ad inside the feed (full width, labelled "Ad").
export function AdCard({ ad }) {
  const media = mediaOf(ad)
  if (!media.length) return null
  return (
    <div onClick={() => { api.post(`/admin/ads/${ad.id}/click`).catch(() => {}); openUrl(ad.link_url) }}
      className={`${FULL} relative rounded-2xl overflow-hidden border border-dark-600 bg-dark-800 aspect-[16/8] ${ad.link_url ? 'cursor-pointer active:scale-[.99]' : ''} transition`} data-testid="ad-card">
      <CardSlider items={media} className="w-full h-full" />
      <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-black/75 text-white px-2 py-0.5 rounded-full pointer-events-none">Ad</span>
    </div>
  )
}

// Where things sit in the feed: a slot after the 6th profile, then after every 8 more.
// Slots alternate Sponsored ↔ Ad (using whichever type exists). Never after the very last profile.
export const FIRST_SLOT_AFTER = 6
export const SLOT_EVERY = 8

export function buildFeed(profiles, sponsored = [], ads = []) {
  const usableAds = ads.filter(a => mediaOf(a).length)
  const nodes = []
  let slot = 0, si = 0, ai = 0

  const pick = () => {
    const order = slot++ % 2 === 0 ? ['s', 'a'] : ['a', 's']
    for (const t of order) {
      if (t === 's' && sponsored.length) return { type: 's', item: sponsored[si++ % sponsored.length] }
      if (t === 'a' && usableAds.length) return { type: 'a', item: usableAds[ai++ % usableAds.length] }
    }
    return null
  }

  profiles.forEach((p, idx) => {
    nodes.push(<EscortCard key={p.uuid} escort={p} index={idx % 8} />)
    const n = idx + 1
    if (idx < profiles.length - 1 && n >= FIRST_SLOT_AFTER && (n - FIRST_SLOT_AFTER) % SLOT_EVERY === 0) {
      const got = pick()
      if (got?.type === 's') nodes.push(<SponsoredCard key={`s-${n}`} s={got.item} />)
      if (got?.type === 'a') nodes.push(<AdCard key={`a-${n}`} ad={got.item} />)
    }
  })
  return nodes
}
