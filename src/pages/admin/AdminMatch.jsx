import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Image, Eye, EyeOff, CheckCircle, X, Loader2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import BlueTick from '../../components/ui/BlueTick'

const EMPTY = {
  name:'', age:'', county:'', city:'', about:'', description:'',
  services:'', languages:'', availability:'', height:'', body_type:'',
  rate:'', phone:'', whatsapp:'', instagram:'', tiktok:'',
  is_verified: false, reveal_price_kes: 200, is_active: true
}

function ProfileForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY, ...initial,
    services: Array.isArray(initial?.services) ? initial.services.join(', ') : (initial?.services || ''),
    languages: Array.isArray(initial?.languages) ? initial.languages.join(', ') : (initial?.languages || ''),
  }))
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        services:  form.services.split(',').map(s => s.trim()).filter(Boolean),
        languages: form.languages.split(',').map(s => s.trim()).filter(Boolean),
        age: form.age ? parseInt(form.age) : null,
        rate: form.rate ? parseInt(form.rate) : null,
        reveal_price_kes: parseInt(form.reveal_price_kes) || 200,
      }
      await onSave(payload)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    }
    setSaving(false)
  }

  const inp = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500'

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-dark-800 border border-dark-600 rounded-2xl my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
          <p className="font-semibold text-white">{initial?.id ? 'Edit Profile' : 'New Profile'}</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          {/* Verification toggle */}
          <div className="flex items-center justify-between bg-dark-700 rounded-xl px-4 py-3 mb-2">
            <div className="flex items-center gap-2">
              <BlueTick size={16} />
              <div>
                <p className="text-sm text-white font-medium">Verified Profile</p>
                <p className="text-xs text-gray-500">Contact hidden behind payment</p>
              </div>
            </div>
            <button
              onClick={() => set('is_verified', !form.is_verified)}
              className={`w-11 h-6 rounded-full transition-colors ${form.is_verified ? 'bg-blue-500' : 'bg-dark-600'}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${form.is_verified ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Basic */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Name *</label>
              <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Display name" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Age</label>
              <input className={inp} type="number" value={form.age} onChange={e => set('age', e.target.value)} placeholder="25" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">County</label>
              <input className={inp} value={form.county} onChange={e => set('county', e.target.value)} placeholder="Nairobi" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">City</label>
              <input className={inp} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Westlands" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Height</label>
              <input className={inp} value={form.height} onChange={e => set('height', e.target.value)} placeholder="5'4&quot;" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Body Type</label>
              <input className={inp} value={form.body_type} onChange={e => set('body_type', e.target.value)} placeholder="Slim" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Availability</label>
              <input className={inp} value={form.availability} onChange={e => set('availability', e.target.value)} placeholder="Evenings & weekends" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Rate (KSh/hr)</label>
              <input className={inp} type="number" value={form.rate} onChange={e => set('rate', e.target.value)} placeholder="5000" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">About (tagline)</label>
            <input className={inp} value={form.about} onChange={e => set('about', e.target.value)} placeholder="Fun, adventurous, loves dining out" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <textarea className={inp + ' h-20 resize-none'} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Full bio..." />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Services / Interests (comma separated)</label>
            <input className={inp} value={form.services} onChange={e => set('services', e.target.value)} placeholder="Dating, Travel companion, Dining" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Languages (comma separated)</label>
            <input className={inp} value={form.languages} onChange={e => set('languages', e.target.value)} placeholder="English, Swahili" />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Phone</label>
              <input className={inp} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0712345678" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">WhatsApp</label>
              <input className={inp} type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="0712345678" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Instagram</label>
              <input className={inp} value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="username" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">TikTok</label>
              <input className={inp} value={form.tiktok} onChange={e => set('tiktok', e.target.value)} placeholder="username" />
            </div>
          </div>

          {/* Reveal price */}
          {form.is_verified && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <label className="text-xs text-blue-400 mb-1 block">Reveal Price (KSh)</label>
              <input className={inp} type="number" value={form.reveal_price_kes} onChange={e => set('reveal_price_kes', e.target.value)} placeholder="200" />
              <p className="text-xs text-gray-500 mt-1">Stars equivalent auto-calculated from global rate</p>
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Profile Active</p>
            <button
              onClick={() => set('is_active', !form.is_active)}
              className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-dark-600'}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-dark-700 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1">
            {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MediaManager({ profile, onClose }) {
  const [media, setMedia]   = useState([])
  const [url, setUrl]       = useState('')
  const [type, setType]     = useState('image')
  const [isCover, setIsCover] = useState(false)
  const [adding, setAdding] = useState(false)

  const load = async () => {
    const { data } = await api.get(`/match/admin/profiles/${profile.id}`)
    setMedia(data.media || [])
  }

  useEffect(() => { load() }, [])

  const add = async () => {
    if (!url.trim()) { toast.error('Enter a URL'); return }
    setAdding(true)
    try {
      await api.post(`/match/admin/profiles/${profile.id}/media`, { url: url.trim(), media_type: type, is_cover: isCover })
      setUrl(''); setIsCover(false)
      await load()
      toast.success('Media added')
    } catch { toast.error('Failed') }
    setAdding(false)
  }

  const remove = async (id) => {
    if (!confirm('Delete this media?')) return
    await api.delete(`/match/admin/media/${id}`)
    await load()
    toast.success('Deleted')
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-dark-800 border border-dark-600 rounded-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
          <p className="font-semibold text-white">Media — {profile.name}</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Add form */}
          <div className="bg-dark-700 rounded-xl p-4 space-y-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Add Media</p>
            <input
              className="w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
              value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://files.catbox.moe/xxx.jpg"
            />
            <div className="flex items-center gap-3">
              <select
                value={type} onChange={e => setType(e.target.value)}
                className="bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={isCover} onChange={e => setIsCover(e.target.checked)} className="accent-brand-500" />
                Set as cover
              </label>
              <button onClick={add} disabled={adding} className="btn-primary ml-auto text-xs px-4 py-2">
                {adding ? <Loader2 size={12} className="animate-spin" /> : <><Upload size={12} /> Add</>}
              </button>
            </div>
          </div>

          {/* Media grid */}
          {media.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">No media yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {media.map(m => (
                <div key={m.id} className={`relative aspect-square rounded-xl overflow-hidden border-2 ${m.is_cover ? 'border-brand-500' : 'border-dark-600'}`}>
                  {m.media_type === 'video'
                    ? <video src={m.url} className="w-full h-full object-cover" muted />
                    : <img src={m.url} alt="" className="w-full h-full object-cover" />}
                  {m.is_cover && (
                    <span className="absolute top-1 left-1 bg-brand-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">Cover</span>
                  )}
                  <button
                    onClick={() => remove(m.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/90 flex items-center justify-center text-white hover:bg-red-400"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminMatch() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [mediaFor, setMediaFor] = useState(null)

  const load = async () => {
    try {
      const { data } = await api.get('/match/admin/profiles')
      setProfiles(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async (payload) => {
    if (editing?.id) {
      await api.put(`/match/admin/profiles/${editing.id}`, payload)
      toast.success('Updated')
    } else {
      await api.post('/match/admin/profiles', payload)
      toast.success('Created')
    }
    await load()
  }

  const del = async (id) => {
    if (!confirm('Delete this profile and all its media?')) return
    await api.delete(`/match/admin/profiles/${id}`)
    toast.success('Deleted')
    await load()
  }

  const toggleActive = async (p) => {
    await api.put(`/match/admin/profiles/${p.id}`, { ...p, is_active: !p.is_active })
    await load()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-white">Find Your Match</h1>
          <p className="text-sm text-gray-500 mt-0.5">{profiles.length} profiles</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Profile
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-500" /></div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Image size={32} className="mx-auto mb-3 opacity-30" />
          <p>No profiles yet. Add one!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {profiles.map(p => (
            <div key={p.id} className="card flex items-center gap-4 p-4">
              {/* Cover */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-dark-700 flex-shrink-0">
                {p.cover_photo
                  ? <img src={p.cover_photo} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Image size={20} className="text-gray-600" /></div>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-white truncate">{p.name}</p>
                  {p.is_verified && <BlueTick size={14} />}
                  {!p.is_active && <span className="text-xs text-gray-600 bg-dark-700 px-2 py-0.5 rounded-full">Inactive</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {[p.city, p.county].filter(Boolean).join(', ') || 'No location'}
                  {p.is_verified && ` · KSh ${p.reveal_price_kes?.toLocaleString()} reveal`}
                  {p.reveal_count > 0 && ` · ${p.reveal_count} reveals`}
                </p>
                <p className="text-xs text-gray-600">{p.media_count || 0} media files</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setMediaFor(p)} className="icon-btn" title="Manage media">
                  <Image size={15} />
                </button>
                <button onClick={() => toggleActive(p)} className="icon-btn" title={p.is_active ? 'Deactivate' : 'Activate'}>
                  {p.is_active ? <Eye size={15} className="text-green-400" /> : <EyeOff size={15} className="text-gray-500" />}
                </button>
                <button onClick={() => { setEditing(p); setShowForm(true) }} className="icon-btn">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => del(p.id)} className="icon-btn text-red-400 hover:text-red-300">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProfileForm
          initial={editing}
          onSave={save}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {mediaFor && (
        <MediaManager
          profile={mediaFor}
          onClose={() => { setMediaFor(null); load() }}
        />
      )}
    </div>
  )
}
