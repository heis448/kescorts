import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import LazyImage from '../ui/LazyImage'
import AdBanner from '../ads/AdBanner'

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
              <LazyImage src="/logo-mark.png" alt="RedRoom254" className="w-8 h-8 rounded-full object-cover" />
              <span className="font-display font-bold text-white">RedRoom254</span>
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
                  <Link to={`/escorts-in/${c.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="hover:text-brand-400 transition-colors">{c}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Footer ads — full banners (not 32px thumbnails); stacked, centred, never cropped */}
        {footerAds.length > 0 && (
          <div className="border-t border-dark-700 pt-6 mb-6 max-w-3xl mx-auto space-y-3">
            {footerAds.map(ad => <AdBanner key={ad.id} ad={ad} placement="footer" />)}
          </div>
        )}

        <div className="border-t border-dark-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} RedRoom254. All rights reserved.</p>
          <p>Must be 18+ to use this site. An0nOtF Technologies Inc 💎.</p>
        </div>
      </div>
    </footer>
  )
}
