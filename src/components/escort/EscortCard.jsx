import { Link } from 'react-router-dom'
import { MapPin, Phone, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import LazyImage from '../ui/LazyImage'
import BlueTick from '../ui/BlueTick'
import CardSlider from '../ui/CardSlider'

// Solid colours + a soft shadow: readable on bright AND dark photos (the old see-through chips vanished)
const CHIP = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold leading-none shadow-md shadow-black/50'
const TIER_BADGE = {
  VIP:         { label: 'VIP',       cls: `${CHIP} bg-gradient-to-r from-amber-300 to-amber-500 text-black` },
  'Prime VIP': { label: 'Prime VIP', cls: `${CHIP} bg-fuchsia-500 text-white` },
  Prime:       { label: 'Prime',     cls: `${CHIP} bg-sky-500 text-white` },
  Regular:     { label: 'Regular',   cls: `${CHIP} bg-black/75 text-white ring-1 ring-white/30` },
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
          {/* Top badges: tier + ONE status (boosted beats new). Verified is shown as the blue tick by the name. */}
          <div className="absolute top-2.5 left-2.5 right-8 sm:right-20 flex gap-1.5 flex-wrap">
            {tier && <span className={tier.cls}>{tier.label}</span>}
            {escort.is_boosted ? (
              <span className={`${CHIP} bg-orange-500 text-white`}>
                🔥 Boosted
              </span>
            ) : escort.is_new && (
              <span className={`${CHIP} bg-emerald-500 text-white`}>
                ✨ New
              </span>
            )}
          </div>

          {/* Online: just a dot on phones, dot + word on wider screens */}
          {escort.is_online && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5" title="Online now">
              <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse ring-2 ring-dark-900/70" />
              <span className="hidden sm:inline text-xs text-green-400 font-medium">Online</span>
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
            <span className="text-xs text-gray-600">{escort.services.length} {escort.services.length === 1 ? 'service' : 'services'}</span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
