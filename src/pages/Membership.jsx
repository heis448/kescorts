import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Crown, Check, Zap } from 'lucide-react'
import api from '../utils/api'
import useAuthStore from '../store/authStore'
import MpesaModal from '../components/ui/MpesaModal'
import toast from 'react-hot-toast'

const DURATIONS = [
  { days: 3,  label: '3 Days',  key: 'price_3d' },
  { days: 7,  label: '7 Days',  key: 'price_7d' },
  { days: 15, label: '15 Days', key: 'price_15d' },
  { days: 30, label: '30 Days', key: 'price_30d' },
]

const TIER_COLORS = {
  Regular:   'border-dark-500',
  Prime:     'border-purple-500/50',
  'Prime VIP': 'border-fuchsia-500/50',
  VIP:       'border-amber-500/50',
}
const TIER_GLOW = {
  VIP: 'shadow-amber-500/20',
  'Prime VIP': 'shadow-fuchsia-500/20',
  Prime: 'shadow-purple-500/20',
}

export default function Membership() {
  const [tiers, setTiers]       = useState([])
  const [duration, setDuration] = useState(30)
  const [selected, setSelected] = useState(null)
  const [modal, setModal]       = useState(false)
  const { membership, fetchMe } = useAuthStore()

  useEffect(() => {
    api.get('/membership/tiers').then(r => setTiers(r.data)).catch(() => {})
  }, [])

  const handleBuy = (tier) => {
    setSelected(tier)
    setModal(true)
  }

  const handleSuccess = () => {
    toast.success('Membership activated!')
    fetchMe()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 page-enter">
      <div className="text-center mb-10">
        <Crown className="mx-auto text-amber-400 mb-4" size={40} />
        <h1 className="font-display font-bold text-4xl text-white mb-3">Membership Plans</h1>
        <p className="text-gray-500">Choose a plan to activate your profile and start getting clients</p>
      </div>

      {/* Active membership */}
      {membership && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="text-green-400 font-semibold">Active: {membership.tier_name}</p>
            <p className="text-green-400/70 text-sm mt-0.5">
              Expires {new Date(membership.expires_at).toLocaleDateString()}
            </p>
          </div>
          <span className="badge bg-green-500/20 text-green-400 border border-green-500/30">Active</span>
        </div>
      )}

      {/* Duration selector */}
      <div className="flex justify-center gap-2 mb-10">
        {DURATIONS.map(d => (
          <button key={d.days} onClick={() => setDuration(d.days)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              duration === d.days
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'border-dark-500 text-gray-400 hover:border-brand-500 hover:text-white'
            }`}>
            {d.label}
          </button>
        ))}
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier, i) => {
          const priceKey = DURATIONS.find(d => d.days === duration)?.key
          const price = tier[priceKey]
          const isVip = tier.name === 'VIP'

          return (
            <motion.div key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative card border-2 p-6 ${TIER_COLORS[tier.name] || 'border-dark-500'} ${isVip ? `shadow-2xl ${TIER_GLOW[tier.name]}` : ''}`}
            >
              {isVip && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-display font-bold text-lg text-white">{tier.name}</h3>
                <div className="mt-2">
                  <span className="font-mono font-black text-3xl text-white">KSh {price?.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm ml-1">/ {duration} days</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {tier.features?.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                    <Check size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button onClick={() => handleBuy(tier)}
                className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 ${
                  isVip
                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                    : 'bg-dark-600 hover:bg-brand-600 text-white border border-dark-500 hover:border-brand-500'
                }`}>
                <Zap size={14} className="inline mr-1.5" />
                Get {tier.name}
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* M-Pesa modal */}
      {selected && (
        <MpesaModal
          isOpen={modal}
          onClose={() => setModal(false)}
          onSuccess={handleSuccess}
          title={`${selected.name} Membership`}
          amount={selected[DURATIONS.find(d => d.days === duration)?.key]}
          endpoint="/membership/buy"
          verifyEndpoint="/membership/verify"
          payload={{ tier_id: selected.id, duration_days: duration }}
        />
      )}
    </div>
  )
}
