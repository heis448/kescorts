import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Eye, ChevronLeft, Loader2, Send, Trash2 } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import api from '../utils/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function BlogPost() {
  const { slug }    = useParams()
  const navigate    = useNavigate()
  const { user }    = useAuthStore()

  const [post, setPost]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [liked, setLiked]         = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comment, setComment]     = useState('')
  const [replyText, setReplyText] = useState({})
  const [posting, setPosting]     = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)

  useEffect(() => {
    api.get(`/blog/${slug}`).then(r => {
      setPost(r.data)
      setLiked(r.data.liked)
      setLikeCount(r.data.like_count)
      setLoading(false)
    }).catch(() => { setLoading(false); navigate('/blog') })
  }, [slug])

  const toggleLike = async () => {
    if (!user) return navigate('/login')
    const { data } = await api.post(`/blog/${post.id}/like`)
    setLiked(data.liked)
    setLikeCount(c => data.liked ? c + 1 : c - 1)
  }

  const postComment = async () => {
    if (!user) return navigate('/login')
    if (!comment.trim()) return
    setPosting(true)
    try {
      const { data } = await api.post(`/blog/${post.id}/comment`, { body: comment })
      setPost(p => ({ ...p, comments: [...(p.comments || []), { ...data, replies: [] }] }))
      setComment('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
    setPosting(false)
  }

  const postReply = async (commentId) => {
    if (!user) return navigate('/login')
    const text = replyText[commentId]
    if (!text?.trim()) return
    try {
      const { data } = await api.post(`/blog/${post.id}/comment`, { body: text, parent_id: commentId })
      setPost(p => ({
        ...p,
        comments: p.comments.map(c => c.id === commentId ? { ...c, replies: [...(c.replies || []), data] } : c)
      }))
      setReplyText(prev => ({ ...prev, [commentId]: '' }))
      setReplyingTo(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
  }

  const deleteComment = async (commentId) => {
    await api.delete(`/blog/comment/${commentId}`)
    setPost(p => ({ ...p, comments: p.comments.filter(c => c.id !== commentId) }))
    toast.success('Deleted')
  }

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!post) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 page-enter">
      <button onClick={() => navigate('/blog')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-white mb-6 transition-colors">
        <ChevronLeft size={16} /> All Posts
      </button>

      {/* Cover */}
      {post.cover_url && (
        <img src={post.cover_url} alt={post.title} className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-6" />
      )}

      {/* Header */}
      <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-4">{post.title}</h1>

      {/* Author + meta */}
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-dark-700">
        <Link to={`/escort/${post.author_uuid}`}>
          <div className="w-10 h-10 rounded-full bg-dark-600 overflow-hidden">
            {post.author_avatar && <img src={post.author_avatar} className="w-full h-full object-cover" />}
          </div>
        </Link>
        <div>
          <Link to={`/escort/${post.author_uuid}`} className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors">
            {post.author_name || 'Escort'}
          </Link>
          <p className="text-xs text-gray-600">{format(new Date(post.created_at), 'dd MMMM yyyy')}</p>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><Eye size={11} /> {post.view_count}</span>
        </div>
      </div>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map(t => (
            <span key={t} className="text-xs px-3 py-1 bg-dark-700 border border-dark-600 text-gray-400 rounded-full">#{t}</span>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-line mb-8">
        {post.body}
      </div>

      {/* Like */}
      <div className="flex items-center gap-4 py-4 border-t border-b border-dark-700 mb-8">
        <motion.button whileTap={{ scale: 1.2 }} onClick={toggleLike}
          className={`flex items-center gap-2 text-sm transition-colors ${liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}>
          <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
          {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
        </motion.button>
        <span className="flex items-center gap-2 text-sm text-gray-500">
          <MessageCircle size={18} /> {post.comments?.length || 0} Comments
        </span>
      </div>

      {/* Comments */}
      <div>
        <h3 className="font-semibold text-white mb-4">Comments</h3>

        {/* Write comment */}
        {user ? (
          <div className="flex gap-2 mb-6">
            <input className="input flex-1 text-sm" placeholder="Write a comment..."
              value={comment} onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()} />
            <button onClick={postComment} disabled={posting || !comment.trim()}
              className="p-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 rounded-xl transition-colors">
              {posting ? <Loader2 size={15} className="animate-spin text-white" /> : <Send size={15} className="text-white" />}
            </button>
          </div>
        ) : (
          <div className="card p-4 text-center mb-6">
            <p className="text-sm text-gray-500"><Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link> to comment</p>
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-4">
          {post.comments?.map(c => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-dark-600 overflow-hidden flex-shrink-0">
                  {c.author_avatar && <img src={c.author_avatar} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{c.author_name || 'User'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                      {user && (user.id === c.user_id || user.role === 'admin') && (
                        <button onClick={() => deleteComment(c.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{c.body}</p>

                  {/* Reply button */}
                  {user && (
                    <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                      className="text-xs text-gray-600 hover:text-brand-400 transition-colors mt-1">
                      Reply
                    </button>
                  )}

                  {/* Replies */}
                  {c.replies?.map(reply => (
                    <div key={reply.id} className="flex items-start gap-2 mt-3 pl-3 border-l border-dark-600">
                      <div className="w-6 h-6 rounded-full bg-dark-600 overflow-hidden flex-shrink-0">
                        {reply.author_avatar && <img src={reply.author_avatar} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-white">{reply.author_name || 'User'}</span>
                        <p className="text-xs text-gray-400">{reply.body}</p>
                      </div>
                    </div>
                  ))}

                  {/* Reply input */}
                  {replyingTo === c.id && (
                    <div className="flex gap-2 mt-2">
                      <input className="input text-xs flex-1 py-2" placeholder="Reply..."
                        value={replyText[c.id] || ''}
                        onChange={e => setReplyText(prev => ({ ...prev, [c.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && postReply(c.id)} />
                      <button onClick={() => postReply(c.id)}
                        className="p-2 bg-brand-600 hover:bg-brand-500 rounded-lg transition-colors">
                        <Send size={12} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
