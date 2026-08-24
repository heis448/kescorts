import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Machakos','Nyeri','Meru','Kisii']
const SERVICES = ['GFE','BJ','Massage','3 Some','Dinner Date','Travel Companion','Rimming','Outcalls','Incalls']

export default function SearchFilters({ filters, onChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const update = (key, val) => onChange({ ...filters, [key]: val })
  const clear   = () => onChange({})

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-2xl p-4 space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name, location..."
          className="input pl-9"
          value={filters.q || ''}
          onChange={e => update('q', e.target.value)}
        />
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        {COUNTIES.map(c => (
          <button
            key={c}
            onClick={() => update('county', filters.county === c ? '' : c)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filters.county === c
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'border-dark-500 text-gray-400 hover:border-brand-500 hover:text-white'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <SlidersHorizontal size={14} />
        {showAdvanced ? 'Hide' : 'Advanced'} Filters
      </button>

      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t border-dark-600">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Gender</label>
              <select className="input text-sm py-2" value={filters.gender || ''} onChange={e => update('gender', e.target.value)}>
                <option value="">Any</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="transgender">Transgender</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nationality</label>
              <select className="input text-sm py-2" value={filters.nationality || ''} onChange={e => update('nationality', e.target.value)}>
                <option value="">Any</option>
                <option value="Kenyan">Kenyan</option>
                <option value="Ugandan">Ugandan</option>
                <option value="Tanzanian">Tanzanian</option>
                <option value="Ethiopian">Ethiopian</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Min Rate (KSh/hr)</label>
              <input type="number" className="input text-sm py-2" placeholder="0" value={filters.min_rate || ''} onChange={e => update('min_rate', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Max Rate (KSh/hr)</label>
              <input type="number" className="input text-sm py-2" placeholder="Any" value={filters.max_rate || ''} onChange={e => update('max_rate', e.target.value)} />
            </div>
          </div>

          {/* Online only */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => update('online', !filters.online)}
              className={`w-10 h-5 rounded-full transition-colors relative ${filters.online ? 'bg-brand-600' : 'bg-dark-500'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${filters.online ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-400">Online now only</span>
          </label>

          {/* Services */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Services</label>
            <div className="flex flex-wrap gap-1.5">
              {SERVICES.map(s => (
                <button key={s}
                  onClick={() => {
                    const cur = filters.services ? filters.services.split(',') : []
                    const upd = cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]
                    update('services', upd.join(','))
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    filters.services?.includes(s)
                      ? 'bg-brand-600/30 border-brand-500 text-brand-300'
                      : 'border-dark-500 text-gray-500 hover:border-brand-600 hover:text-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button onClick={clear} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
            <X size={12} /> Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
