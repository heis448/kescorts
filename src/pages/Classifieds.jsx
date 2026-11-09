import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MapPin, Phone, Loader2, X, Edit2, Trash2, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import api from '../utils/api'
import useAuthStore from '../store/authStore'
import MediaUploader from '../components/ui/MediaUploader'
import MediaGallery from '../components/ui/MediaGallery'
import toast from 'react-hot-toast'

const CATEGORIES = ['All', 'escorts', 'massage', 'clubs', 'party', 'hookup', 'sugar daddy', 'sugar mummy', 'vacancy']
const EMPTY_FORM = { title: '', body: '', category: 'escorts', location: '', phone: '' }

export default function Classifieds() {
  const [posts, setPosts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [category, setCategory] = useState('All')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [mediaItems, setMediaItems] = useState([])
  const [posting, setPosting]   = useState(false)
  const [mediaMap, setMediaMap] = useState({})
  const { user }                = useAuthStore()

  const fetchPosts = () => {
    const params = category !== 'All' ? `?category=${category}` : ''
    setLoading(true)
    api.get(`/classifieds${params}`).then(r => {
      setPosts(r.data)
      setLoading(false)
      // Fetch media for each post
      r.data.forEach(p => {
        if (p.media) {
          setMediaMap(prev => ({ ...prev, [p.id]: p.media }))
        }
      })
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchPosts() }, [category])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setMediaItems([])
    setModal(true)
  }

  const openEdit = (post) => {
    setEditing(post)
    setForm({ title: post.title, body: post.body, category: post.category, location: post.location || '', phone: post.phone || '' })
    setMediaItems(mediaMap[post.id] || [])
    setModal(true)
  }

  const handlePost = async () => {
    if (!form.title || !form.body) return toast.error('Title and description required')
    setPosting(true)
    try {
      let saved
      if (editing) {
        const { data } = await api.put(`/classifieds/${editing.id}`, form)
        saved = data
        toast.success('Post updated!')
      } else {
        const { data } = await api.post('/classifieds', form)
        saved = data
        toast.success('Posted!')
      }

      // Save media only if items were added
      if (mediaItems && mediaItems.length > 0) {
        try {
          await api.post('/media/save', { ref_type: 'classified', ref_id: saved.id, items: mediaItems })
          setMediaMap(prev => ({ ...prev, [saved.id]: mediaItems }))
        } catch {
          toast.error('Post saved but media upload failed. Edit post to retry.')
        }
      }

      setModal(false)
      fetchPosts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post')
    }
    setPosting(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return
    try {
      await api.delete(`/classifieds/${id}`)
      setPosts(p => p.filter(x => x.id !== id))
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">Classifieds</h1>
          <p className="text-gray-500 text-sm mt-1">Browse or post a classified ad</p>
        </div>
        {user && (
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Post Ad
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm border transition-all capitalize ${
              category === c
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'border-dark-500 text-gray-400 hover:border-brand-500 hover:text-white'
            }`}>{c}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="text-brand-500 animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <p>No classifieds found</p>
          {user && <button onClick={openCreate} className="btn-primary mt-4 mx-auto">Post the first one</button>}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p, i) => {
            const media = mediaMap[p.id] || p.media || []
            const isOwn = user?.id === p.user_id
            return (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-5"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white text-base">{p.title}</h3>
                    {p.is_featured && (
                      <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">Featured</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 bg-dark-600 text-gray-400 rounded-full capitalize">{p.category}</span>
                    {isOwn && (
                      <>
                        <button onClick={() => openEdit(p)} className="p-1.5 text-gray-500 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Media */}
                {media.length > 0 && (
                  <div className="mb-3">
                    <MediaGallery items={media} />
                  </div>
                )}

                <p className="text-sm text-gray-400 mb-3">{p.body}</p>

                <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                  {p.location && (
                    <span className="flex items-center gap-1"><MapPin size={11} /> {p.location}</span>
                  )}
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors">
                      <Phone size={11} /> {p.phone}
                    </a>
                  )}
                  <span>{format(new Date(p.created_at), 'dd MMM yyyy')}</span>
                  {p.author_name && <span className="text-gray-600">by {p.author_name}</span>}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Post / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setModal(false)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="relative w-full max-w-lg bg-dark-800 border border-dark-500 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-white text-xl">{editing ? 'Edit Post' : 'Post Classified'}</h3>
                <button onClick={() => setModal(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Title *</label>
                  <input className="input" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Description *</label>
                  <textarea className="input min-h-[80px] resize-none" placeholder="Describe your ad..."
                    value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Category</label>
                    <select className="input text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Location</label>
                    <input className="input" placeholder="e.g. Nairobi" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Phone (optional)</label>
                  <input className="input" placeholder="07XXXXXXXX" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>

                {/* Media */}
                <MediaUploader
                  items={mediaItems}
                  onChange={setMediaItems}
                  label="Images & Videos"
                  maxImages={5}
                  maxVideos={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button onClick={() => setModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                <button onClick={handlePost} disabled={posting} className="btn-primary flex-1 justify-center">
                  {posting ? <Loader2 size={16} className="animate-spin" /> : editing ? 'Update' : 'Post'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
