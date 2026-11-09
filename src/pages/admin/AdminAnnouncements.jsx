import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Save, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../utils/api'
import MediaUploader from '../../components/ui/MediaUploader'
import MediaGallery from '../../components/ui/MediaGallery'
import toast from 'react-hot-toast'

const EMPTY = { title: '', body: '', type: 'announcement', is_active: true, autoplay: true }
const TYPES = ['announcement', 'blog', 'news']
const TYPE_COLOR = {
  announcement: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  blog:         'text-blue-400 bg-blue-500/10 border-blue-500/20',
  news:         'text-green-400 bg-green-500/10 border-green-500/20'
}

export default function AdminAnnouncements() {
  const [items, setItems]     = useState([])
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [mediaItems, setMediaItems] = useState([])
  const [saving, setSaving]   = useState(false)
  const [mediaMap, setMediaMap] = useState({}) // id -> media[]

  const fetchAll = () => {
    api.get('/admin/announcements').then(r => {
      setItems(r.data)
      // Fetch media for each
      r.data.forEach(a => {
        api.get(`/media/announcement/${a.id}`).then(m => {
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
    setForm({ title: a.title, body: a.body, type: a.type, is_active: a.is_active, autoplay: a.autoplay ?? true })
    setMediaItems(mediaMap[a.id] || [])
    setModal(true)
  }

  const save = async () => {
    if (!form.title || !form.body) return toast.error('Title and body required')
    setSaving(true)
    try {
      let saved
      if (editing) {
        const { data } = await api.put(`/admin/announcements/${editing.id}`, form)
        saved = data
        setItems(i => i.map(x => x.id === editing.id ? data : x))
        toast.success('Updated')
      } else {
        const { data } = await api.post('/admin/announcements', form)
        saved = data
        setItems(i => [data, ...i])
        toast.success('Published')
      }

      // Save media
      if (mediaItems.length > 0) {
        await api.post('/media/save', { ref_type: 'announcement', ref_id: saved.id, items: mediaItems })
        setMediaMap(prev => ({ ...prev, [saved.id]: mediaItems }))
      }

      setModal(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    }
    setSaving(false)
  }

  const deleteItem = async (id) => {
    if (!confirm('Delete this announcement?')) return
    await api.delete(`/admin/announcements/${id}`)
    setItems(i => i.filter(x => x.id !== id))
    toast.success('Deleted')
  }

  const toggleActive = async (item) => {
    const { data } = await api.put(`/admin/announcements/${item.id}`, { ...item, is_active: !item.is_active })
    setItems(i => i.map(x => x.id === item.id ? data : x))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">Site announcements, blog posts and news</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> New Post</button>
      </div>

      <div className="space-y-3">
        {items.map(a => (
          <div key={a.id} className="bg-dark-800 border border-dark-600 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border capitalize ${TYPE_COLOR[a.type]}`}>{a.type}</span>
                  {!a.is_active && <span className="text-xs px-2.5 py-0.5 rounded-full bg-dark-600 text-gray-500 border border-dark-500">Draft</span>}
                  <span className="text-xs text-gray-600">{format(new Date(a.created_at), 'dd MMM yyyy')}</span>
                  {mediaMap[a.id]?.length > 0 && (
                    <span className="text-xs text-gray-500">{mediaMap[a.id].length} media</span>
                  )}
                </div>
                <h3 className="font-semibold text-white mb-1">{a.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">{a.body}</p>
                {/* Media preview */}
                {mediaMap[a.id]?.length > 0 && (
                  <MediaGallery items={mediaMap[a.id]} className="max-w-xs" />
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleActive(a)} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                  {a.is_active ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => openEdit(a)} className="p-1.5 text-gray-500 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => deleteItem(a.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-16 text-gray-600"><p>No announcements yet</p></div>}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-lg bg-dark-800 border border-dark-500 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-white text-xl">{editing ? 'Edit Post' : 'New Post'}</h3>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Title</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Post title" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Type</label>
                <div className="flex gap-2">
                  {TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2 rounded-xl text-xs capitalize border transition-all ${
                        form.type === t ? 'bg-brand-600 border-brand-500 text-white' : 'border-dark-500 text-gray-500 hover:text-white'
                      }`}>{t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Content</label>
                <textarea className="input resize-none min-h-[120px]" value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Write your announcement here..." />
              </div>

              {/* Media */}
              <MediaUploader
                items={mediaItems}
                onChange={setMediaItems}
                label="Images & Videos"
                maxImages={20}
                maxVideos={20}
              />

              {/* Autoplay toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.autoplay} onChange={e => setForm({ ...form, autoplay: e.target.checked })} className="accent-brand-500" />
                <span className="text-sm text-gray-400">Autoplay videos (muted)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="accent-brand-500" />
                <span className="text-sm text-gray-400">Publish immediately</span>
              </label>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
