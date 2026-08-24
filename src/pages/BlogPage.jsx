// ================================================================
// BlogPage.jsx — /blog — public listing
// ================================================================
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Eye, Search, Loader2, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import api from '../utils/api'

export default function BlogPage() {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [tag, setTag]         = useState('')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [total, setTotal]     = useState(0)

  const fetchPosts = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 12 })
    if (tag) params.append('tag', tag)
    api.get(`/blog?${params}`).then(r => {
      setPosts(r.data.posts)
      setTotal(r.data.total)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchPosts() }, [tag, page])

  const filtered = search
    ? posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : posts

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 page-enter">
      <div className="text-center mb-10">
        <h1 className="font-display font-black text-4xl text-white mb-2">Blog</h1>
        <p className="text-gray-500">Stories, tips and guides from our escorts</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mx-auto mb-8">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="input pl-9 text-sm"
          placeholder="Search posts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="text-brand-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
          <p>No blog posts yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post, i) => (
            <motion.div key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/blog/${post.slug}`} className="card overflow-hidden block group hover:border-brand-600/50 transition-all">
                {post.cover_url ? (
                  <img src={post.cover_url} alt={post.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-dark-700 to-dark-600 flex items-center justify-center">
                    <BookOpen size={32} className="text-gray-600" />
                  </div>
                )}
                <div className="p-4">
                  {/* Author */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-dark-600 overflow-hidden flex-shrink-0">
                      {post.author_avatar && <img src={post.author_avatar} className="w-full h-full object-cover" />}
                    </div>
                    <Link to={`/escort/${post.author_uuid}`} onClick={e => e.stopPropagation()} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                      {post.author_name || 'Escort'}
                    </Link>
                    <span className="text-xs text-gray-600 ml-auto">{format(new Date(post.created_at), 'dd MMM')}</span>
                  </div>

                  <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">{post.title}</h3>

                  {/* Tags */}
                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {post.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 bg-dark-600 text-gray-500 rounded-full">#{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
                    <span className="flex items-center gap-1"><Eye size={11} /> {post.view_count}</span>
                    <span className="flex items-center gap-1"><Heart size={11} /> {post.like_count}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={11} /> {post.comment_count}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="btn-ghost px-4">← Prev</button>}
          <span className="text-gray-500 text-sm self-center">Page {page} of {Math.ceil(total / 12)}</span>
          {page * 12 < total && <button onClick={() => setPage(p => p + 1)} className="btn-ghost px-4">Next →</button>}
        </div>
      )}
    </div>
  )
}
