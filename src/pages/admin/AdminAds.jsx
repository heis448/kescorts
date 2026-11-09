import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, Save, Eye, MousePointer, ToggleLeft, ToggleRight } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../utils/api'
import MediaUploader from '../../components/ui/MediaUploader'
import MediaGallery from '../../components/ui/MediaGallery'
import toast from 'react-hot-toast'

const EMPTY = { title: '', link_url: '', placement: 'homepage', ends_at: '', is_active: true, autoplay: true }
const PLACEMENTS = ['sidebar', 'homepage', 'listing', 'footer']

export default function AdminAds() {
  const [ads, setAds]         = useState([])
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [mediaItems, setMediaItems] = useState([])
  const [saving, setSaving]   = useState(false)
  const [mediaMap, setMediaMap] = useState({})

  const fetchAll = () => {
    api.get('/admin/ads').then(r => {
      setAds(r.data)
      r.data.forEach(a => {
        api.get(`/media/ad/${a.id}`).then(m => {
          setMediaMap(prev => ({ ...prev, [a.id]: m.data }))
        }).catch(() => {})
      })
    }).catch(() => {})
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setMediaItems([])
    setModal(true)
  }

  const openEdit = (a) => {
    setEditing(a)
    setForm({
      title: a.title, link_url: a.link_url || '',
      placement: a.placement, ends_at: a.ends_at?.slice(0, 10) || '',
      is_active: a.is_active, autoplay: a.autoplay ?? true
    })
    setMediaItems(mediaMap[a.id] || [])
    setModal(true)
  }

  const save = async () => {
    if (!form.title) return toast.error('Title required')
    setSaving(true)
    try {
      let saved
      if (editing) {
        const { data } = await api.put(`/admin/ads/${editing.id}`, form)
        saved = data
        setAds(a => a.map(x => x.id === editing.id ? data : x))
        toast.success('Ad updated')
      } else {
        const { data } = await api.post('/admin/ads', form)
        saved = data
        setAds(a => [data, ...a])
        toast.success('Ad created')
      }

      // Save media
      if (mediaItems.length > 0) {
        await api.post('/media/save', { ref_type: 'ad', ref_id: saved.id, items: mediaItems })
        setMediaMap(prev => ({ ...prev, [saved.id]: mediaItems }))
      }

      setModal(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    }
    setSaving(false)
  }

  const deleteAd = async (id) => {
    if (!confirm('Delete this ad?')) return
    await api.delete(`/admin/ads/${id}`)
    setAds(a => a.filter(x => x.id !== id))
    toast.success('Deleted')
  }

  const toggleActive = async (ad) => {
    await api.put(`/admin/ads/${ad.id}`, { ...ad, is_active: !ad.is_active })
    setAds(a => a.map(x => x.id === ad.id ? { ...x, is_active: !x.is_active } : x))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Advertisements</h1>
          <p className="text-gray-500 text-sm mt-1">Manage banner ads across the site</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> New Ad</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.map(ad => (
          <div key={ad.id} className="bg-dark-800 border border-dark-600 rounded-2xl overflow-hidden">
            {/* Media preview */}
            {mediaMap[ad.id]?.length > 0 ? (
              <MediaGallery items={mediaMap[ad.id]} className="rounded-none" />
            ) : (
              <div className="w-full h-36 bg-dark-700 flex items-center justify-center text-gray-600 text-sm">No media</div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-white text-sm">{ad.title}</p>
                <button onClick={() => toggleActive(ad)} className="flex-shrink-0">
                  {ad.is_active ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} className="text-gray-500" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-xs px-2 py-0.5 bg-dark-600 text-gray-400 rounded-full capitalize">{ad.placement}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${ad.is_active ? 'bg-green-500/10 text-green-400' : 'bg-dark-600 text-gray-500'}`}>
                  {ad.is_active ? 'Active' : 'Inactive'}
                </span>
                {mediaMap[ad.id]?.length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-dark-600 text-gray-400 rounded-full">{mediaMap[ad.id].length} media</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Eye size={11} /> {ad.impressions} views</span>
                <span className="flex items-center gap-1"><MousePointer size={11} /> {ad.clicks} clicks</span>
              </div>
              {ad.ends_at && <p className="text-xs text-gray-600 mb-3">Expires: {format(new Date(ad.ends_at), 'dd MMM yyyy')}</p>}
              <div className="flex gap-2">
                <button onClick={() => openEdit(ad)} className="btn-ghost text-xs py-1.5 px-3 flex-1 justify-center">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => deleteAd(ad.id)} className="text-xs py-1.5 px-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {ads.length === 0 && <div className="col-span-full text-center py-16 text-gray-600"><p>No ads yet</p></div>}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-lg bg-dark-800 border border-dark-500 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-white text-xl">{editing ? 'Edit Ad' : 'New Ad'}</h3>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Title</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ad title" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Link URL (optional)</label>
                <input className="input" value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Placement</label>
                  <select className="input text-sm" value={form.placement} onChange={e => setForm({ ...form, placement: e.target.value })}>
                    {PLACEMENTS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Expires</label>
                  <input type="date" className="input" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} />
                </div>
              </div>

              {/* Media */}
              <MediaUploader
                items={mediaItems}
                onChange={setMediaItems}
                label="Images & Videos"
                maxImages={5}
                maxVideos={2}
              />

              {/* Preview */}
              {mediaItems.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Preview</label>
                  <MediaGallery items={mediaItems} />
                </div>
              )}

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.autoplay} onChange={e => setForm({ ...form, autoplay: e.target.checked })} className="accent-brand-500" />
                  <span className="text-sm text-gray-400">Autoplay videos</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="accent-brand-500" />
                  <span className="text-sm text-gray-400">Active</span>
                </label>
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
