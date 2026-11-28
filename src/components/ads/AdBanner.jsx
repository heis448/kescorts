import api from '../../utils/api'
import CardSlider from '../ui/CardSlider'
import { useImpression } from '../home/useImpression'

export const adMedia = (ad) =>
  (Array.isArray(ad?.media) ? ad.media : []).filter(m => m?.url).map(m => ({ url: m.url, type: m.type || 'image' }))

// Recommended upload size + the box each placement shows. Images are shown IN FULL (never cropped):
// if the shape differs from the box, the spare space is filled with a blurred copy of the same picture.
export const AD_SIZES = {
  homepage: { label: 'Feed banner',        rec: '1200 × 600 px (2:1)',                       box: 'aspect-[2/1]' },
  listing:  { label: 'Between profiles',   rec: '1200 × 400 px (3:1)',                       box: 'aspect-[2/1] sm:aspect-[3/1]' },
  sidebar:  { label: 'Sidebar (desktop)',  rec: '600 × 300 px (2:1)',                        box: 'aspect-[2/1]' },
  footer:   { label: 'Footer strip',       rec: '728 × 90 px (8:1); phones show it ~3:1',    box: 'aspect-[32/10] sm:aspect-[728/90]' },
}

const AdChip = () => (
  <span className="absolute bottom-2 left-2 z-10 text-[10px] font-bold uppercase tracking-wide bg-black/75 text-white px-2 py-0.5 rounded-full pointer-events-none">Ad</span>
)

// One ad, anywhere. Counts a view when half of it is on screen, counts clicks, and opens the link in a new tab
// (an ad with no link is simply not clickable).
export default function AdBanner({ ad, placement, className = '', testId = 'ad' }) {
  const place = placement || ad.placement || 'homepage'
  const seen  = useImpression('ads', ad.id)
  const size  = AD_SIZES[place] || AD_SIZES.homepage
  let items = adMedia(ad)
  if (place === 'footer') items = items.filter(m => m.type !== 'video')   // no autoplaying video in the footer

  const href = ad.link_url || null
  const Wrap = href ? 'a' : 'div'
  const wrapProps = href
    ? { href, target: '_blank', rel: 'noopener noreferrer sponsored', onClick: () => { api.post(`/admin/ads/${ad.id}/click`).catch(() => {}) } }
    : {}

  if (!items.length) {
    // Text-only ads are fine in the narrow slots; in the feed / between profiles they would look like a hole
    if (place !== 'sidebar' && place !== 'footer') return null
    return (
      <Wrap ref={seen} {...wrapProps} data-testid={testId}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dark-600 bg-dark-800 text-xs text-gray-200 ${href ? 'hover:border-brand-500/50 transition-colors' : ''} ${className}`}>
        <span className="text-[10px] font-bold uppercase tracking-wide bg-black/75 text-white px-2 py-0.5 rounded-full flex-shrink-0">Ad</span>
        <span className="truncate">{ad.title}</span>
      </Wrap>
    )
  }

  const caption = place === 'sidebar' || place === 'listing'
  return (
    <Wrap ref={seen} {...wrapProps} data-testid={testId}
      className={`block rounded-2xl overflow-hidden border border-dark-600 bg-dark-800 ${href ? 'transition active:scale-[.99] hover:border-brand-500/40' : ''} ${className}`}>
      <div className={`relative ${size.box}`}>
        <CardSlider items={items} fit="contain" alt={ad.title} className="w-full h-full" />
        <AdChip />
      </div>
      {caption && <p className="px-3 py-2 text-xs font-semibold text-white truncate">{ad.title}</p>}
    </Wrap>
  )
}
