import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'

export default function Footer() {
  const [footerAds, setFooterAds] = useState([])

  useEffect(() => {
    api.get('/search/ads?placement=footer').then(r => setFooterAds(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [])
  return (
    <footer className="bg-dark-900 border-t border-dark-700 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="https://files.catbox.moe/1yhxuh.jpg" alt="KenyaEscorts" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-display font-bold text-white">KenyaEscorts</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Kenya's premium escorts services directory. Safe, discreet, and verified ✅.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Browse</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/escorts" className="hover:text-brand-400 transition-colors">All Escorts</Link></li>
              <li><Link to="/classifieds" className="hover:text-brand-400 transition-colors">Classifieds</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Account</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/register" className="hover:text-brand-400 transition-colors">Register</Link></li>
              <li><Link to="/login" className="hover:text-brand-400 transition-colors">Sign In</Link></li>
              <li><Link to="/membership" className="hover:text-brand-400 transition-colors">Membership</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Popular</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              {['Nairobi','Mombasa','Kisumu','Nakuru','Thika'].map(c => (
                <li key={c}>
                  <Link to={`/escorts?county=${c}`} className="hover:text-brand-400 transition-colors">{c}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Footer ads */}
        {footerAds.length > 0 && (
          <div className="border-t border-dark-700 pt-6 mb-6">
            <div className="flex flex-wrap gap-4 justify-center">
              {footerAds.map(ad => {
                const media = ad.media?.[0]
                return (
                  <a key={ad.id} href={ad.link_url || '#'} target="_blank" rel="noopener noreferrer"
                    onClick={() => api.post(`/admin/ads/${ad.id}/click`).catch(() => {})}
                    className="flex items-center gap-3 bg-dark-800 border border-dark-600 hover:border-brand-500 rounded-xl px-4 py-2.5 transition-colors group">
                    {media && (
                      <img src={media.url} alt={ad.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-white group-hover:text-brand-300 transition-colors">{ad.title}</p>
                      <span className="text-[10px] text-gray-600">Sponsored</span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        <div className="border-t border-dark-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} KenyaEscorts. All rights reserved.</p>
          <p>Must be 18+ to use this site. An0nOtF Technologies Inc 💎.</p>
        </div>
      </div>
    </footer>
  )
}
