import LazyImage from '../components/ui/LazyImage'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Phone, MessageCircle, BadgeCheck, Star, ChevronLeft, Eye, Heart, BookOpen, Loader2, Send, X } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import api from '../utils/api'
import useAuthStore from '../store/authStore'
import MediaGallery from '../components/ui/MediaGallery'
import StoryViewer, { StoryRing } from '../components/ui/StoryViewer'
import toast from 'react-hot-toast'

const normalizePhone = (phone) => {
  let p = String(phone).replace(/[\s\-\+]/g, '')
  if (p.startsWith('0') && p.length === 10) return '254' + p.slice(1)
  if (p.length === 9 && (p.startsWith('7') || p.startsWith('1'))) return '254' + p
  return p
}

const TIER_STYLES = {
  VIP:         'badge-vip',
  'Prime VIP': 'badge bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30',
  Prime:       'badge-prime',
  Regular:     'badge bg-dark-500 text-gray-400 border border-dark-400',
}

const STARS_DISPLAY = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

export default function EscortProfile() {
  const { uuid }  = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuthStore()

  const [escort, setEscort]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [starting, setStarting]     = useState(false)
  const [activeTab, setActiveTab]   = useState('about')
  const [favourited, setFavourited] = useState(false)
  const [reviews, setReviews]       = useState([])
  const [blogPosts, setBlogPosts]   = useState([])
  const [stories, setStories]       = useState([])
  const [showStories, setShowStories] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [replyText, setReplyText]   = useState({})
  const [submittingReply, setSubmittingReply] = useState(null)

  useEffect(() => {
    api.get(`/profile/${uuid}`)
      .then(r => { setEscort(r.data); setLoading(false) })
      .catch(() => { setLoading(false); navigate('/escorts') })

    api.get(`/reviews/escort/${uuid}`).then(r => setReviews(r.data)).catch(() => {})
    api.get(`/blog/escort/${uuid}`).then(r => setBlogPosts(r.data)).catch(() => {})
    api.get(`/stories/user/${uuid}`).then(r => setStories(r.data)).catch(() => {})

    if (user?.role === 'client') {
      api.get(`/favourites/check/${uuid}`).then(r => setFavourited(r.data.favourited)).catch(() => {})
    }
  }, [uuid])

  const startChat = async () => {
    if (!user) return navigate('/login')
    setStarting(true)
    try {
      const { data } = await api.post(`/chat/thread/${uuid}`)
      navigate(`/chat/${data.id}`)
    } catch (err) {
      if (err.response?.data?.error === 'insufficient_stars') {
        toast.error(`You need stars to chat. Buy some in your wallet!`)
        navigate('/wallet')
      } else {
        toast.error(err.response?.data?.error || 'Failed to start chat')
      }
    }
    setStarting(false)
  }

  const toggleFavourite = async () => {
    if (!user) return navigate('/login')
    try {
      const { data } = await api.post(`/favourites/${uuid}`)
      setFavourited(data.favourited)
      toast.success(data.favourited ? 'Added to favourites!' : 'Removed from favourites')
    } catch { toast.error('Failed') }
  }

  const submitReview = async () => {
    if (!user) return navigate('/login')
    setSubmittingReview(true)
    try {
      const { data } = await api.post(`/reviews/escort/${uuid}`, reviewForm)
      setReviews(prev => [data, ...prev.filter(r => r.client_id !== user.id)])
      toast.success('Review posted!')
      setReviewForm({ rating: 5, comment: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post review')
    }
    setSubmittingReview(false)
  }

  const submitReply = async (reviewId) => {
    const text = replyText[reviewId]
    if (!text?.trim()) return
    setSubmittingReply(reviewId)
    try {
      const { data } = await api.post(`/reviews/${reviewId}/reply`, { body: text })
      setReviews(prev => prev.map(r => r.id === reviewId
        ? { ...r, replies: [...(r.replies || []), data] }
        : r
      ))
      setReplyText(prev => ({ ...prev, [reviewId]: '' }))
      toast.success('Reply posted!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
    setSubmittingReply(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!escort) return null

  const photos = escort.photos || []
  const hasStories = stories.length > 0
  const starsPerMsg = 5 // will be fetched from settings ideally

  const TABS = [
    { id: 'about',   label: 'About' },
    { id: 'reviews', label: `Reviews (${escort.review_count || 0})` },
    { id: 'blog',    label: `Blog (${blogPosts.length})` },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 page-enter">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-white mb-6 transition-colors">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT — Photos */}
        <div className="lg:col-span-2">
          {/* Story ring on profile photo */}
          {hasStories && (
            <div className="flex justify-center mb-4">
              <StoryRing
                user={{ name: escort.name, avatar: photos[0]?.url, is_online: escort.is_online }}
                stories={stories}
                size="lg"
                onClick={() => setShowStories(true)}
              />
            </div>
          )}

          {/* Photo gallery */}
          {photos.length > 0 ? (
            <MediaGallery items={photos.map(p => ({ type: 'image', url: p.url, public_id: p.public_id }))} />
          ) : (
            <div className="aspect-[4/5] bg-dark-800 rounded-2xl flex items-center justify-center">
              <div className="text-center text-gray-600">
                <Eye size={40} className="mx-auto mb-2" />
                <p className="text-sm">No photos uploaded</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-dark-800 p-1 rounded-xl mt-6 mb-4">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === t.id ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {escort.bio && (
                <div className="card p-5">
                  <h3 className="font-semibold text-white mb-3">About</h3>
                  <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{escort.bio}</p>
                </div>
              )}
              {escort.services?.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-white mb-3">Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {escort.services.map(s => (
                      <span key={s} className="text-xs px-3 py-1.5 bg-dark-700 text-gray-300 rounded-full border border-dark-600">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Write a review */}
              {user?.role === 'client' && (
                <div className="card p-5">
                  <h3 className="font-semibold text-white mb-3">Write a Review</h3>
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                        className={`text-2xl transition-all ${n <= reviewForm.rating ? 'text-amber-400' : 'text-gray-600 hover:text-amber-300'}`}>
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea className="input min-h-[80px] resize-none mb-3" placeholder="Share your experience..."
                    value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
                  <button onClick={submitReview} disabled={submittingReview} className="btn-primary text-sm">
                    {submittingReview ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                    Post Review
                  </button>
                </div>
              )}

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-sm">No reviews yet</div>
              ) : (
                reviews.map(r => (
                  <div key={r.id} className="card p-5">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-dark-600 overflow-hidden flex-shrink-0">
                        {r.client_avatar && <LazyImage src={r.client_avatar} className="w-full h-full" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{r.client_name || 'Client'}</p>
                          <span className="text-xs text-gray-600">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                        </div>
                        <p className="text-amber-400 text-sm">{STARS_DISPLAY(r.rating)}</p>
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-gray-400 mb-3">{r.comment}</p>}

                    {/* Replies */}
                    {r.replies?.map(reply => (
                      <div key={reply.id} className={`flex items-start gap-2 mt-2 pl-4 border-l-2 ${reply.author_role === 'escort' ? 'border-brand-500/50' : 'border-dark-600'}`}>
                        <div className="w-7 h-7 rounded-full bg-dark-600 overflow-hidden flex-shrink-0">
                          {reply.author_avatar && <LazyImage src={reply.author_avatar} className="w-full h-full" />}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            <span className={`font-medium ${reply.author_role === 'escort' ? 'text-brand-400' : 'text-white'}`}>
                              {reply.author_name || (reply.author_role === 'escort' ? 'Escort' : 'Client')}
                            </span>
                            {reply.author_role === 'escort' && <span className="ml-1 text-brand-500">· Owner</span>}
                          </p>
                          <p className="text-sm text-gray-400">{reply.body}</p>
                        </div>
                      </div>
                    ))}

                    {/* Reply input */}
                    {user && (user.id === r.client_id || user.id === r.escort_id) && (
                      <div className="flex gap-2 mt-3">
                        <input
                          className="input text-sm flex-1 py-2"
                          placeholder="Write a reply..."
                          value={replyText[r.id] || ''}
                          onChange={e => setReplyText(prev => ({ ...prev, [r.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && submitReply(r.id)}
                        />
                        <button onClick={() => submitReply(r.id)} disabled={submittingReply === r.id}
                          className="p-2 bg-brand-600 hover:bg-brand-500 rounded-lg transition-colors">
                          {submittingReply === r.id ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* BLOG TAB */}
          {activeTab === 'blog' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {blogPosts.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-sm">No blog posts yet</div>
              ) : (
                blogPosts.map(post => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="card p-5 block hover:border-brand-600/50 transition-colors">
                    {post.cover_url && (
                      <LazyImage src={post.cover_url} alt={post.title} className="w-full h-40 object-cover rounded-xl mb-3" />
                    )}
                    <h3 className="font-semibold text-white mb-1">{post.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{format(new Date(post.created_at), 'dd MMM yyyy')}</span>
                      <span>❤️ {post.like_count}</span>
                      <span>💬 {post.comment_count}</span>
                    </div>
                  </Link>
                ))
              )}
            </motion.div>
          )}
        </div>

        {/* RIGHT — Info sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-display font-bold text-2xl text-white">{escort.name || 'Anonymous'}</h1>
                  {escort.is_verified && <BadgeCheck size={18} className="text-blue-500" />}
                </div>
                {escort.membership && (
                  <span className={TIER_STYLES[escort.membership.tier_name] || 'badge bg-dark-500 text-gray-400'}>
                    {escort.membership.tier_name}
                  </span>
                )}
              </div>
              {/* Favourite button */}
              {user?.role === 'client' && (
                <button onClick={toggleFavourite}
                  className={`p-2.5 rounded-xl border transition-all ${favourited ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-dark-600 text-gray-500 hover:text-red-400 hover:border-red-500/30'}`}>
                  <Heart size={18} fill={favourited ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>

            {/* Rating */}
            {escort.review_count > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-400 text-sm">{STARS_DISPLAY(Math.round(escort.avg_rating))}</span>
                <span className="text-sm text-gray-400">{parseFloat(escort.avg_rating).toFixed(1)} ({escort.review_count} reviews)</span>
              </div>
            )}

            {/* Online status */}
            <div className={`flex items-center gap-1.5 text-sm mb-4 ${escort.is_online ? 'text-green-400' : 'text-gray-500'}`}>
              <span className={`w-2 h-2 rounded-full ${escort.is_online ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
              {escort.is_online ? 'Online now' : `Last seen ${formatDistanceToNow(new Date(escort.last_seen || Date.now()), { addSuffix: true })}`}
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              {[
                { label: 'Age', value: escort.age ? `${escort.age} years` : null },
                { label: 'Gender', value: escort.gender },
                { label: 'Nationality', value: escort.nationality },
                { label: 'Location', value: escort.location || escort.county, icon: MapPin },
              ].filter(d => d.value).map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    {Icon && <Icon size={12} className="text-gray-500" />} {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Rates */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {escort.incalls_rate > 0 && (
                <div className="bg-dark-700 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Incalls</p>
                  <p className="font-mono font-bold text-white">KSh {escort.incalls_rate?.toLocaleString()}</p>
                </div>
              )}
              {escort.outcalls_rate > 0 && (
                <div className="bg-dark-700 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Outcalls</p>
                  <p className="font-mono font-bold text-white">KSh {escort.outcalls_rate?.toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-xs text-gray-600 mb-5">
              <span className="flex items-center gap-1"><Eye size={11} /> {escort.profile_views} views</span>
              <span className="flex items-center gap-1"><Phone size={11} /> {escort.phone_views} phone views</span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button onClick={startChat} disabled={starting}
                className="btn-primary w-full justify-center">
                {starting ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                {starting ? 'Starting...' : `Chat · ⭐${starsPerMsg}/msg`}
              </button>
              {escort.phone && (
                <>
                  <a href={`https://wa.me/${normalizePhone(escort.phone)}?text=${encodeURIComponent(`Hi ${escort.name}, I saw your profile on KenyanScorts and I'm interested in your services.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn-ghost w-full justify-center flex items-center gap-2 text-sm text-green-400 border-green-900 hover:border-green-600"
                    onClick={() => api.post(`/profile/${uuid}/phone-view`).catch(() => {})}>
                    <Phone size={16} /> WhatsApp
                  </a>
                  <a href={`tel:${escort.phone}`}
                    className="btn-ghost w-full justify-center flex items-center gap-2 text-sm"
                    onClick={() => api.post(`/profile/${uuid}/phone-view`).catch(() => {})}>
                    <Phone size={16} /> Call
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Stories preview */}
          {hasStories && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Stories</h3>
              <div className="flex gap-2 overflow-x-auto">
                {stories.slice(0, 4).map((s, i) => (
                  <button key={s.id} onClick={() => setShowStories(true)}
                    className="flex-shrink-0 w-16 h-24 rounded-xl overflow-hidden relative bg-dark-700">
                    {s.type === 'image'
                      ? <LazyImage src={s.url} className="w-full h-full" />
                      : <div className="w-full h-full bg-dark-600 flex items-center justify-center">
                          {s.thumbnail && <LazyImage src={s.thumbnail} className="w-full h-full" />}
                        </div>
                    }
                    {i === 3 && stories.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm font-bold">
                        +{stories.length - 4}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Story viewer */}
      <AnimatePresence>
        {showStories && stories.length > 0 && (
          <StoryViewer
            groups={[{ user_id: escort.user_id, name: escort.name, avatar: photos[0]?.url, uuid, stories }]}
            startGroupIndex={0}
            onClose={() => setShowStories(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
