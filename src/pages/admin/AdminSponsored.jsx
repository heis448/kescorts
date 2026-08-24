import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit2, X, Upload, Phone, MapPin, Link2, Eye, EyeOff, Image } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const EMPTY = { name: '', description: '', phone: '', location: '', services: '', link_url: '', is_active: true }

export default function AdminSponsored() {
  const [list, setList]           = useState([])
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [files, setFiles]         = useState([])
  const [previews, setPreviews]   = useState([])
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef              = useRef(null)

  const load = () => api.get('/admin/sponsored').then(r => setList(r.data || [])).catch(() => {})
  useEffect(() => { load() }, [])

  // Generate previews when files selected
  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach(u => URL.revokeObjectURL(u))
  }, [files])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setFiles([]); setPreviews([]); setModal(true) }
  const openEdit   = (s) => {
    setEditing(s)
    setForm({ ...s, services: Array.isArray(s.services) ? s.services.join(', ') : s.services || '' })
    setFiles([])
    setPreviews([])
    setModal(true)
  }

  const save = async () => {
    if (!form.name) return toast.error('Name required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        services: form.services ? form.services.split(',').map(s => s.trim()).filter(Boolean) : null
      }
      let saved
      if (editing) {
        const { data } = await api.put(`/admin/sponsored/${editing.id}`, payload)
        saved = data
      } else {
        const { data } = await api.post('/admin/sponsored', payload)
        saved = data
      }

      if (files.length > 0) {
        setUploading(true)
        for (const file of files) {
          const fd = new FormData()
          fd.append('file', file)
          await api.post(`/admin/sponsored/${saved.id}/media`, fd).catch(err => {
            console.error('Media upload failed:', err.message)
          })
        }
        setUploading(false)
      }

      toast.success(editing ? 'Updated!' : 'Created!')
      setModal(false)
      setFiles([])
      setPreviews([])
      // Reload after everything is saved
      await load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
    setSaving(false)
  }

  const deleteMedia = async (sponsoredId, mediaId) => {
    await api.delete(`/admin/sponsored/${sponsoredId}/media/${mediaId}`).catch(() => {})
    load()
  }

  const toggleActive = async (s) => {
    await api.put(`/admin/sponsored/${s.id}`, { ...s, is_active: !s.is_active })
    load()
  }

  const del = async (id) => {
    if (!confirm('Delete this sponsored profile?')) return
    await api.delete(`/admin/sponsored/${id}`)
    load()
    toast.success('Deleted')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sponsored Profiles</h1>
          <p className="text-xs text-gray-500 mt-0.5">Admin-posted escort ads shown on homepage</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={15} /> Add Profile
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card p-12 text-center text-gray-600">
          <Image size={40} className="mx-auto mb-3 opacity-30" />
          <p>No sponsored profiles yet</p>
          <button onClick={openCreate} className="btn-primary mt-4 text-sm mx-auto">Add First Profile</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(s => {
            const mediaList = Array.isArray(s.media) ? s.media.filter(m => m && m.url) : []
            const cover = mediaList[0] || null
            return (
              <div key={s.id} className={`card overflow-hidden ${!s.is_active ? 'opacity-50' : ''}`}>
                {/* Cover photo */}
                <div className="aspect-video relative overflow-hidden bg-dark-700">
                  {cover
                    ? cover.type === 'video'
                      ? <video src={cover.url} className="w-full h-full object-cover" muted />
                      : <img src={cover.url} alt={s.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-1">
                        <Image size={28} className="opacity-40" />
                        <p className="text-xs">No photos</p>
                      </div>
                  }
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => toggleActive(s)} className="p-1.5 bg-dark-900/80 rounded-lg text-gray-400 hover:text-white">
                      {s.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button onClick={() => openEdit(s)} className="p-1.5 bg-dark-900/80 rounded-lg text-gray-400 hover:text-white">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => del(s.id)} className="p-1.5 bg-dark-900/80 rounded-lg text-red-400 hover:text-red-300">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {mediaList.length > 1 && (
                    <span className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                      +{mediaList.length - 1} more
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-3">
                  <p className="font-semibold text-white text-sm">{s.name}</p>
                  {s.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{s.location}</p>}
                  {s.phone && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone size={10} />{s.phone}</p>}
                  {s.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>}

                  {/* Media strip */}
                  {mediaList.length > 0 && (
                    <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                      {mediaList.map((m, i) => (
                        <div key={m.id || i} className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-dark-600 group">
                          {m.type === 'video'
                            ? <video src={m.url} className="w-full h-full object-cover" muted />
                            : <img src={m.url} className="w-full h-full object-cover" alt="" />}
                          <button
                            onClick={() => deleteMedia(s.id, m.id)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <X size={12} className="text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                    <span>👁 {s.impressions || 0}</span>
                    <span>🖱 {s.clicks || 0}</span>
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${s.is_active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'}`}>
                      {s.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">{editing ? 'Edit Profile' : 'New Sponsored Profile'}</h3>
                <button onClick={() => setModal(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Name *</label>
                  <input className="input w-full" placeholder="e.g. Brenda wa Nairobi" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                    <input className="input w-full" placeholder="0712345678" value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Location</label>
                    <input className="input w-full" placeholder="Nairobi CBD" value={form.location}
                      onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Description</label>
                  <textarea className="input w-full resize-none" rows={3}
                    placeholder="Short bio or ad copy..." value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Services (comma separated)</label>
                  <input className="input w-full" placeholder="GFE, Massage, Outcalls" value={form.services}
                    onChange={e => setForm(p => ({ ...p, services: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Link2 size={10} /> WhatsApp / Link URL</label>
                  <input className="input w-full" placeholder="https://wa.me/254712345678" value={form.link_url}
                    onChange={e => setForm(p => ({ ...p, link_url: e.target.value }))} />
                </div>

                {/* File upload with preview */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Upload size={10} /> Photos / Videos</label>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-dark-500 hover:border-brand-500 rounded-xl p-4 text-center transition-colors">
                    <Upload size={20} className="mx-auto text-gray-500 mb-1" />
                    <p className="text-xs text-gray-400">Click to select photos or videos</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">Multiple files allowed</p>
                  </button>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,video/*"
                    onChange={e => setFiles(Array.from(e.target.files))}
                    className="hidden" />

                  {/* Preview grid */}
                  {previews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {previews.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-dark-700">
                          {files[i]?.type.startsWith('video/')
                            ? <video src={url} className="w-full h-full object-cover" muted />
                            : <img src={url} className="w-full h-full object-cover" alt="" />}
                          <button onClick={() => {
                            setFiles(prev => prev.filter((_, idx) => idx !== i))
                          }} className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 rounded-full flex items-center justify-center">
                            <X size={10} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Existing media when editing */}
                {editing && Array.isArray(editing.media) && editing.media.filter(m => m?.url).length > 0 && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Current Media</label>
                    <div className="grid grid-cols-4 gap-2">
                      {editing.media.filter(m => m?.url).map((m, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-dark-700 group">
                          {m.type === 'video'
                            ? <video src={m.url} className="w-full h-full object-cover" muted />
                            : <img src={m.url} className="w-full h-full object-cover" alt="" />}
                          <button onClick={() => deleteMedia(editing.id, m.id)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-brand-600' : 'bg-dark-600'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-xs text-gray-400">Show on homepage</span>
                </div>
              </div>

              <button onClick={save} disabled={saving || uploading} className="btn-primary w-full mt-5 justify-center">
                {uploading ? `Uploading ${files.length} file(s)...` : saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Profile'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
