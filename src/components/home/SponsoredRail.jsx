import { MapPin, Phone, ExternalLink } from 'lucide-react'
import api from '../../utils/api'
import LazyImage from '../ui/LazyImage'
import { ExpandableMedia } from '../ui/MediaGallery'
import { mediaOf, openUrl, WaIcon, trackSponsored } from './FeedCards'
import { useImpression } from './useImpression'
import { telHref } from '../../utils/phone'
import ScrollRail from '../ui/ScrollRail'

// Every active sponsor, in a swipeable row. (One in-feed slot can only show one at a time; this shows them all.)
function SponsoredMini({ s }) {
  const media = mediaOf(s)
  const wa = s.link_url?.includes('wa.me')
  const seen = useImpression('sponsored', s.id)
  return (
    <div ref={seen} data-testid="sponsored-mini"
      onClick={() => { trackSponsored(s.id, wa ? 'whatsapp' : 'link'); openUrl(s.link_url) }}
      className={`w-[72vw] max-w-[270px] sm:w-64 flex-shrink-0 snap-start rounded-2xl overflow-hidden bg-dark-800 border border-amber-400/30 flex flex-col ${s.link_url ? 'cursor-pointer active:scale-[.98]' : ''} transition`}>
      <ExpandableMedia
        items={media}
        onOpen={() => trackSponsored(s.id, 'open')}
        footer={s.link_url ? (close) => (
          <button onClick={() => { close(); trackSponsored(s.id, wa ? 'whatsapp' : 'link'); openUrl(s.link_url) }}
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm ${wa ? 'bg-green-500' : 'bg-brand-600'}`}>
            {wa ? 'Chat on WhatsApp' : 'Visit'}
          </button>
        ) : undefined}
        className="relative aspect-[4/5] bg-dark-700">
        {media[0]
          ? <LazyImage src={media[0].url} alt={s.name} className="absolute inset-0 w-full h-full" />
          : <div className="absolute inset-0 flex items-center justify-center text-3xl bg-gradient-to-br from-amber-900/30 to-dark-800">👤</div>}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
        <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wide bg-amber-400 text-black px-2.5 py-1 rounded-full shadow-md shadow-black/50">Sponsored</span>
        <div className="absolute bottom-2.5 left-3 right-3">
          <p className="font-bold text-white leading-tight truncate">{s.name}</p>
          {s.location && <p className="text-[11px] text-gray-300 flex items-center gap-1 mt-0.5"><MapPin size={10} />{s.location}</p>}
        </div>
      </ExpandableMedia>
      <div className="p-3 flex flex-col gap-2.5 flex-1">
        {s.description && <p className="text-xs text-gray-300 line-clamp-2">{s.description}</p>}
        <div className="mt-auto flex gap-2">
          {s.link_url && (
            <span className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl ${wa ? 'bg-green-500 text-white' : 'bg-brand-600 text-white'}`}>
              {wa ? <><WaIcon /> WhatsApp</> : <>Visit <ExternalLink size={12} /></>}
            </span>
          )}
          {s.phone && (
            <a href={telHref(s.phone)} onClick={e => { e.stopPropagation(); trackSponsored(s.id, 'call') }} className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-dark-600 text-white"><Phone size={12} /></a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SponsoredRail({ items = [] }) {
  if (!items.length) return null
  return (
    <section className="mt-5" data-testid="sponsored-rail">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-white">Sponsored <span className="text-[10px] font-semibold text-amber-400 border border-amber-400/40 rounded-full px-2 py-0.5">{items.length}</span></h2>
        {items.length > 1 && <span className="text-[11px] text-gray-500 md:hidden">Swipe →</span>}
      </div>
      <ScrollRail className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 pb-1">
        {items.map(s => <SponsoredMini key={s.id} s={s} />)}
      </ScrollRail>
    </section>
  )
}
