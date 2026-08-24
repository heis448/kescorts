import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications.jsx'
import {
  User, Camera, Save, Crown, Wallet, Eye, Phone,
  ToggleLeft, ToggleRight, Loader2, Menu, X,
  MessageCircle, LogOut, LayoutDashboard, Bot,
  Star, TrendingUp, Heart, BookOpen, Plus, Edit2,
  Trash2, Globe, Lock, Image as ImageIcon, Link2, Upload, Shield, CheckCircle, Bell
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns'
import useAuthStore from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'

const SERVICES = ['GFE','BJ','Raw BJ','Rimming','3 Some','Anal','Massage','Dinner Date','Travel Companion','Lesbian Show','COB','CIM']
const COUNTIES  = ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Machakos','Nyeri','Meru']

const ESCORT_NAV = [
  { id: 'overview',       label: 'Overview',       icon: LayoutDashboard },
  { id: 'notifications',  label: 'Notifications',  icon: Bell },
  { id: 'profile',        label: 'My Profile',     icon: User },
  { id: 'photos',         label: 'Photos',         icon: Camera },
  { id: 'blog',           label: 'My Blog',        icon: BookOpen },
  { id: 'stories',        label: 'My Stories',     icon: ImageIcon },
  { id: 'membership',     label: 'Membership',     icon: Crown,         href: '/membership' },
  { id: 'wallet',         label: 'Wallet',         icon: Wallet,        href: '/wallet' },
  { id: 'chat',           label: 'Messages',       icon: MessageCircle, href: '/chat' },
  { id: 'ai',             label: 'AI Assistant',   icon: Bot },
]

const CLIENT_NAV = [
  { id: 'overview',       label: 'Overview',       icon: LayoutDashboard },
  { id: 'notifications',  label: 'Notifications',  icon: Bell },
  { id: 'favourites',     label: 'Favourites',     icon: Heart },
  { id: 'blog',           label: 'Blog',           icon: BookOpen },
  { id: 'wallet',         label: 'Wallet',         icon: Wallet,        href: '/wallet' },
  { id: 'chat',           label: 'Messages',       icon: MessageCircle, href: '/chat' },
]

export default function Dashboard() {
  const { user, wallet, stars, membership, logout, fetchMe } = useAuthStore()
  const navigate = useNavigate()

  const [activeTab, setActiveTab]   = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [online, setOnline]         = useState(false)
  const [aiEnabled, setAiEnabled]   = useState(false)
  const [aiPersonality, setAiPersonality] = useState('friendly')
  const [aiIntro, setAiIntro]       = useState('')
  const [aiDelay, setAiDelay]       = useState(5)
  const [savingAi, setSavingAi]     = useState(false)
  const [stats, setStats]           = useState(null)

  // Profile state
  const [profile, setProfile] = useState({
    name:'', age:'', gender:'female', sexual_orientation:'straight',
    nationality:'Kenyan', county:'', city:'', location:'', area:'',
    phone:'', incalls_rate:'', outcalls_rate:'', bio:'', services:[], other_services:[]
  })
  const [photos, setPhotos]   = useState([])
  const [saving, setSaving]   = useState(false)

  // Profile photo (client)
  const [clientPhotos, setClientPhotos] = useState([])
  const [uploadingClientPhoto, setUploadingClientPhoto] = useState(false)
  const clientPhotoRef = useRef()

  // Verification (escort)
  const [verification, setVerification] = useState(null)
  const [uploadingVerification, setUploadingVerification] = useState(false)
  const [verificationForm, setVerificationForm] = useState({
    full_name: '', gender: 'female', age: '', location: '', country: 'Kenya', phone: '', description: ''
  })
  const verificationFileRef = useRef()

  // Notifications — shared hook (also handles real-time popups + sound)
  const {
    notifications, unreadMessages,
    loading: notifLoading,
    markRead: markNotifRead,
    markAllRead: markAllNotifsRead,
  } = useNotifications()

  const [clientBlogPosts, setClientBlogPosts]     = useState([])
  const [clientBlogLoading, setClientBlogLoading] = useState(false)

  // Blog state (escort)
  const [blogPosts, setBlogPosts]     = useState([])
  const [blogModal, setBlogModal]     = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [blogForm, setBlogForm]       = useState({ title: '', body: '', tags: '', is_published: false })
  const [blogCoverFile, setBlogCoverFile] = useState(null)
  const [blogCoverUrl, setBlogCoverUrl]   = useState('')
  const [blogCoverPreview, setBlogCoverPreview] = useState(null)
  const [savingBlog, setSavingBlog]   = useState(false)
  const blogCoverRef = useRef()

  // Stories state (escort)
  const [myStories, setMyStories]       = useState([])
  const [storySource, setStorySource]   = useState('upload')
  const [storyFile, setStoryFile]       = useState(null)
  const [storyFilePreview, setStoryFilePreview] = useState(null)
  const [storyUrl, setStoryUrl]         = useState('')
  const [storyCaption, setStoryCaption] = useState('')
  const [storyType, setStoryType]       = useState('image')
  const [uploadingStory, setUploadingStory] = useState(false)
  const storyFileRef = useRef()

  // Favourites state (client)
  const [favourites, setFavourites]   = useState([])
  const [loadingFavs, setLoadingFavs] = useState(false)

  const isEscort = user?.role === 'escort'
  const NAV = isEscort ? ESCORT_NAV : CLIENT_NAV

  // ── Fetch data on mount ───────────────────────────────────────
  useEffect(() => {
    fetchMe()
    if (isEscort) {
      api.get(`/profile/${user.uuid}`).then(r => {
        const p = r.data
        setProfile({
          name: p.name||'', age: p.age||'', gender: p.gender||'female',
          sexual_orientation: p.sexual_orientation||'straight',
          nationality: p.nationality||'Kenyan', county: p.county||'',
          city: p.city||'', location: p.location||'', area: p.area||'',
          phone: p.phone||'', incalls_rate: p.incalls_rate||'', outcalls_rate: p.outcalls_rate||'',
          bio: p.bio||'', services: p.services||[], other_services: p.other_services||[],
        })
        setPhotos(p.photos||[])
        setOnline(p.is_online||false)
        setAiEnabled(p.ai_enabled||false)
        setAiPersonality(p.ai_personality||'friendly')
        setAiIntro(p.ai_intro||'')
        setAiDelay(p.ai_delay_seconds||5)
      }).catch(()=>{})
      api.get('/profile/me/stats').then(r => setStats(r.data)).catch(()=>{})
      api.get('/blog/my').then(r => setBlogPosts(r.data||[])).catch(()=>{})
      api.get(`/stories/user/${user.uuid}`).then(r => setMyStories(r.data||[])).catch(()=>{})
      api.get('/verification/status').then(r => {        setVerification(r.data)
        if (r.data?.full_name) {
          setVerificationForm({
            full_name: r.data.full_name || '',
            gender: r.data.gender || 'female',
            age: r.data.age || '',
            location: r.data.location || '',
            country: r.data.country || 'Kenya',
            phone: r.data.phone || '',
            description: r.data.description || ''
          })
        }
      }).catch(()=>{})
    }
    if (!isEscort) {
      setLoadingFavs(true)
      api.get('/favourites').then(r => { setFavourites(r.data||[]); setLoadingFavs(false) }).catch(()=>setLoadingFavs(false))
      api.get('/profile/me/photos').then(r => setClientPhotos(r.data||[])).catch(()=>{})
      setClientBlogLoading(true)
      api.get('/blog?limit=20').then(r => { setClientBlogPosts(r.data?.posts||r.data||[]); setClientBlogLoading(false) }).catch(()=>setClientBlogLoading(false))
    }
  }, [user?.uuid])

  // ── Profile handlers ─────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true)
    try {
      await api.put('/profile', profile)
      toast.success('Profile saved!')
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed') }
    setSaving(false)
  }

  const toggleService = (s) => setProfile(p => ({
    ...p, services: p.services.includes(s) ? p.services.filter(x=>x!==s) : [...p.services, s]
  }))

  const saveAiSettings = async () => {
    setSavingAi(true)
    try {
      await api.put('/profile', {
        ...profile,
        ai_enabled: aiEnabled,
        ai_personality: aiPersonality,
        ai_intro: aiIntro,
        ai_delay_seconds: aiDelay
      })
      toast.success('AI settings saved!')
    } catch { toast.error('Failed to save') }
    setSavingAi(false)
  }

  const toggleOnline = async () => {
    const next = !online
    try {
      const { data } = await api.put('/profile/me/online', { is_online: next })
      if (data.ai_locked) {
        toast('🤖 AI is keeping you online', { icon: 'ℹ️' })
        setOnline(true)
        return
      }
      setOnline(next)
    } catch {
      setOnline(next)
    }
    toast.success(next ? 'You are now online' : 'You are now offline')
  }

  // ── Photo handlers ───────────────────────────────────────────
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] }, maxFiles: 4,
    onDrop: async (files) => {
      const form = new FormData()
      files.forEach(f => form.append('photos', f))
      try {
        const { data } = await api.post('/profile/photos', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        setPhotos(p => [...p, ...data])
        toast.success('Photos uploaded!')
      } catch (err) { toast.error(err.response?.data?.error || 'Upload failed') }
    }
  })

  const deletePhoto = async (id) => {
    await api.delete(`/profile/photos/${id}`)
    setPhotos(p => {
      const remaining = p.filter(x => x.id !== id)
      const deleted = p.find(x => x.id === id)
      if (deleted?.is_primary && remaining.length > 0 && !remaining.some(x => x.is_primary)) {
        remaining[0] = { ...remaining[0], is_primary: true }
      }
      return remaining
    })
    toast.success('Photo deleted')
  }

  const setPrimaryPhoto = async (id) => {
    try {
      await api.put(`/profile/photos/${id}/primary`)
      setPhotos(p => p.map(x => ({ ...x, is_primary: x.id === id })))
      toast.success('Profile picture updated!')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update profile picture') }
  }

  // ── Client profile photo handlers ──────────────────────────
  const handleClientPhotoUpload = async (e) => {    const file = e.target.files?.[0]
    if (!file) return
    setUploadingClientPhoto(true)
    const form = new FormData()
    form.append('photos', file)
    try {
      await api.post('/profile/photos', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const r = await api.get('/profile/me/photos')
      setClientPhotos(r.data || [])
      toast.success('Profile photo updated!')
    } catch (err) { toast.error(err.response?.data?.error || 'Upload failed') }
    setUploadingClientPhoto(false)
    if (clientPhotoRef.current) clientPhotoRef.current.value = ''
  }

  // ── Verification handler ───────────────────────────────────
  const handleVerificationUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (verificationForm.age && parseInt(verificationForm.age) < 18) {
      toast.error('You must be 18 or older to be verified.')
      return
    }

    setUploadingVerification(true)
    const form = new FormData()
    form.append('photo', file)
    Object.entries(verificationForm).forEach(([k, v]) => form.append(k, v ?? ''))
    try {
      const { data } = await api.post('/verification', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setVerification(data.verification)
      toast.success('Verification submitted! Under review.')
    } catch (err) { toast.error(err.response?.data?.error || 'Upload failed') }
    setUploadingVerification(false)
    if (verificationFileRef.current) verificationFileRef.current.value = ''
  }

  // ── Blog handlers ────────────────────────────────────────────
  const openCreateBlog = () => {
    setEditingPost(null)
    setBlogForm({ title: '', body: '', tags: '', is_published: false })
    setBlogCoverFile(null)
    setBlogCoverUrl('')
    setBlogCoverPreview(null)
    setBlogModal(true)
  }

  const openEditBlog = (post) => {
    setEditingPost(post)
    setBlogForm({ title: post.title, body: post.body, tags: (post.tags||[]).join(', '), is_published: post.is_published })
    setBlogCoverFile(null)
    setBlogCoverUrl(post.cover_url || '')
    setBlogCoverPreview(post.cover_url || null)
    setBlogModal(true)
  }

  const handleBlogCoverSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBlogCoverFile(file)
    setBlogCoverPreview(URL.createObjectURL(file))
  }

  const saveBlog = async () => {
    if (!blogForm.title || !blogForm.body) return toast.error('Title and body required')
    setSavingBlog(true)
    try {
      const form = new FormData()
      form.append('title', blogForm.title)
      form.append('body', blogForm.body)
      form.append('is_published', blogForm.is_published)
      const tagsArr = blogForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      tagsArr.forEach(t => form.append('tags[]', t))
      if (blogCoverFile) form.append('cover', blogCoverFile)
      else if (blogCoverUrl) form.append('cover_url', blogCoverUrl)

      if (editingPost) {
        const { data } = await api.put(`/blog/${editingPost.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
        setBlogPosts(p => p.map(x => x.id === editingPost.id ? data : x))
        toast.success('Post updated!')
      } else {
        const { data } = await api.post('/blog', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        setBlogPosts(p => [data, ...p])
        toast.success('Post created!')
      }
      setBlogModal(false)
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    setSavingBlog(false)
  }

  const deleteBlog = async (id) => {
    if (!confirm('Delete this post?')) return
    await api.delete(`/blog/${id}`)
    setBlogPosts(p => p.filter(x => x.id !== id))
    toast.success('Deleted')
  }

  const togglePublish = async (post) => {
    const { data } = await api.put(`/blog/${post.id}`, { is_published: !post.is_published })
    setBlogPosts(p => p.map(x => x.id === post.id ? data : x))
    toast.success(data.is_published ? 'Published!' : 'Moved to draft')
  }

  // ── Story handlers ───────────────────────────────────────────
  const handleStoryFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setStoryFile(file)
    setStoryType(file.type.startsWith('video/') ? 'video' : 'image')
    setStoryFilePreview(URL.createObjectURL(file))
  }

  const uploadStory = async () => {
    if (storySource === 'upload' && !storyFile) return toast.error('Select a file')
    if (storySource === 'url' && !storyUrl.trim()) return toast.error('Enter a URL')
    setUploadingStory(true)
    try {
      const form = new FormData()
      if (storySource === 'upload') {
        form.append('file', storyFile)
        form.append('type', storyType)
        form.append('source', 'upload')
      } else {
        form.append('url', storyUrl)
        form.append('type', storyType)
        form.append('source', 'url')
      }
      form.append('caption', storyCaption)
      const { data } = await api.post('/stories', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMyStories(s => [data, ...s])
      setStoryFile(null)
      setStoryFilePreview(null)
      setStoryUrl('')
      setStoryCaption('')
      toast.success('Story posted! Expires in 24 hours')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    setUploadingStory(false)
  }

  const deleteStory = async (id) => {
    await api.delete(`/stories/${id}`)
    setMyStories(s => s.filter(x => x.id !== id))
    toast.success('Story deleted')
  }

  // ── Favourites handlers ──────────────────────────────────────
  const removeFavourite = async (escortUuid) => {
    await api.post(`/favourites/${escortUuid}`)
    setFavourites(f => f.filter(x => x.uuid !== escortUuid))
    toast.success('Removed from favourites')
  }

  // ── Nav handler ──────────────────────────────────────────────
  const handleNav = (item) => {
    if (item.href) { navigate(item.href); return }
    setActiveTab(item.id)
    setSidebarOpen(false)
  }

  // ── Sidebar ──────────────────────────────────────────────────
  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-lg">
          <User size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{user?.email?.split('@')[0]}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isEscort && online ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Online toggle for escort */}
      {isEscort && (
        <div className="px-4 py-3 border-b border-white/8">
          <button onClick={toggleOnline}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              online ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-dark-700/50 border-dark-500 text-gray-400 hover:text-white'
            }`}>
            <span className="flex items-center gap-2">
              {online ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {online ? 'Online' : 'Go Online'}
            </span>
            {online && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
          </button>
        </div>
      )}



      {/* Nav */}
      <nav className="py-3 px-2 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon
          const isActive = !item.href && activeTab === item.id
          const unreadCount = item.id === 'notifications'
            ? notifications.filter(n => !n.is_read).length
            : item.href === '/chat'
            ? unreadMessages
            : 0
          return (
            <button key={item.id} onClick={() => handleNav(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative text-left ${
                isActive ? 'bg-brand-600/20 text-brand-300' : 'text-gray-400 hover:text-white hover:bg-white/8'
              }`}>
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-400 rounded-r-full" />}
              <Icon size={16} className={`flex-shrink-0 ${isActive ? 'text-brand-400' : ''}`} />
              <span>{item.label}</span>
              {unreadCount > 0 && (
                <span className="ml-auto bg-brand-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {item.href && !unreadCount && <span className="ml-auto text-gray-600 text-xs">↗</span>}
            </button>
          )
        })}
      </nav>

      {/* Wallet + Stars */}
      <div className="mx-3 mb-3 space-y-2">
        {wallet && (
          <div className="p-3 bg-gradient-to-br from-brand-900/30 to-transparent border border-brand-700/30 rounded-xl">
            <p className="text-xs text-gray-500 mb-0.5">KSh Wallet</p>
            <p className="font-mono font-bold text-white">KSh {wallet.available?.toLocaleString() || 0}</p>
          </div>
        )}
        {stars && (
          <div className="p-3 bg-gradient-to-br from-amber-900/20 to-transparent border border-amber-700/20 rounded-xl">
            <p className="text-xs text-gray-500 mb-0.5">Stars</p>
            <p className="font-mono font-bold text-amber-400">⭐ {stars.balance?.toLocaleString() || 0}</p>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-white/8">
        <button onClick={() => { logout(); navigate('/') }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  if (user?.role === 'admin') return <Navigate to="/admin" replace />

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-dark-900 border-r border-white/8 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-dark-900 border-r border-white/8 z-50 lg:hidden flex flex-col">
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 bg-dark-900/80 backdrop-blur-xl border-b border-white/8">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2.5 rounded-xl text-white bg-dark-700 hover:bg-brand-600/30 border border-dark-500 hover:border-brand-500/40 transition-all">
            <Menu size={20} />
          </button>
          <h2 className="text-sm font-semibold text-white flex-1">
            {NAV.find(n => n.id === activeTab)?.label || 'Dashboard'}
          </h2>
          {/* Notification badge in top bar (mobile) */}
          {notifications.filter(n => !n.is_read).length > 0 && (
            <button onClick={() => setActiveTab('notifications')}
              className="lg:hidden relative p-2 text-gray-400 hover:text-white">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
            </button>
          )}
          <Link to="/" className="text-xs text-gray-500 hover:text-white transition-colors hidden sm:block">← Back to site</Link>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">

          {/* Inactive warning */}
          {isEscort && !user?.is_active && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-amber-400 font-semibold text-sm">Profile Inactive</p>
                <p className="text-amber-400/70 text-xs mt-0.5">Purchase a membership to appear in listings</p>
              </div>
              <Link to="/membership" className="btn-primary text-sm py-2 flex-shrink-0">Get Membership</Link>
            </div>
          )}

          {/* ══ OVERVIEW TAB ══════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

              {/* Profile photo (client) */}
              {!isEscort && (
                <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4 flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-dark-700 flex-shrink-0 border-2 border-dark-600">
                    {clientPhotos.find(p => p.is_primary) || clientPhotos[0] ? (
                      <img src={(clientPhotos.find(p => p.is_primary) || clientPhotos[0]).url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={24} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Profile Photo</p>
                    <p className="text-xs text-gray-500 mt-0.5">Visible to escorts in chat & reviews</p>
                  </div>
                  <input ref={clientPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleClientPhotoUpload} />
                  <button onClick={() => clientPhotoRef.current?.click()} disabled={uploadingClientPhoto}
                    className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5 flex-shrink-0">
                    {uploadingClientPhoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                    {clientPhotos.length ? 'Change' : 'Upload'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(isEscort ? [
                  { icon: Eye,    label: 'Profile Views', value: stats?.profile_views || 0,                          color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
                  { icon: Phone,  label: 'Phone Views',   value: stats?.phone_views || 0,                            color: 'text-green-400',  bg: 'bg-green-500/10'  },
                  { icon: Star,   label: 'Stars',         value: `⭐ ${(stars?.balance || 0).toLocaleString()}`,      color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
                  { icon: Wallet, label: 'Wallet',        value: `KSh ${(wallet?.available || 0).toLocaleString()}`, color: 'text-brand-400',  bg: 'bg-brand-500/10'  },
                ] : [
                  { icon: Wallet, label: 'KSh Balance',  value: `KSh ${(wallet?.available || 0).toLocaleString()}`, color: 'text-brand-400',  bg: 'bg-brand-500/10'  },
                  { icon: Star,   label: 'Stars',         value: `⭐ ${(stars?.balance || 0).toLocaleString()}`,      color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
                  { icon: Heart,  label: 'Favourites',    value: favourites.length || 0,                             color: 'text-red-400',    bg: 'bg-red-500/10'    },
                  { icon: Crown,  label: 'Membership',    value: membership?.tier_name || 'None',                    color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
                ]).map(({ icon: Icon, label, value, color, bg }) => (
                  <motion.div key={label} whileHover={{ y: -2 }}
                    className="bg-dark-800 border border-dark-700 rounded-2xl p-4 cursor-default">
                    <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon size={17} className={color} />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="font-mono font-bold text-white text-lg leading-tight">{value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Quick actions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isEscort ? (
                    <>
                      <button onClick={() => setActiveTab('profile')}
                        className="flex items-center gap-3 p-4 bg-dark-800 border border-dark-700 hover:border-brand-600/50 rounded-2xl transition-all group text-left">
                        <div className="w-10 h-10 bg-brand-600/10 rounded-xl flex items-center justify-center group-hover:bg-brand-600/20 transition-colors">
                          <User size={18} className="text-brand-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Edit Profile</p>
                          <p className="text-xs text-gray-500">Update your info & rates</p>
                        </div>
                      </button>
                      <button onClick={() => setActiveTab('blog')}
                        className="flex items-center gap-3 p-4 bg-dark-800 border border-dark-700 hover:border-brand-600/50 rounded-2xl transition-all group text-left">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <BookOpen size={18} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Write Blog Post</p>
                          <p className="text-xs text-gray-500">{blogPosts.length} post{blogPosts.length !== 1 ? 's' : ''}</p>
                        </div>
                      </button>
                      <button onClick={() => setActiveTab('stories')}
                        className="flex items-center gap-3 p-4 bg-dark-800 border border-dark-700 hover:border-brand-600/50 rounded-2xl transition-all group text-left">
                        <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                          <ImageIcon size={18} className="text-pink-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Post a Story</p>
                          <p className="text-xs text-gray-500">{myStories.length} active</p>
                        </div>
                      </button>
                      <button onClick={() => setActiveTab('photos')}
                        className="flex items-center gap-3 p-4 bg-dark-800 border border-dark-700 hover:border-brand-600/50 rounded-2xl transition-all group text-left">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                          <Camera size={18} className="text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Manage Photos</p>
                          <p className="text-xs text-gray-500">{photos.length} uploaded</p>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/wallet"
                        className="flex items-center gap-3 p-4 bg-dark-800 border border-dark-700 hover:border-brand-600/50 rounded-2xl transition-all group">
                        <div className="w-10 h-10 bg-brand-600/10 rounded-xl flex items-center justify-center group-hover:bg-brand-600/20 transition-colors">
                          <Wallet size={18} className="text-brand-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Top Up Wallet</p>
                          <p className="text-xs text-gray-500">Add funds via M-Pesa</p>
                        </div>
                      </Link>
                      <button onClick={() => setActiveTab('favourites')}
                        className="flex items-center gap-3 p-4 bg-dark-800 border border-dark-700 hover:border-brand-600/50 rounded-2xl transition-all group text-left">
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                          <Heart size={18} className="text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">My Favourites</p>
                          <p className="text-xs text-gray-500">{favourites.length} saved</p>
                        </div>
                      </button>
                      <Link to="/escorts"
                        className="flex items-center gap-3 p-4 bg-dark-800 border border-dark-700 hover:border-brand-600/50 rounded-2xl transition-all group">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                          <TrendingUp size={18} className="text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Browse Escorts</p>
                          <p className="text-xs text-gray-500">Find someone nearby</p>
                        </div>
                      </Link>
                      <Link to="/chat"
                        className="flex items-center gap-3 p-4 bg-dark-800 border border-dark-700 hover:border-brand-600/50 rounded-2xl transition-all group">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <MessageCircle size={18} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Messages</p>
                          <p className="text-xs text-gray-500">View conversations</p>
                        </div>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ PROFILE TAB ═══════════════════════════════════════════ */}
          {activeTab === 'profile' && isEscort && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
                <h2 className="font-semibold text-white mb-6 flex items-center gap-2 text-base">
                  <User size={18} className="text-brand-400" /> My Profile
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { k:'name',     label:'Display Name',         type:'text'   },
                    { k:'age',      label:'Age',                  type:'number' },
                    { k:'phone',    label:'WhatsApp / Call No.',  type:'tel'    },
                    { k:'location', label:'Location',             type:'text'   },
                    { k:'area',     label:'Area / Neighbourhood', type:'text'   },
                    { k:'nationality',label:'Nationality',        type:'text'   },
                    { k:'city',     label:'City',                 type:'text'   },
                  ].map(({ k, label, type }) => (
                    <div key={k}>
                      <label className="text-xs text-gray-500 mb-1.5 block font-medium">{label}</label>
                      <input type={type} className="input" value={profile[k]}
                        onChange={e => setProfile({...profile,[k]:e.target.value})} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">County</label>
                    <select className="input" value={profile.county} onChange={e => setProfile({...profile,county:e.target.value})}>
                      <option value="">Select county</option>
                      {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Gender</label>
                    <select className="input" value={profile.gender} onChange={e => setProfile({...profile,gender:e.target.value})}>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="transgender">Transgender</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Incalls Rate (KSh/hr)</label>
                    <input type="number" className="input" placeholder="0" value={profile.incalls_rate}
                      onChange={e => setProfile({...profile,incalls_rate:e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Outcalls Rate (KSh/hr)</label>
                    <input type="number" className="input" placeholder="0" value={profile.outcalls_rate}
                      onChange={e => setProfile({...profile,outcalls_rate:e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Bio</label>
                    <textarea className="input min-h-[100px] resize-none" placeholder="Tell clients about yourself..."
                      value={profile.bio} onChange={e => setProfile({...profile,bio:e.target.value})} />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="text-xs text-gray-500 mb-3 block font-medium uppercase tracking-wider">Services Offered</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES.map(s => (
                      <button key={s} type="button" onClick={() => toggleService(s)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          profile.services.includes(s) ? 'bg-brand-600 border-brand-500 text-white' : 'border-dark-500 text-gray-500 hover:border-brand-500 hover:text-gray-300'
                        }`}>{s}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={saveProfile} disabled={saving} className="btn-primary mt-6">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>

                {/* Verification */}
                <div className="mt-8 pt-6 border-t border-dark-700">
                  <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                    <Shield size={16} className="text-brand-400" /> Get Verified
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Upload a clear selfie holding your ID for review. Verified profiles get a badge and rank higher.
                  </p>

                  {verification?.status === 'approved' ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                      <CheckCircle size={16} /> You're verified!
                    </div>
                  ) : verification?.status === 'pending' ? (
                    <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                      <Loader2 size={16} /> Submitted — under review
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {verification?.status === 'rejected' && (
                        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                          Your last submission was rejected{verification.notes ? `: ${verification.notes}` : ''}. Please update your details and try again.
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Full Name</label>
                          <input type="text" className="input" placeholder="As shown on your ID" value={verificationForm.full_name}
                            onChange={e => setVerificationForm(f => ({...f, full_name: e.target.value}))} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Age</label>
                          <input type="number" min="18" className="input" placeholder="18+" value={verificationForm.age}
                            onChange={e => setVerificationForm(f => ({...f, age: e.target.value}))} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Gender</label>
                          <select className="input" value={verificationForm.gender}
                            onChange={e => setVerificationForm(f => ({...f, gender: e.target.value}))}>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                            <option value="transgender">Transgender</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Phone Number</label>
                          <input type="tel" className="input" placeholder="07XXXXXXXX" value={verificationForm.phone}
                            onChange={e => setVerificationForm(f => ({...f, phone: e.target.value}))} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Location</label>
                          <input type="text" className="input" placeholder="e.g. Westlands, Nairobi" value={verificationForm.location}
                            onChange={e => setVerificationForm(f => ({...f, location: e.target.value}))} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Country</label>
                          <input type="text" className="input" value={verificationForm.country}
                            onChange={e => setVerificationForm(f => ({...f, country: e.target.value}))} />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Short Description</label>
                          <textarea className="input min-h-[70px] resize-none" placeholder="A short note about yourself for the review team"
                            value={verificationForm.description} onChange={e => setVerificationForm(f => ({...f, description: e.target.value}))} />
                        </div>
                      </div>

                      <input ref={verificationFileRef} type="file" accept="image/*" className="hidden" onChange={handleVerificationUpload} />
                      <button onClick={() => verificationFileRef.current?.click()} disabled={uploadingVerification}
                        className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5">
                        {uploadingVerification ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {uploadingVerification ? 'Uploading...' : 'Upload Verification Photo'}
                      </button>
                      <p className="text-[11px] text-gray-600">Fill in the details above, then upload your verification photo to submit. Must be 18+.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ PHOTOS TAB ════════════════════════════════════════════ */}
          {activeTab === 'photos' && isEscort && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-white flex items-center gap-2 text-base">
                    <Camera size={18} className="text-brand-400" /> Photos
                  </h2>
                  <span className="text-xs text-gray-500">{photos.length} / {membership?.max_photos || 4}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                  {photos.map(p => (
                    <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={p.url} className="w-full h-full object-cover" />
                      {p.is_primary && (
                        <span className="absolute top-1.5 left-1.5 bg-brand-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Profile pic
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-1.5">
                        {!p.is_primary && (
                          <button onClick={() => setPrimaryPhoto(p.id)}
                            className="opacity-0 group-hover:opacity-100 bg-brand-500 hover:bg-brand-400 text-white text-xs px-3 py-1.5 rounded-lg transition-all">
                            Set as profile pic
                          </button>
                        )}
                        <button onClick={() => deletePhoto(p.id)}
                          className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-400 text-white text-xs px-3 py-1.5 rounded-lg transition-all">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <div {...getRootProps()}
                    className="aspect-square border-2 border-dashed border-dark-500 hover:border-brand-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group bg-dark-700/30 hover:bg-brand-500/5">
                    <input {...getInputProps()} />
                    <Camera size={24} className="text-gray-600 group-hover:text-brand-400 transition-colors mb-2" />
                    <p className="text-xs text-gray-600 group-hover:text-brand-400 transition-colors text-center px-2">Add Photo</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">Max {membership?.max_photos || 4} photos. <Link to="/membership" className="text-brand-400 hover:text-brand-300">Upgrade</Link> for more.</p>
              </div>
            </motion.div>
          )}

          {/* ══ BLOG TAB (escort) ═════════════════════════════════════ */}
          {activeTab === 'ai' && isEscort && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-lg">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">🤖 AI Auto-Reply</h2>
            <p className="text-sm text-gray-400">Turn on AI to automatically reply to client messages as you, using your profile info.</p>
          </div>

          {/* Toggle */}
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">AI Auto-Reply</p>
              <p className="text-xs text-gray-500 mt-0.5">{aiEnabled ? 'On — AI is replying to clients for you' : 'Off — clients wait for your manual reply'}</p>
            </div>
            <button onClick={() => setAiEnabled(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${aiEnabled ? 'bg-brand-600' : 'bg-dark-600'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${aiEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Personality */}
          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-white">Personality</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'friendly',     label: '😊 Friendly',     desc: 'Warm & approachable' },
                { value: 'flirty',       label: '😘 Flirty',       desc: 'Playful & exciting' },
                { value: 'professional', label: '💼 Professional', desc: 'Classy & elegant' },
              ].map(p => (
                <button key={p.value} onClick={() => setAiPersonality(p.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${aiPersonality === p.value ? 'border-brand-500 bg-brand-500/10' : 'border-dark-600 hover:border-dark-400'}`}>
                  <p className="text-sm font-medium text-white">{p.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Delay */}
          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-white">Reply Speed</p>
            <p className="text-xs text-gray-500">A small delay makes replies feel more human</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 0,  label: '⚡ Instant' },
                { value: 5,  label: '🕐 5 seconds' },
                { value: 10, label: '🕐 10 seconds' },
                { value: 30, label: '🕐 30 seconds' },
              ].map(d => (
                <button key={d.value} onClick={() => setAiDelay(d.value)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${aiDelay === d.value ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-dark-600 text-gray-400 hover:border-dark-400'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Intro message */}
          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-white">Intro Message <span className="text-gray-500 font-normal">(optional)</span></p>
            <p className="text-xs text-gray-500">Sent automatically when a client first opens a chat with you</p>
            <textarea value={aiIntro} onChange={e => setAiIntro(e.target.value)}
              className="input w-full resize-none" rows={3}
              placeholder="e.g. Hey! Thanks for reaching out 😊 How can I help you today?" />
          </div>

          <button onClick={saveAiSettings} disabled={savingAi}
            className="btn-primary w-full justify-center">
            {savingAi ? 'Saving...' : 'Save AI Settings'}
          </button>
        </motion.div>
      )}

      {activeTab === 'blog' && isEscort && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white text-base flex items-center gap-2"><BookOpen size={18} className="text-blue-400" /> My Blog</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Write articles visible to everyone on /blog</p>
                </div>
                <button onClick={openCreateBlog} className="btn-primary text-sm">
                  <Plus size={14} /> New Post
                </button>
              </div>

              {blogPosts.length === 0 ? (
                <div className="text-center py-16 bg-dark-800 border border-dark-700 rounded-2xl">
                  <BookOpen size={36} className="mx-auto mb-3 text-gray-700" />
                  <p className="text-gray-500 text-sm">No blog posts yet</p>
                  <button onClick={openCreateBlog} className="btn-primary mt-4 text-sm mx-auto">Write your first post</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {blogPosts.map(post => (
                    <div key={post.id} className="bg-dark-800 border border-dark-700 rounded-2xl p-4 flex items-center gap-4">
                      {post.cover_url && (
                        <img src={post.cover_url} alt={post.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-white text-sm truncate">{post.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${post.is_published ? 'bg-green-500/10 text-green-400' : 'bg-dark-600 text-gray-500'}`}>
                            {post.is_published ? <><Globe size={10} className="inline mr-1" />Published</> : <><Lock size={10} className="inline mr-1" />Draft</>}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span>❤️ {post.like_count}</span>
                          <span>💬 {post.comment_count}</span>
                          <span>👁 {post.view_count}</span>
                          <span>{format(new Date(post.created_at), 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => togglePublish(post)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${post.is_published ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}>
                          {post.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button onClick={() => openEditBlog(post)} className="p-1.5 text-gray-500 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteBlog(post.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                        {post.is_published && (
                          <Link to={`/blog/${post.slug}`} target="_blank" className="p-1.5 text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors">
                            <Globe size={14} />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Blog create/edit modal */}
              <AnimatePresence>
                {blogModal && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setBlogModal(false)}>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                      className="w-full max-w-2xl bg-dark-800 border border-dark-600 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
                      onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-white text-lg">{editingPost ? 'Edit Post' : 'New Blog Post'}</h3>
                        <button onClick={() => setBlogModal(false)} className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {/* Cover image */}
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Cover Image</label>
                          {blogCoverPreview ? (
                            <div className="relative rounded-xl overflow-hidden h-40 mb-2">
                              <img src={blogCoverPreview} className="w-full h-full object-cover" />
                              <button onClick={() => { setBlogCoverPreview(null); setBlogCoverFile(null); setBlogCoverUrl('') }}
                                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full">
                                <X size={12} className="text-white" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => blogCoverRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-dark-500 hover:border-brand-500 text-gray-400 hover:text-white rounded-xl transition-all">
                                <Upload size={14} /> Upload
                              </button>
                              <input ref={blogCoverRef} type="file" accept="image/*" className="hidden" onChange={handleBlogCoverSelect} />
                              <input className="input flex-1 text-sm" placeholder="or paste image URL..."
                                value={blogCoverUrl} onChange={e => { setBlogCoverUrl(e.target.value); if(e.target.value) setBlogCoverPreview(e.target.value) }} />
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Title *</label>
                          <input className="input" placeholder="Post title" value={blogForm.title}
                            onChange={e => setBlogForm(f => ({...f, title: e.target.value}))} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Content *</label>
                          <textarea className="input min-h-[200px] resize-none text-sm" placeholder="Write your blog post here..."
                            value={blogForm.body} onChange={e => setBlogForm(f => ({...f, body: e.target.value}))} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block font-medium">Tags (comma separated)</label>
                          <input className="input text-sm" placeholder="e.g. Nairobi, Tips, Story"
                            value={blogForm.tags} onChange={e => setBlogForm(f => ({...f, tags: e.target.value}))} />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="accent-brand-500" checked={blogForm.is_published}
                            onChange={e => setBlogForm(f => ({...f, is_published: e.target.checked}))} />
                          <span className="text-sm text-gray-400">Publish immediately (visible to everyone)</span>
                        </label>
                      </div>
                      <div className="flex gap-2 mt-5">
                        <button onClick={() => setBlogModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                        <button onClick={saveBlog} disabled={savingBlog} className="btn-primary flex-1 justify-center">
                          {savingBlog ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                          {savingBlog ? 'Saving...' : editingPost ? 'Update' : 'Create'}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ══ STORIES TAB (escort) ══════════════════════════════════ */}
          {activeTab === 'stories' && isEscort && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <h2 className="font-semibold text-white text-base flex items-center gap-2 mb-1"><ImageIcon size={18} className="text-pink-400" /> My Stories</h2>
                <p className="text-xs text-gray-500">Stories expire after 24 hours. Appear on homepage and your profile.</p>
              </div>

              {/* Upload new story */}
              <div className="bg-dark-800 border border-dark-700 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Post a Story</h3>
                {/* Source toggle */}
                <div className="flex gap-2 mb-4">
                  {['upload', 'url'].map(s => (
                    <button key={s} onClick={() => setStorySource(s)}
                      className={`flex-1 py-2 text-sm rounded-xl border transition-all capitalize ${storySource === s ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-dark-600 text-gray-400'}`}>
                      {s === 'upload' ? '📁 Upload File' : '🔗 Paste URL'}
                    </button>
                  ))}
                </div>

                {storySource === 'upload' ? (
                  <div className="mb-3">
                    {storyFilePreview ? (
                      <div className="relative rounded-xl overflow-hidden h-48 mb-2">
                        {storyType === 'image'
                          ? <img src={storyFilePreview} className="w-full h-full object-cover" />
                          : <video src={storyFilePreview} className="w-full h-full object-cover" muted autoPlay loop />
                        }
                        <button onClick={() => { setStoryFile(null); setStoryFilePreview(null) }}
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded-full">
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => storyFileRef.current?.click()}
                        className="w-full h-32 border-2 border-dashed border-dark-500 hover:border-brand-500 rounded-xl flex flex-col items-center justify-center transition-colors group">
                        <Upload size={24} className="text-gray-600 group-hover:text-brand-400 mb-1 transition-colors" />
                        <p className="text-xs text-gray-600 group-hover:text-brand-400 transition-colors">Click to select image or video</p>
                      </button>
                    )}
                    <input ref={storyFileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleStoryFileSelect} />
                  </div>
                ) : (
                  <div className="space-y-2 mb-3">
                    <div className="flex gap-2">
                      {['image', 'video'].map(t => (
                        <button key={t} onClick={() => setStoryType(t)}
                          className={`flex-1 py-1.5 text-xs rounded-xl border transition-all capitalize ${storyType === t ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-dark-600 text-gray-400'}`}>
                          {t === 'image' ? '🖼 Image' : '▶ Video'}
                        </button>
                      ))}
                    </div>
                    <input className="input text-sm" placeholder={storyType === 'video' ? 'https://youtube.com/... or direct mp4 URL' : 'https://example.com/image.jpg'}
                      value={storyUrl} onChange={e => setStoryUrl(e.target.value)} />
                  </div>
                )}

                <div className="mb-3">
                  <label className="text-xs text-gray-500 mb-1 block">Caption (optional)</label>
                  <input className="input text-sm" placeholder="Add a caption..." value={storyCaption} onChange={e => setStoryCaption(e.target.value)} />
                </div>

                <button onClick={uploadStory} disabled={uploadingStory} className="btn-primary w-full justify-center">
                  {uploadingStory ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  {uploadingStory ? 'Posting...' : 'Post Story'}
                </button>
              </div>

              {/* Active stories */}
              {myStories.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Active Stories ({myStories.length})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {myStories.map(s => (
                      <div key={s.id} className="relative rounded-xl overflow-hidden aspect-[9/16] bg-dark-700 group">
                        {s.type === 'image'
                          ? <img src={s.url} className="w-full h-full object-cover" />
                          : <video src={s.url} className="w-full h-full object-cover" muted autoPlay loop poster={s.thumbnail} />
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          {s.caption && <p className="text-xs text-white truncate mb-1">{s.caption}</p>}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/70 flex items-center gap-1">👁 {s.view_count}</span>
                            <span className="text-xs text-white/50">24h</span>
                          </div>
                        </div>
                        <button onClick={() => deleteStory(s.id)}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══ FAVOURITES TAB (client) ═══════════════════════════════ */}
          {activeTab === 'favourites' && !isEscort && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <h2 className="font-semibold text-white text-base flex items-center gap-2 mb-1"><Heart size={18} className="text-red-400" /> My Favourites</h2>
                <p className="text-xs text-gray-500">Escorts you've saved. Click the heart on any profile to save.</p>
              </div>

              {loadingFavs ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="text-brand-500 animate-spin" /></div>
              ) : favourites.length === 0 ? (
                <div className="text-center py-16 bg-dark-800 border border-dark-700 rounded-2xl">
                  <Heart size={36} className="mx-auto mb-3 text-gray-700" />
                  <p className="text-gray-500 text-sm mb-3">No favourites yet</p>
                  <Link to="/escorts" className="btn-primary text-sm mx-auto">Browse Escorts</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favourites.map(f => (
                    <div key={f.fav_id} className="bg-dark-800 border border-dark-700 rounded-2xl p-4 flex items-center gap-3">
                      <Link to={`/escort/${f.uuid}`} className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-600 relative">
                          {f.primary_photo && <img src={f.primary_photo} className="w-full h-full object-cover" />}
                          {f.is_online && <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-400 border border-dark-900 rounded-full" />}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/escort/${f.uuid}`}>
                          <p className="font-medium text-white text-sm hover:text-brand-400 transition-colors truncate">{f.name || 'Escort'}</p>
                        </Link>
                        <p className="text-xs text-gray-500 truncate">{f.county}</p>
                        {f.avg_rating > 0 && (
                          <p className="text-xs text-amber-400">{'★'.repeat(Math.round(f.avg_rating))} ({f.review_count})</p>
                        )}
                        <div className="flex gap-3 text-xs text-gray-600 mt-0.5">
                          {f.incalls_rate > 0 && <span>In: KSh {f.incalls_rate?.toLocaleString()}</span>}
                          {f.outcalls_rate > 0 && <span>Out: KSh {f.outcalls_rate?.toLocaleString()}</span>}
                        </div>
                      </div>
                      <button onClick={() => removeFavourite(f.uuid)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex-shrink-0">
                        <Heart size={16} fill="currentColor" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ══ NOTIFICATIONS TAB (both roles) ════════════════════════ */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white text-base flex items-center gap-2">
                  <Bell size={18} className="text-brand-400" /> Notifications
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {notifications.filter(n => !n.is_read).length} new
                    </span>
                  )}
                </h2>
                {notifications.some(n => !n.is_read) && (
                  <button onClick={markAllNotifsRead} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                    Mark all as read
                  </button>
                )}
              </div>

              {notifLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="text-brand-500 animate-spin" /></div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16 bg-dark-800 border border-dark-700 rounded-2xl">
                  <Bell size={36} className="mx-auto mb-3 text-gray-700" />
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(n => {
                    const getPath = (notif) => {
                      if (['wallet_topup','stars_purchased','stars_redeemed','cashout_initiated',
                           'cashout_approved','cashout_paid','cashout_rejected','payment_failed',
                           'membership_activated'].includes(notif.type)) return '/dashboard'
                      if (!notif.ref_type) return null
                      switch (notif.ref_type) {
                        case 'thread':  return `/chat/${notif.ref_id}`
                        case 'blog':    return notif.ref_slug ? `/blog/${notif.ref_slug}` : null
                        case 'story':   return notif.ref_slug ? `/escort/${notif.ref_slug}` : '/escorts'
                        case 'review':  return notif.ref_slug ? `/escort/${notif.ref_slug}` : null
                        case 'profile': return notif.ref_id ? `/escort/${notif.ref_id}` : null
                        case 'cashout': return '/dashboard'
                        default:        return null
                      }
                    }
                    const path = getPath(n)
                    return (
                    <div key={n.id} onClick={() => { markNotifRead(n.id); if (path) navigate(path) }}
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors hover:border-brand-600/50 ${
                        n.is_read
                          ? 'bg-dark-800 border-dark-700 opacity-70'
                          : 'bg-dark-800 border-brand-700/40 shadow-sm shadow-brand-900/30'
                      }`}>
                      <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center flex-shrink-0 text-base">
                        {n.icon === 'heart' ? '❤️' : n.icon === 'crown' ? '👑' : n.icon === 'star' ? '⭐' : n.icon === 'message' ? '💬' : '🔔'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${n.is_read ? 'text-gray-400' : 'text-white'}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[11px] text-gray-600 mt-1">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</p>
                      </div>
                      {!n.is_read && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1.5" />}
                      {path && <span className="text-gray-600 text-xs flex-shrink-0 mt-1">→</span>}
                    </div>
                  )})}
                </div>
              )}
            </motion.div>
          )}

          {/* ══ BLOG TAB (client — read-only browse) ══════════════════ */}
          {activeTab === 'blog' && !isEscort && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white text-base flex items-center gap-2">
                  <BookOpen size={18} className="text-brand-400" /> Blog
                </h2>
                <Link to="/blog" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">View all →</Link>
              </div>

              {clientBlogLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="text-brand-500 animate-spin" /></div>
              ) : clientBlogPosts.length === 0 ? (
                <div className="text-center py-16 bg-dark-800 border border-dark-700 rounded-2xl">
                  <BookOpen size={36} className="mx-auto mb-3 text-gray-700" />
                  <p className="text-gray-500 text-sm">No posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clientBlogPosts.map(post => (
                    <Link key={post.id} to={`/blog/${post.slug}`}
                      className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden hover:border-brand-600/40 transition-colors group">
                      {post.cover_url && (
                        <img src={post.cover_url} alt={post.title} className="w-full h-36 object-cover group-hover:opacity-90 transition-opacity" />
                      )}
                      <div className="p-4">
                        <p className="text-sm font-semibold text-white line-clamp-2 group-hover:text-brand-300 transition-colors">{post.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.excerpt || post.body?.slice(0, 100)}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-600">
                          <span>❤️ {post.like_count || 0}</span>
                          <span>💬 {post.comment_count || 0}</span>
                          {post.author_name && <span>by {post.author_name}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </main>
      </div>
    </div>
  )
}
