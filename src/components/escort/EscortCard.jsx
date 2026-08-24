import { Link } from 'react-router-dom'
import { MapPin, Phone, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import LazyImage from '../ui/LazyImage'
import BlueTick from '../ui/BlueTick'
import CardSlider from '../ui/CardSlider'

const TIER_BADGE = {
  VIP:       { label: 'VIP',       cls: 'badge-vip' },
  'Prime VIP': { label: 'Prime VIP', cls: 'badge bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' },
  Prime:     { label: 'Prime',     cls: 'badge-prime' },
  Regular:   { label: 'Regular',   cls: 'badge bg-dark-500 text-gray-400 border border-dark-400' },
}

export default function EscortCard({ escort, index = 0 }) {
  const tier = TIER_BADGE[escort.membership_tier]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/escort/${escort.uuid}`} className="group block card hover:border-brand-600/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-900/30">
        {/* Photo */}
        <div className="relative aspect-[3/4] bg-dark-700 overflow-hidden">
          {escort.primary_photo ? (
            <LazyImage src={escort.primary_photo} alt={escort.name || 'Escort'} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-700 to-dark-800">
              <div className="w-16 h-16 rounded-full bg-dark-500 flex items-center justify-center">
                <Phone size={24} className="text-gray-600" />
              </div>
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            {tier && <span className={tier.cls}>{tier.label}</span>}
            {escort.is_verified && (
              <span className="flex items-center gap-1 bg-dark-900/80 backdrop-blur-sm text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">
                <BlueTick size={12} /> Verified
              </span>
            )}
          </div>

          {/* Online indicator */}
          {escort.is_online && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Online</span>
            </div>
          )}

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-1.5">
              <h3 className="font-display font-semibold text-white text-lg leading-tight">
                {escort.name || 'Anonymous'}
              </h3>
              {escort.is_verified && <BlueTick size={16} />}
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
              <MapPin size={10} />
              <span>{escort.city || escort.county || 'Kenya'}</span>
              {escort.age && <span className="ml-1">• {escort.age} yrs</span>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {escort.incalls_rate ? (
              <span className="text-brand-400 font-medium font-mono">KSh {escort.incalls_rate?.toLocaleString()}/hr</span>
            ) : (
              <span>Rates negotiable</span>
            )}
          </div>
          {escort.services?.length > 0 && (
            <span className="text-xs text-gray-600">{escort.services.length} services</span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
