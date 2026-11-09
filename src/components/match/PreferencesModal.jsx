import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, Sliders } from 'lucide-react'
import toast from 'react-hot-toast'

const COUNTIES = [
  'Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Malindi',
  'Nyeri','Machakos','Meru','Kilifi','Kitale','Garissa','Embu',
]

const INTERESTS = [
  'Dating','Companionship','Travel Buddy','Dining Out','Events',
  'Fitness','Photography','Music','Adventure','Beach',
]

const inp = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500'

export default function PreferencesModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    min_age:    initial?.min_age    || 18,
    max_age:    initial?.max_age    || 45,
    county:     initial?.county     || '',
    interests:  initial?.interests  || [],
    max_budget: initial?.max_budget || '',
  })
  const [saving, setSaving] = useState(false)

  const toggleInterest = (i) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(i)
        ? f.interests.filter(x => x !== i)
        : [...f.interests, i]
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      await onSave({
        ...form,
        min_age:    parseInt(form.min_age),
        max_age:    parseInt(form.max_age),
        max_budget: form.max_budget ? parseInt(form.max_budget) : null,
      })
      toast.success('Preferences saved!')
      onClose()
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-md bg-dark-800 border border-dark-600 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-brand-400" />
            <p className="font-semibold text-white">Your Preferences</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Age range */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-3 block">Age Range</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Min</label>
                <input
                  type="number" min={18} max={99}
                  className={inp} value={form.min_age}
                  onChange={e => setForm(f => ({ ...f, min_age: e.target.value }))}
                />
              </div>
              <span className="text-gray-600 mt-5">—</span>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Max</label>
                <input
                  type="number" min={18} max={99}
                  className={inp} value={form.max_age}
                  onChange={e => setForm(f => ({ ...f, max_age: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* County */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-3 block">Preferred Location</label>
            <select
              className={inp}
              value={form.county}
              onChange={e => setForm(f => ({ ...f, county: e.target.value }))}
            >
              <option value="">Anywhere in Kenya</option>
              {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Interests */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-3 block">
              Interests / Activities
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(i => (
                <button
                  key={i}
                  onClick={() => toggleInterest(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    form.interests.includes(i)
                      ? 'bg-brand-600/20 border-brand-500/50 text-brand-400'
                      : 'bg-dark-700 border-dark-600 text-gray-400 hover:text-white hover:border-dark-500'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-3 block">
              Max Budget (KSh/hr) — optional
            </label>
            <input
              type="number"
              className={inp}
              value={form.max_budget}
              onChange={e => setForm(f => ({ ...f, max_budget: e.target.value }))}
              placeholder="e.g. 5000"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-dark-700 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Find My Match
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
