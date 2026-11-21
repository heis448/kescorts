import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { COUNTIES, cityPath } from '../../utils/cities'

// Sticky under the header: search + one-tap city chips (these links also help Google find every city page).
export default function HomeSearch() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  return (
    <div className="sticky top-16 z-30 bg-dark-900/90 backdrop-blur-xl border-b border-white/5 mt-3 py-2.5" data-testid="home-search">
      <div className="max-w-7xl mx-auto px-4 space-y-2">
        <form onSubmit={e => { e.preventDefault(); navigate(`/escorts?q=${encodeURIComponent(q)}`) }} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or area…" className="input pl-9 h-10 text-sm rounded-xl w-full" />
          </div>
          <Link to="/escorts" aria-label="Filters" className="h-10 px-3 rounded-xl bg-dark-700 border border-dark-600 flex items-center gap-1.5 text-sm text-gray-300 active:scale-95 transition">
            <SlidersHorizontal size={15} /><span className="hidden sm:inline">Filters</span>
          </Link>
        </form>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
          <Link to="/escorts?online=true" className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-green-500/15 border border-green-500/40 text-green-300 text-xs font-semibold">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />Online
          </Link>
          {COUNTIES.map(c => (
            <Link key={c} to={cityPath(c)} className="flex-shrink-0 px-3.5 py-1.5 rounded-full bg-dark-700 border border-dark-600 text-xs font-medium text-gray-200 active:scale-95 transition hover:border-brand-500/60">{c}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}
