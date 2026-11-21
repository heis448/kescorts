import { Link } from 'react-router-dom'
import { Star, ArrowRight } from 'lucide-react'
import EscortCard from '../escort/EscortCard'

// VIP (featured-tier) profiles: a swipeable row above the main feed.
export default function FeaturedRail({ items = [] }) {
  if (!items.length) return null
  return (
    <section className="mt-5" data-testid="featured-rail">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-white"><Star size={16} className="text-amber-400 fill-amber-400" /> Featured</h2>
        <Link to="/escorts" className="text-xs text-brand-400 flex items-center gap-1">See all <ArrowRight size={12} /></Link>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 pb-1">
        {items.map((e, i) => (
          <div key={e.uuid} className="w-[44vw] max-w-[184px] sm:w-44 flex-shrink-0 snap-start"><EscortCard escort={e} index={i} /></div>
        ))}
      </div>
    </section>
  )
}
