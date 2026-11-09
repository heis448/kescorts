import { useState, useEffect } from 'react'
import { Crown, Plus, Pencil, Trash2, X, Loader2, Save } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const EMPTY = { name:'', price_3d:'', price_7d:'', price_15d:'', price_30d:'', features:'', position:'bottom', max_photos:4 }

export default function AdminTiers() {
  const [tiers, setTiers]   = useState([])
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/tiers').then(r => setTiers(r.data)).catch(() => {})
  }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit   = (t) => {
    setEditing(t)
    setForm({ ...t, features: t.features?.join(', ') || '' })
    setModal(true)
  }

  const save = async () => {
    setSaving(true)
    const payload = {
      ...form,
      features:    form.features.split(',').map(s => s.trim()).filter(Boolean),
      price_3d:    Number(form.price_3d),
      price_7d:    Number(form.price_7d),
      price_15d:   Number(form.price_15d),
      price_30d:   Number(form.price_30d),
      max_photos:  Number(form.max_photos),
    }
    try {
      if (editing) {
        const { data } = await api.put(`/admin/tiers/${editing.id}`, payload)
        setTiers(t => t.map(x => x.id === editing.id ? data : x))
        toast.success('Tier updated')
      } else {
        const { data } = await api.post('/admin/tiers', payload)
        setTiers(t => [...t, data])
        toast.success('Tier created')
      }
      setModal(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    }
    setSaving(false)
  }

  const deleteTier = async (id) => {
    if (!confirm('Delete this tier?')) return
    await api.delete(`/admin/tiers/${id}`)
    setTiers(t => t.filter(x => x.id !== id))
    toast.success('Deleted')
  }

  const POSITION_LABELS = { bottom:'Bottom', middle:'Middle', top:'Top', featured:'Featured' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Membership Tiers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage plans and pricing</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> New Tier
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map(t => (
          <div key={t.id} className="bg-dark-800 border border-dark-600 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Crown size={18} className="text-amber-400 mb-2" />
                <h3 className="font-bold text-white">{t.name}</h3>
                <span className="text-xs text-gray-500 capitalize">{POSITION_LABELS[t.position]}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(t)} className="p-1.5 text-gray-500 hover:text-white hover:bg-dark-600 rounded-lg transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => deleteTier(t.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div className="space-y-1 text-xs mb-4">
              {[
                { label:'3 Days',  val: t.price_3d  },
                { label:'7 Days',  val: t.price_7d  },
                { label:'15 Days', val: t.price_15d },
                { label:'30 Days', val: t.price_30d },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-mono text-white">KSh {Number(val).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dark-600 pt-3 space-y-1">
              {t.features?.map(f => (
                <p key={f} className="text-xs text-gray-400">✓ {f}</p>
              ))}
              <p className="text-xs text-gray-500">Up to {t.max_photos} photos</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-md bg-dark-800 border border-dark-500 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-white text-xl">{editing ? 'Edit Tier' : 'New Tier'}</h3>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Name</label>
                  <input className="input" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="VIP" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Position</label>
                  <select className="input text-sm" value={form.position} onChange={e => setForm({...form,position:e.target.value})}>
                    <option value="bottom">Bottom</option>
                    <option value="middle">Middle</option>
                    <option value="top">Top</option>
                    <option value="featured">Featured</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { k:'price_3d',  label:'3 Days Price' },
                  { k:'price_7d',  label:'7 Days Price' },
                  { k:'price_15d', label:'15 Days Price' },
                  { k:'price_30d', label:'30 Days Price' },
                ].map(({ k, label }) => (
                  <div key={k}>
                    <label className="text-xs text-gray-500 mb-1 block">{label} (KSh)</label>
                    <input type="number" className="input" value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} placeholder="0" />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Max Photos</label>
                <input type="number" className="input" value={form.max_photos} onChange={e => setForm({...form,max_photos:e.target.value})} />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Features (comma separated)</label>
                <textarea className="input resize-none min-h-[70px]" value={form.features}
                  onChange={e => setForm({...form,features:e.target.value})}
                  placeholder="Top section listing, Up to 12 photos, Chat enabled" />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
